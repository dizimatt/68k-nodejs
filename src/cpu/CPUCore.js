// src/cpu/CPUCore.js - Main CPU Class and State Management

const { setupOpcodeTable } = require('./OpcodeTable');
const { CPUHelpers } = require('./CPUHelpers');
const { CPUInterface } = require('./CPUInterface');
const OpcodeTable = require('./OpcodeTable');

class CPUCore {
    constructor(memory) {
        this.memory = memory;
        
        // CPU State
        this.registers = {
            d: new Uint32Array(8),       // D0-D7 data registers
            a: new Uint32Array(8),       // A0-A7 address registers (A7 = stack)
            pc: 0,                       // Program counter
            sr: 0x2700                   // Status register (supervisor mode)
        };
        
        // CPU Control
        this.running = true;
        this.initialized = false;
        this.cycles = 0;
        this.instructionCount = 0;
        
        // Performance tracking
        this.instructionStats = new Map();
        this.implementedInstructions = new Set();
        
        // Flags (extracted from SR for performance)
        this.flag_c = 0;  // Carry
        this.flag_v = 0;  // Overflow  
        this.flag_z = 0;  // Zero
        this.flag_n = 0;  // Negative
        this.flag_x = 0;  // Extend
        this.flag_s = 1;  // Supervisor
        
        // Initialize opcode table
        this.opcodeTable = new OpcodeTable(this);
//        setupOpcodeTable(this);
        
        // Count implemented opcodes
        for (let i = 0; i < 65536; i++) {
            if (this.opcodeTable.table[i] !== null) {
                this.implementedInstructions.add(i);
            }
        }
        
        console.log('🔧 [CPU] MusashiInspired CPU Core initialized');
        console.log(`📊 [CPU] Implemented opcodes: ${this.implementedInstructions.size}`);
    }
    
    // Main execution methods

    step() {
        if (!this.running || !this.initialized) {
            return { instruction: 'CPU_STOPPED', cycles: 0, finished: true };
        }
        
        const pc = this.registers.pc;
        const opcode = this.fetchWord();
        
        const handler = this.opcodeTable.get(opcode);
        
        // Debug logging for MOVE.L opcode 0x23C0
        if (opcode === 0x23C0) {
            console.log(`🔍 [DEBUG] Opcode 0x23C0 handler:`, handler ? handler.name : 'null');
            console.log(`🔍 [DEBUG] Handler function:`, handler ? handler.toString().substring(0, 100) : 'null');
        }
        
        if (handler) {
            // *** This is where the enhanced data comes from ***
            const result = handler();
            
            // Check if result is valid
            if (!result || typeof result !== 'object') {
                console.log(`❌ [CPU] Handler returned invalid result for opcode: 0x${opcode.toString(16).padStart(4, '0')} at PC=0x${pc.toString(16)}`);
                console.log(`❌ [CPU] Result:`, result);
                this.running = false;
                return {
                    instruction: `ERR_${opcode.toString(16)}`,
                    cycles: 4,
                    finished: true,
                    error: true
                };
            }
            
            // Check if result has required properties
            if (!result.name) {
                console.log(`❌ [CPU] Handler result missing 'name' property for opcode: 0x${opcode.toString(16).padStart(4, '0')} at PC=0x${pc.toString(16)}`);
                console.log(`❌ [CPU] Result:`, result);
                this.running = false;
                return {
                    instruction: `NONAME_${opcode.toString(16)}`,
                    cycles: result.cycles || 4,
                    finished: true,
                    error: true
                };
            }
                        
            this.instructionCount++;
            this.updateStats(result.name);
            this.updateSRFromFlags();
            
            // *** CRUCIAL: Return ALL the data from the opcode handler ***
            return {
                instruction: result.name,
                cycles: result.cycles,
                finished: false,
                pc: pc,
                opcode: opcode,
                // *** PASS THROUGH ALL ENHANCED DATA ***
                asm: result.asm,                    // ← Add this
                description: result.description,    // ← Add this
                oldValue: result.oldValue,          // ← Add this
                newValue: result.newValue,          // ← Add this (crucial!)
                target: result.target,              // ← Add this
                immediate: result.immediate         // ← Add this
            };
        } else {
            console.log(`❌ [CPU] Unknown opcode: 0x${opcode.toString(16).padStart(4, '0')} at PC=0x${pc.toString(16)}`);
            this.running = false;
            return {
                instruction: `UNK_${opcode.toString(16)}`,
                cycles: 4,
                finished: true,
                error: true
            };
        }
    }    
    run(maxCycles = 10000) {
        let totalCycles = 0;
        
        while (this.running && totalCycles < maxCycles) {
            const result = this.step();
            totalCycles += result.cycles;
            
            if (result.finished || result.error) {
                break;
            }
        }
        
        return {
            cycles: totalCycles,
            instructions: this.instructionCount,
            finished: !this.running || totalCycles >= maxCycles
        };
    }
    
