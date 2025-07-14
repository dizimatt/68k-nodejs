// src/cpu/CPUCore.js - Main CPU Class and State Management

const { setupOpcodeTable } = require('./OpcodeTable');
const { CPUHelpers } = require('./CPUHelpers');
const { CPUInterface } = require('./CPUInterface');

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
        this.opcodeTable = setupOpcodeTable(this);
        
        // Count implemented opcodes
        for (let i = 0; i < 65536; i++) {
            if (this.opcodeTable[i] !== null) {
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
        
        const handler = this.opcodeTable[opcode];
        
        if (handler) {
            // *** This is where the enhanced data comes from ***
            const result = handler();
                        
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
            const handler = this.opcodeTable[opcode];
            
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
            return {
                name: `MOVE.${size}`,
                asm: `MOVE.${size}`,
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
        
        // JSR
        if ((opcode & 0xFFC0) === 0x4E80) {
            return {
                name: 'JSR',
                asm: 'JSR',
                description: 'Jump to subroutine'
            };
        }
        
        // Branch instructions (0x6000-0x6FFF)
        if ((opcode & 0xF000) === 0x6000) {
            const condition = (opcode >> 8) & 0xF;
            const displacement = opcode & 0xFF;
            const condNames = ['RA', 'SR', 'HI', 'LS', 'CC', 'CS', 'NE', 'EQ', 'VC', 'VS', 'PL', 'MI', 'GE', 'LT', 'GT', 'LE'];
            return {
                name: `B${condNames[condition]}`,
                asm: `B${condNames[condition]} *+${displacement}`,
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
                asm: `DB${condNames[condition]} D${reg},*+displacement`,
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