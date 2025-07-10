// src/cpu/opcodes/BasicOpcodes.js - Basic CPU Operations (FIXED)

const BasicOpcodes = {
    setup(opcodeTable, cpu) {
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
    },
    
    // Basic opcode implementations
    op_nop() {
        this.cycles += 4;
        return { name: 'NOP', cycles: 4 };
    },
    
    op_rts() {
        // FIXED: RTS should pull a word (16-bit), not long (32-bit)
        // This matches the behavior of JSR which pushes a word
        const returnAddr = this.pullWord();
        this.registers.pc = returnAddr >>> 0;
        this.cycles += 16;
        
        // Debug logging
        console.log(`🔄 [CPU] RTS: Return to PC=0x${returnAddr.toString(16).padStart(4, '0')}`);
        
        // Check if this is an exit condition (returning to low memory)
        if (returnAddr <= 0x10) {
            console.log('🏁 [CPU] RTS to exit address - program finished');
            this.running = false;
            return { name: 'RTS', cycles: 16, finished: true };
        }
        
        return { name: 'RTS', cycles: 16 };
    },
    
    op_rte() {
        if (!this.flag_s) {
            this.exception_privilege_violation();
            return { name: 'RTE', cycles: 4, exception: true };
        }
        this.registers.sr = this.pullWord();
        this.updateFlagsFromSR();
        this.registers.pc = this.pullLong();
        this.cycles += 20;
        return { name: 'RTE', cycles: 20 };
    },
    
    op_reset() {
        if (!this.flag_s) {
            this.exception_privilege_violation();
            return { name: 'RESET', cycles: 4, exception: true };
        }
        this.cycles += 132;
        return { name: 'RESET', cycles: 132 };
    }
};

module.exports = { BasicOpcodes };