    updateStats(instructionName) {
        this.instructionStats.set(instructionName, (this.instructionStats.get(instructionName) || 0) + 1);
    }
    
    // Preview the next instruction without executing it
    peekNextInstruction() {
        if (!this.running) {
            return {
                instruction: 'STOPPED',
                asm: 'STOPPED',
                description: 'CPU is not running'
            };
        }
        
        try {
            const pc = this.registers.pc;
            const opcode = this.memory.readWord(pc);
            const handler = this.opcodeTable.get(opcode);
            
            if (handler) {
                // Try to create a basic instruction description without executing
                // We'll enhance this by analyzing opcode patterns
                const instruction = this.decodeInstructionName(opcode);
                return {
                    instruction: instruction.name,
                    asm: instruction.asm,
                    description: instruction.description,
                    pc: pc,
                    opcode: opcode
                };
            } else {
                return {
                    instruction: `UNK_${opcode.toString(16)}`,
                    asm: `DC.W $${opcode.toString(16).padStart(4, '0').toUpperCase()}`,
                    description: 'Unknown instruction',
                    pc: pc,
                    opcode: opcode
                };
            }
        } catch (error) {
            return {
                instruction: 'ERROR',
                asm: 'ERROR',
                description: 'Cannot read memory at PC'
            };
        }
    }
    
