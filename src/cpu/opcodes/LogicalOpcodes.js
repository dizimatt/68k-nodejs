// src/cpu/opcodes/LogicalOpcodes.js - Logical Operations

class LogicalOpcodes {
    constructor(cpu) {
        this.cpu = cpu;
    }

    setup(opcodeTable) {
        const cpu = this.cpu;
        console.log('🔧 [CPU] Setting up logical opcodes...');
        
        // AND.W Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xC000 | (dst << 9) | 0x40 | src;
                opcodeTable[opcode] = () => this.op_and_w_d_d.call(cpu, src, dst);
            }
        }
        
        // OR.W Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x8000 | (dst << 9) | 0x40 | src;
                opcodeTable[opcode] = () => this.op_or_w_d_d.call(cpu, src, dst);
            }
        }
        
        // EOR.W Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xB100 | (src << 9) | 0x40 | dst;
                opcodeTable[opcode] = () => this.op_eor_w_d_d.call(cpu, src, dst);
            }
        }
        
        // NOT.W Dn
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4640 | reg;
            opcodeTable[opcode] = () => this.op_not_w_d.call(cpu, reg);
        }
        
        // CLR.W Dn
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4240 | reg;
            opcodeTable[opcode] = () => this.op_clr_w_d.call(cpu, reg);
        }
        
        // TST.L Dn - Test long data register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4A80 | reg;
            opcodeTable[opcode] = () => this.op_tst_l_d.call(cpu, reg);
        }
        
        // TST.W Dn - Test word data register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4A40 | reg;
            opcodeTable[opcode] = () => this.op_tst_w_d.call(cpu, reg);
        }
        
        console.log('✅ [CPU] Logical opcodes setup complete');
    }
    
    // Logical opcode implementations
    op_and_w_d_d(src, dst) {
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = srcVal & dstVal;
        
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFF0000) | result;
        this.setFlagsLogic16(result);
        this.cycles += 4;
        return { name: `AND.W D${src},D${dst}`, cycles: 4 };
    }
    
    op_or_w_d_d(src, dst) {
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = srcVal | dstVal;
        
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFF0000) | result;
        this.setFlagsLogic16(result);
        this.cycles += 4;
        return { name: `OR.W D${src},D${dst}`, cycles: 4 };
    }
    
    op_eor_w_d_d(src, dst) {
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = srcVal ^ dstVal;
        
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFF0000) | result;
        this.setFlagsLogic16(result);
        this.cycles += 4;
        return { name: `EOR.W D${src},D${dst}`, cycles: 4 };
    }
    
    op_not_w_d(reg) {
        const value = this.registers.d[reg] & 0xFFFF;
        const result = (~value) & 0xFFFF;
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | result;
        this.setFlagsLogic16(result);
        this.cycles += 4;
        return { name: `NOT.W D${reg}`, cycles: 4 };
    }
    
    op_clr_w_d(reg) {
        this.registers.d[reg] = this.registers.d[reg] & 0xFFFF0000;
        this.flag_z = 1;
        this.flag_n = 0;
        this.flag_c = 0;
        this.flag_v = 0;
        this.cycles += 4;
        return { name: `CLR.W D${reg}`, cycles: 4 };
    }
    
    op_tst_l_d(reg) {
        const pc = this.registers.pc - 2;
        const value = this.registers.d[reg];
        
        // Set flags based on the value
        this.flag_z = (value === 0) ? 1 : 0;
        this.flag_n = (value & 0x80000000) ? 1 : 0;
        this.flag_c = 0;
        this.flag_v = 0;
        
        // Debug logging
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: TST.L D${reg}              ; Test long D${reg}`);
        console.log(`       → D${reg}: 0x${value.toString(16).padStart(8, '0')} (${value})`);
        console.log(`       → Flags: Z=${this.flag_z}, N=${this.flag_n}, C=${this.flag_c}, V=${this.flag_v}`);
        
        this.cycles += 4;
        return {
            name: `TST.L D${reg}`,
            cycles: 4,
            asm: `TST.L D${reg}`,
            description: `Test long data register D${reg}`,
            pc: pc,
            value: value
        };
    }
    
    op_tst_w_d(reg) {
        const pc = this.registers.pc - 2;
        const value = this.registers.d[reg] & 0xFFFF;
        
        // Set flags based on the value
        this.flag_z = (value === 0) ? 1 : 0;
        this.flag_n = (value & 0x8000) ? 1 : 0;
        this.flag_c = 0;
        this.flag_v = 0;
        
        // Debug logging
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: TST.W D${reg}              ; Test word D${reg}`);
        console.log(`       → D${reg}: 0x${value.toString(16).padStart(4, '0')} (${value})`);
        console.log(`       → Flags: Z=${this.flag_z}, N=${this.flag_n}, C=${this.flag_c}, V=${this.flag_v}`);
        
        this.cycles += 4;
        return {
            name: `TST.W D${reg}`,
            cycles: 4,
            asm: `TST.W D${reg}`,
            description: `Test word data register D${reg}`,
            pc: pc,
            value: value
        };
    }
}

module.exports = LogicalOpcodes;