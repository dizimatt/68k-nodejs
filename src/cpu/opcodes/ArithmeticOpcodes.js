// src/cpu/opcodes/ArithmeticOpcodes.js - Arithmetic Operations (FIXED)

const ArithmeticOpcodes = {
    setup(opcodeTable, cpu) {
        console.log('🔧 [CPU] Setting up arithmetic opcodes...');
        
        // ADD.W Dn,Dm - FIXED: Correct opcode pattern
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xD040 | (dst << 9) | src;  // FIXED: D040 pattern
                opcodeTable[opcode] = () => this.op_add_w_d_d.call(cpu, src, dst);
            }
        }
        
        // ADD.L Dn,Dm - FIXED: Add long word addition
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xD080 | (dst << 9) | src;  // FIXED: D080 pattern
                opcodeTable[opcode] = () => this.op_add_l_d_d.call(cpu, src, dst);
            }
        }
        
        // SUB.W Dn,Dm - FIXED: Correct opcode pattern
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x9040 | (dst << 9) | src;  // FIXED: 9040 pattern
                opcodeTable[opcode] = () => this.op_sub_w_d_d.call(cpu, src, dst);
            }
        }
        
        // SUB.L Dn,Dm - FIXED: Add long word subtraction
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x9080 | (dst << 9) | src;  // FIXED: 9080 pattern
                opcodeTable[opcode] = () => this.op_sub_l_d_d.call(cpu, src, dst);
            }
        }
        
        // CMP.W Dn,Dm - FIXED: Correct opcode pattern
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xB040 | (dst << 9) | src;  // FIXED: B040 pattern
                opcodeTable[opcode] = () => this.op_cmp_w_d_d.call(cpu, src, dst);
            }
        }
        
        // CMP.L Dn,Dm - FIXED: Add long word compare
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xB080 | (dst << 9) | src;  // FIXED: B080 pattern
                opcodeTable[opcode] = () => this.op_cmp_l_d_d.call(cpu, src, dst);
            }
        }
        
        // ADDQ.W #imm,Dn - This was mostly correct
        for (let data = 1; data <= 8; data++) {
            for (let reg = 0; reg < 8; reg++) {
                const dataField = (data === 8) ? 0 : data;
                const opcode = 0x5040 | (dataField << 9) | reg;
                opcodeTable[opcode] = () => this.op_addq_w_d.call(cpu, data, reg);
            }
        }
        
        // ADDQ.L #imm,Dn - FIXED: Add long word quick add
        for (let data = 1; data <= 8; data++) {
            for (let reg = 0; reg < 8; reg++) {
                const dataField = (data === 8) ? 0 : data;
                const opcode = 0x5080 | (dataField << 9) | reg;
                opcodeTable[opcode] = () => this.op_addq_l_d.call(cpu, data, reg);
            }
        }
        
        // SUBQ.W #imm,Dn - This was mostly correct
        for (let data = 1; data <= 8; data++) {
            for (let reg = 0; reg < 8; reg++) {
                const dataField = (data === 8) ? 0 : data;
                const opcode = 0x5140 | (dataField << 9) | reg;
                opcodeTable[opcode] = () => this.op_subq_w_d.call(cpu, data, reg);
            }
        }
        
        // SUBQ.L #imm,Dn - FIXED: Add long word quick subtract
        for (let data = 1; data <= 8; data++) {
            for (let reg = 0; reg < 8; reg++) {
                const dataField = (data === 8) ? 0 : data;
                const opcode = 0x5180 | (dataField << 9) | reg;
                opcodeTable[opcode] = () => this.op_subq_l_d.call(cpu, data, reg);
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
    
    // FIXED: Add missing ADD.L implementation
    op_add_l_d_d(src, dst) {
        const srcVal = this.registers.d[src] >>> 0;
        const dstVal = this.registers.d[dst] >>> 0;
        const result = (srcVal + dstVal) >>> 0;
        
        this.registers.d[dst] = result;
        this.setFlagsAdd32(srcVal, dstVal, result);
        this.cycles += 8;
        return { name: `ADD.L D${src},D${dst}`, cycles: 8 };
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
    
    // FIXED: Add missing SUB.L implementation
    op_sub_l_d_d(src, dst) {
        const srcVal = this.registers.d[src] >>> 0;
        const dstVal = this.registers.d[dst] >>> 0;
        const result = (dstVal - srcVal) >>> 0;
        
        this.registers.d[dst] = result;
        this.setFlagsSub32(dstVal, srcVal, result);
        this.cycles += 8;
        return { name: `SUB.L D${src},D${dst}`, cycles: 8 };
    },
    
    op_cmp_w_d_d(src, dst) {
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = dstVal - srcVal;
        
        this.setFlagsSub16(dstVal, srcVal, result);
        this.cycles += 4;
        return { name: `CMP.W D${src},D${dst}`, cycles: 4 };
    },
    
    // FIXED: Add missing CMP.L implementation
    op_cmp_l_d_d(src, dst) {
        const srcVal = this.registers.d[src] >>> 0;
        const dstVal = this.registers.d[dst] >>> 0;
        const result = (dstVal - srcVal) >>> 0;
        
        this.setFlagsSub32(dstVal, srcVal, result);
        this.cycles += 6;
        return { name: `CMP.L D${src},D${dst}`, cycles: 6 };
    },
    
    op_addq_w_d(data, reg) {
        const dstVal = this.registers.d[reg] & 0xFFFF;
        const result = dstVal + data;
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | (result & 0xFFFF);
        this.setFlagsAdd16(data, dstVal, result);
        this.cycles += 4;
        return { name: `ADDQ.W #${data},D${reg}`, cycles: 4 };
    },
    
    // FIXED: Add missing ADDQ.L implementation
    op_addq_l_d(data, reg) {
        const dstVal = this.registers.d[reg] >>> 0;
        const result = (dstVal + data) >>> 0;
        
        this.registers.d[reg] = result;
        this.setFlagsAdd32(data, dstVal, result);
        this.cycles += 8;
        return { name: `ADDQ.L #${data},D${reg}`, cycles: 8 };
    },
    
    op_subq_w_d(data, reg) {
        const dstVal = this.registers.d[reg] & 0xFFFF;
        const result = dstVal - data;
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | (result & 0xFFFF);
        this.setFlagsSub16(dstVal, data, result);
        this.cycles += 4;
        return { name: `SUBQ.W #${data},D${reg}`, cycles: 4 };
    },
    
    // FIXED: Add missing SUBQ.L implementation
    op_subq_l_d(data, reg) {
        const dstVal = this.registers.d[reg] >>> 0;
        const result = (dstVal - data) >>> 0;
        
        this.registers.d[reg] = result;
        this.setFlagsSub32(dstVal, data, result);
        this.cycles += 8;
        return { name: `SUBQ.L #${data},D${reg}`, cycles: 8 };
    }
};

module.exports = { ArithmeticOpcodes };