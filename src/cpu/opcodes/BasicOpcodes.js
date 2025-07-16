// src/cpu/opcodes/BasicOpcodes.js - Basic CPU Operations (WITH DEBUG LOGGING)

class BasicOpcodes {

    constructor(cpu) {
        this.cpu = cpu;
    }

    setup(opcodeTable) {
        const cpu = this.cpu;
        console.log('🔧 [CPU] Setting up basic opcodes...');
        
        // NOP - No Operation
        opcodeTable[0x4E71] = () => this.op_nop.call(cpu);
        
        // RTS - Return from Subroutine
        opcodeTable[0x4E75] = () => this.op_rts.call(cpu);
        
        // RTE - Return from Exception
        opcodeTable[0x4E73] = () => this.op_rte.call(cpu);
        
        // RESET - Reset External Devices
        opcodeTable[0x4E70] = () => this.op_reset.call(cpu);
        
        console.log('✅ [CPU] Basic opcodes setup complete');
    }
    
    // Basic opcode implementations
    op_nop() {
        const pc = this.registers.pc - 2; // PC was already advanced
        
        // Debug logging
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: NOP                    ; No operation`);
        
        this.cycles += 4;
        return { 
            name: 'NOP', 
            cycles: 4,
            asm: 'NOP',
            description: 'No operation',
            pc: pc
        };
    }
    
    op_rts() {
        const pc = this.registers.pc - 2; // PC was already advanced
        const returnAddr = this.pullLong();
        
        // Debug logging
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: RTS                    ; Return from subroutine`);
        console.log(`       → Return address: 0x${returnAddr.toString(16).padStart(8, '0')}`);
        
        this.registers.pc = returnAddr >>> 0;
        this.cycles += 16;
        
        // Check if this is an exit condition (returning to low memory)
        if (returnAddr <= 0x10) {
            console.log(`🏁 [EXEC] Program completed - RTS to exit address 0x${returnAddr.toString(16).padStart(4, '0')}`);
            this.running = false;
            return { 
                name: 'RTS', 
                cycles: 16, 
                finished: true,
                asm: 'RTS',
                description: 'Return from subroutine (EXIT)',
                pc: pc,
                target: returnAddr
            };
        }
        
        return { 
            name: 'RTS', 
            cycles: 16,
            asm: 'RTS',
            description: 'Return from subroutine',
            pc: pc,
            target: returnAddr
        };
    }
    
    op_rte() {
        const pc = this.registers.pc - 2;
        
        if (!this.flag_s) {
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: RTE                    ; PRIVILEGE VIOLATION!`);
            this.exception_privilege_violation();
            return { 
                name: 'RTE', 
                cycles: 4, 
                exception: true,
                asm: 'RTE',
                description: 'Return from exception (PRIVILEGE VIOLATION)',
                pc: pc
            };
        }
        
        const oldSR = this.registers.sr;
        this.registers.sr = this.pullWord();
        this.updateFlagsFromSR();
        const returnAddr = this.pullLong();
        this.registers.pc = returnAddr;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: RTE                    ; Return from exception`);
        console.log(`       → Old SR: 0x${oldSR.toString(16).padStart(4, '0')}, New SR: 0x${this.registers.sr.toString(16).padStart(4, '0')}`);
        console.log(`       → Return address: 0x${returnAddr.toString(16).padStart(8, '0')}`);
        
        this.cycles += 20;
        return { 
            name: 'RTE', 
            cycles: 20,
            asm: 'RTE',
            description: 'Return from exception',
            pc: pc,
            target: returnAddr
        };
    }
    
    op_reset() {
        const pc = this.registers.pc - 2;
        
        if (!this.flag_s) {
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: RESET                  ; PRIVILEGE VIOLATION!`);
            this.exception_privilege_violation();
            return { 
                name: 'RESET', 
                cycles: 4, 
                exception: true,
                asm: 'RESET',
                description: 'Reset external devices (PRIVILEGE VIOLATION)',
                pc: pc
            };
        }
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: RESET                  ; Reset external devices`);
        
        this.cycles += 132;
        return { 
            name: 'RESET', 
            cycles: 132,
            asm: 'RESET',
            description: 'Reset external devices',
            pc: pc
        };
    }
}

module.exports = BasicOpcodes;