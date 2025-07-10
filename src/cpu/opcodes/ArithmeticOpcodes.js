// src/cpu/opcodes/ArithmeticOpcodes.js - Arithmetic Operations

const ArithmeticOpcodes = {
    setup(opcodeTable, cpu) {
        console.log('🔧 [CPU] Setting up arithmetic opcodes...');
        
        // ADD.W Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xD000 | (dst << 9) | 0x40 | src;
                opcodeTable[opcode] = () => this.op_add_w_d_d.call(cpu, src, dst);
            }
        }
        
        // SUB.W Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x9000 | (dst << 9) | 0x40 | src;
                opcodeTable[opcode] = () => this.op_sub_w_d_d.call(cpu, src, dst);
            }
        }
        
        // CMP.W Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xB000 | (dst << 9) | 0x40 | src;
                opcodeTable[opcode] = () => this.op_cmp_w_d_d.call(cpu, src, dst);
            }
        }
        
        // ADDQ.W #imm,Dn
        for (let data = 1; data <= 8; data++) {
            for (let reg = 0; reg < 8; reg++) {
                const dataField = (data === 8) ? 0 : data;
                const opcode = 0x5040 | (dataField << 9) | reg;
                opcodeTable[opcode] = () => this.op_addq_w_d.call(cpu, data, reg);
            }
        }
        
        // SUBQ.W #imm,Dn
        for (let data = 1; data <= 8; data++) {
            for (let reg = 0; reg < 8; reg++) {
                const dataField = (data === 8) ? 0 : data;
                const opcode = 0x5140 | (dataField << 9) | reg;
                opcodeTable[opcode] = () => this.op_subq_w_d.call(cpu, data, reg);
            }
        }
        
        console.log('✅ [CPU] Arithmetic opcodes setup complete');
    },
    
    // Arithmetic opcode implementations
    op_add_w_d_d(src, dst) {
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = srcVal + dstVal;
        
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFF0000) | (result & 0xFFFF);
        this.setFlagsAdd16(srcVal, dstVal, result);
        this.cycles += 4;
        return { name: `ADD.W D${src},D${dst}`, cycles: 4 };
    },
    
    op_sub_w_d_d(src, dst) {
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = dstVal - srcVal;
        
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFF0000) | (result & 0xFFFF);
        this.setFlagsSub16(dstVal, srcVal, result);
        this.cycles += 4;
        return { name: `SUB.W D${src},D${dst}`, cycles: 4 };
    },
    
    op_cmp_w_d_d(src, dst) {
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = dstVal - srcVal;
        
        this.setFlagsSub16(dstVal, srcVal, result);
        this.cycles += 4;
        return { name: `CMP.W D${src},D${dst}`, cycles: 4 };
    },
    
    op_addq_w_d(data, reg) {
        const dstVal = this.registers.d[reg] & 0xFFFF;
        const result = dstVal + data;
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | (result & 0xFFFF);
        this.setFlagsAdd16(data, dstVal, result);
        this.cycles += 4;
        return { name: `ADDQ.W #${data},D${reg}`, cycles: 4 };
    },
    
    op_subq_w_d(data, reg) {
        const dstVal = this.registers.d[reg] & 0xFFFF;
        const result = dstVal - data;
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | (result & 0xFFFF);
        this.setFlagsSub16(dstVal, data, result);
        this.cycles += 4;
        return { name: `SUBQ.W #${data},D${reg}`, cycles: 4 };
    }
};

module.exports = { ArithmeticOpcodes };