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
        const opcode = this.fetchWord(); // Use this.fetchWord() instead of CPUHelpers.fetchWord()
        
        const handler = this.opcodeTable[opcode];
        
        if (handler) {
            const result = handler();
            this.instructionCount++;
            this.updateStats(result.name);
            this.updateSRFromFlags(); // Use this.updateSRFromFlags() instead of CPUHelpers.updateSRFromFlags()
            
            return {
                instruction: result.name,
                cycles: result.cycles,
                finished: false,
                pc: pc,
                opcode: opcode
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
}

// Mix in helper methods and interface
Object.assign(CPUCore.prototype, CPUHelpers);
Object.assign(CPUCore.prototype, CPUInterface);

module.exports = { CPUCore };