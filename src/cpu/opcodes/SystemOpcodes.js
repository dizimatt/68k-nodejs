// src/cpu/opcodes/SystemOpcodes.js - System Operations

const SystemOpcodes = {
    setup(opcodeTable, cpu) {
        console.log('🔧 [CPU] Setting up system opcodes...');
        
        // JSR (An) - Jump to Subroutine
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4E90 | reg;
            opcodeTable[opcode] = () => this.op_jsr_a.call(cpu, reg);
        }
        
        // JSR absolute.W
        opcodeTable[0x4EB8] = () => this.op_jsr_aw.call(cpu);
        
        // JSR absolute.L
        opcodeTable[0x4EB9] = () => this.op_jsr_al.call(cpu);
        
        // LEA (An),Am - Load Effective Address
        for (let srcReg = 0; srcReg < 8; srcReg++) {
            for (let dstReg = 0; dstReg < 8; dstReg++) {
                const opcode = 0x41D0 | (dstReg << 9) | srcReg;
                opcodeTable[opcode] = () => this.op_lea_a_a.call(cpu, srcReg, dstReg);
            }
        }
        
        // PEA (An) - Push Effective Address
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4850 | reg;
            opcodeTable[opcode] = () => this.op_pea_a.call(cpu, reg);
        }
        
        // TRAP #vector
        for (let vector = 0; vector < 16; vector++) {
            const opcode = 0x4E40 | vector;
            opcodeTable[opcode] = () => this.op_trap.call(cpu, vector);
        }
        
        console.log('✅ [CPU] System opcodes setup complete');
    },
    
    // System opcode implementations
    op_jsr_a(reg) {
        const target = this.registers.a[reg];
        this.pushLong(this.registers.pc);
        this.registers.pc = target >>> 0;
        this.cycles += 16;
        return { name: `JSR (A${reg})`, cycles: 16 };
    },
    
    op_jsr_aw() {
        const target = this.fetchWord();
        this.pushLong(this.registers.pc);
        this.registers.pc = target >>> 0;
        this.cycles += 18;
        return { name: `JSR $${target.toString(16)}`, cycles: 18 };
    },
    
    op_jsr_al() {
        const target = this.fetchLong();
        this.pushLong(this.registers.pc);
        this.registers.pc = target >>> 0;
        this.cycles += 20;
        return { name: `JSR $${target.toString(16)}`, cycles: 20 };
    },
    
    op_lea_a_a(srcReg, dstReg) {
        this.registers.a[dstReg] = this.registers.a[srcReg];
        this.cycles += 4;
        return { name: `LEA (A${srcReg}),A${dstReg}`, cycles: 4 };
    },
    
    op_pea_a(reg) {
        const address = this.registers.a[reg];
        this.pushLong(address);
        this.cycles += 12;
        return { name: `PEA (A${reg})`, cycles: 12 };
    },
    
    op_trap(vector) {
        console.log(`🚨 [CPU] TRAP #${vector} - System call`);
        
        // In a full implementation, this would vector to trap handlers
        // For now, we'll just log it and continue
        this.cycles += 34;
        return { name: `TRAP #${vector}`, cycles: 34 };
    }
};

module.exports = { SystemOpcodes };