    // Decode instruction name from opcode without executing
    decodeInstructionName(opcode) {
        // Basic opcode pattern matching for common instructions
        const high4 = (opcode >> 12) & 0xF;
        const high8 = (opcode >> 8) & 0xFF;
        
        // MOVEQ #imm,Dn
        if ((opcode & 0xF100) === 0x7000) {
            const reg = (opcode >> 9) & 7;
            const data = opcode & 0xFF;
            const signedData = (data & 0x80) ? (data | 0xFFFFFF00) : data;
            return {
                name: `MOVEQ #${signedData},D${reg}`,
                asm: `MOVEQ #${signedData},D${reg}`,
                description: 'Move quick immediate to data register'
            };
        }
        
        // MOVE instructions (0x1000, 0x2000, 0x3000)
        if (high4 >= 1 && high4 <= 3) {
            const size = high4 === 1 ? 'B' : (high4 === 2 ? 'L' : 'W');
            
            // Extract addressing mode information
            const srcMode = (opcode >> 3) & 0x7;
            const srcReg = opcode & 0x7;
            const dstMode = (opcode >> 6) & 0x7;
            const dstReg = (opcode >> 9) & 0x7;
            
            // Format source and destination operands
            const srcEA = this.formatEA(srcMode, srcReg);
            const dstEA = this.formatEA(dstMode, dstReg);
            
            return {
                name: `MOVE.${size} ${srcEA},${dstEA}`,
                asm: `MOVE.${size} ${srcEA},${dstEA}`,
                description: `Move ${size === 'B' ? 'byte' : (size === 'W' ? 'word' : 'long')}`
            };
        }
        
        // NOP
        if (opcode === 0x4E71) {
            return {
                name: 'NOP',
                asm: 'NOP',
                description: 'No operation'
            };
        }
        
        // RTS
        if (opcode === 0x4E75) {
            return {
                name: 'RTS',
                asm: 'RTS',
                description: 'Return from subroutine'
            };
        }
        
        // RTE
        if (opcode === 0x4E73) {
            return {
                name: 'RTE',
                asm: 'RTE',
                description: 'Return from exception'
            };
        }
        
        // RESET
        if (opcode === 0x4E70) {
            return {
                name: 'RESET',
                asm: 'RESET',
                description: 'Reset external devices'
            };
        }
        
        // JSR
        if ((opcode & 0xFFC0) === 0x4E80) {
            return {
                name: 'JSR',
                asm: 'JSR',
                description: 'Jump to subroutine'
            };
        }
        
        // JSR absolute.W
        if (opcode === 0x4EB8) {
            return {
                name: 'JSR',
                asm: 'JSR',
                description: 'Jump to subroutine absolute word'
            };
        }
        
        // JSR absolute.L
        if (opcode === 0x4EB9) {
            return {
                name: 'JSR',
                asm: 'JSR',
                description: 'Jump to subroutine absolute long'
            };
        }
        
        // JSR (d16,PC)
        if (opcode === 0x4EBA) {
            return {
                name: 'JSR',
                asm: 'JSR',
                description: 'Jump to subroutine PC-relative'
            };
        }
        
        // JMP absolute.L
        if (opcode === 0x4EF9) {
            return {
                name: 'JMP',
                asm: 'JMP',
                description: 'Jump to absolute long address'
            };
        }
        
        // TRAP #vector (0x4E40-0x4E4F)
        if ((opcode & 0xFFF0) === 0x4E40) {
            const vector = opcode & 0xF;
            return {
                name: `TRAP #${vector}`,
                asm: `TRAP #${vector}`,
                description: 'System call trap'
            };
        }
        
        // Branch instructions (0x6000-0x6FFF)
        if ((opcode & 0xF000) === 0x6000) {
            const condition = (opcode >> 8) & 0xF;
            const displacement = opcode & 0xFF;
            const condNames = ['RA', 'SR', 'HI', 'LS', 'CC', 'CS', 'NE', 'EQ', 'VC', 'VS', 'PL', 'MI', 'GE', 'LT', 'GT', 'LE'];
            return {
                name: `B${condNames[condition]}`,
                asm: `B${condNames[condition]}`,
                description: 'Conditional branch'
            };
        }
        
        // CMPI
        if ((opcode & 0xFF00) === 0x0C00) {
            const size = ((opcode >> 6) & 3) === 0 ? 'B' : (((opcode >> 6) & 3) === 1 ? 'W' : 'L');
            return {
                name: `CMPI.${size}`,
                asm: `CMPI.${size}`,
                description: `Compare immediate ${size === 'B' ? 'byte' : (size === 'W' ? 'word' : 'long')}`
            };
        }
        
        // DBcc instructions (0x50C8-0x5FC8)
        if ((opcode & 0xF0F8) === 0x50C8) {
            const condition = (opcode >> 8) & 0xF;
            const reg = opcode & 0x7;
            const condNames = ['RA', 'SR', 'HI', 'LS', 'CC', 'CS', 'NE', 'EQ', 'VC', 'VS', 'PL', 'MI', 'GE', 'LT', 'GT', 'LE'];
            return {
                name: `DB${condNames[condition]} D${reg}`,
                asm: `DB${condNames[condition]} D${reg}`,
                description: 'Decrement and branch on condition'
            };
        }
        
        // LEA instructions (0x41C0-0x47FF range)
        if ((opcode & 0xF1C0) === 0x41C0) {
            const dstReg = (opcode >> 9) & 0x7;
            const mode = (opcode >> 3) & 0x7;
            const srcReg = opcode & 0x7;
            
            if (mode === 7 && srcReg === 2) {
                // LEA (d16,PC),An
                return {
                    name: `LEA (d16,PC),A${dstReg}`,
                    asm: `LEA (d16,PC),A${dstReg}`,
                    description: 'Load effective address PC-relative'
                };
            } else if (mode === 2) {
                // LEA (An),Am
                return {
                    name: `LEA (A${srcReg}),A${dstReg}`,
                    asm: `LEA (A${srcReg}),A${dstReg}`,
                    description: 'Load effective address register indirect'
                };
            } else {
                return {
                    name: `LEA <ea>,A${dstReg}`,
                    asm: `LEA <ea>,A${dstReg}`,
                    description: 'Load effective address'
                };
            }
        }
        
        // Generic fallback
        return {
            name: `OP_${opcode.toString(16).padStart(4, '0').toUpperCase()}`,
            asm: `DC.W $${opcode.toString(16).padStart(4, '0').toUpperCase()}`,
            description: 'Unknown instruction pattern'
        };
    }
}

// Mix in helper methods and interface
Object.assign(CPUCore.prototype, CPUHelpers);
Object.assign(CPUCore.prototype, CPUInterface);

module.exports = { CPUCore };