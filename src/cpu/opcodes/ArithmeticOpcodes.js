// src/cpu/opcodes/ArithmeticOpcodes.js - Arithmetic Operations (WITH DEBUG LOGGING)

const ArithmeticOpcodes = {
    setup(opcodeTable, cpu) {
        console.log('🔧 [CPU] Setting up arithmetic opcodes...');
        
        // ADD.W Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xD040 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_add_w_d_d.call(cpu, src, dst);
            }
        }
        
        // ADD.L Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xD080 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_add_l_d_d.call(cpu, src, dst);
            }
        }
        
        // SUB.W Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x9040 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_sub_w_d_d.call(cpu, src, dst);
            }
        }
        
        // SUB.L Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x9080 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_sub_l_d_d.call(cpu, src, dst);
            }
        }
        
        // CMP.W Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xB040 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_cmp_w_d_d.call(cpu, src, dst);
            }
        }
        
        // CMP.L Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xB080 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_cmp_l_d_d.call(cpu, src, dst);
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
        
        // ADDQ.L #imm,Dn
        for (let data = 1; data <= 8; data++) {
            for (let reg = 0; reg < 8; reg++) {
                const dataField = (data === 8) ? 0 : data;
                const opcode = 0x5080 | (dataField << 9) | reg;
                opcodeTable[opcode] = () => this.op_addq_l_d.call(cpu, data, reg);
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
        
        // SUBQ.L #imm,Dn
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
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = srcVal + dstVal;
        const oldValue = this.registers.d[dst];
        
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFF0000) | (result & 0xFFFF);
        this.setFlagsAdd16(srcVal, dstVal, result);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ADD.W D${src},D${dst}             ; Add word registers`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[dst].toString(16).padStart(8, '0')} (${srcVal} + ${dstVal} = ${result & 0xFFFF})`);
        
        this.cycles += 4;
        return { 
            name: `ADD.W D${src},D${dst}`, 
            cycles: 4,
            asm: `ADD.W D${src},D${dst}`,
            description: 'Add word registers',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.d[dst]
        };
    },
    
    op_add_l_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] >>> 0;
        const dstVal = this.registers.d[dst] >>> 0;
        const result = (srcVal + dstVal) >>> 0;
        const oldValue = this.registers.d[dst];
        
        this.registers.d[dst] = result;
        this.setFlagsAdd32(srcVal, dstVal, result);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ADD.L D${src},D${dst}             ; Add long registers`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (${srcVal} + ${dstVal} = ${result})`);
        
        this.cycles += 8;
        return { 
            name: `ADD.L D${src},D${dst}`, 
            cycles: 8,
            asm: `ADD.L D${src},D${dst}`,
            description: 'Add long registers',
            pc: pc,
            oldValue: oldValue,
            newValue: result
        };
    },
    
    op_sub_w_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = dstVal - srcVal;
        const oldValue = this.registers.d[dst];
        
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFF0000) | (result & 0xFFFF);
        this.setFlagsSub16(dstVal, srcVal, result);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: SUB.W D${src},D${dst}             ; Subtract word registers`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[dst].toString(16).padStart(8, '0')} (${dstVal} - ${srcVal} = ${result & 0xFFFF})`);
        
        this.cycles += 4;
        return { 
            name: `SUB.W D${src},D${dst}`, 
            cycles: 4,
            asm: `SUB.W D${src},D${dst}`,
            description: 'Subtract word registers',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.d[dst]
        };
    },
    
    op_sub_l_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] >>> 0;
        const dstVal = this.registers.d[dst] >>> 0;
        const result = (dstVal - srcVal) >>> 0;
        const oldValue = this.registers.d[dst];
        
        this.registers.d[dst] = result;
        this.setFlagsSub32(dstVal, srcVal, result);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: SUB.L D${src},D${dst}             ; Subtract long registers`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (${dstVal} - ${srcVal} = ${result})`);
        
        this.cycles += 8;
        return { 
            name: `SUB.L D${src},D${dst}`, 
            cycles: 8,
            asm: `SUB.L D${src},D${dst}`,
            description: 'Subtract long registers',
            pc: pc,
            oldValue: oldValue,
            newValue: result
        };
    },
    
    op_cmp_w_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = dstVal - srcVal;
        
        this.setFlagsSub16(dstVal, srcVal, result);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: CMP.W D${src},D${dst}             ; Compare word registers`);
        console.log(`       → Compare: D${dst}(${dstVal}) - D${src}(${srcVal}) = ${result & 0xFFFF} [flags only]`);
        
        this.cycles += 4;
        return { 
            name: `CMP.W D${src},D${dst}`, 
            cycles: 4,
            asm: `CMP.W D${src},D${dst}`,
            description: 'Compare word registers',
            pc: pc
        };
    },
    
    op_cmp_l_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] >>> 0;
        const dstVal = this.registers.d[dst] >>> 0;
        const result = (dstVal - srcVal) >>> 0;
        
        this.setFlagsSub32(dstVal, srcVal, result);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: CMP.L D${src},D${dst}             ; Compare long registers`);
        console.log(`       → Compare: D${dst}(${dstVal}) - D${src}(${srcVal}) = ${result} [flags only]`);
        
        this.cycles += 6;
        return { 
            name: `CMP.L D${src},D${dst}`, 
            cycles: 6,
            asm: `CMP.L D${src},D${dst}`,
            description: 'Compare long registers',
            pc: pc
        };
    },
    
    op_addq_w_d(data, reg) {
        const pc = this.registers.pc - 2;
        const dstVal = this.registers.d[reg] & 0xFFFF;
        const result = dstVal + data;
        const oldValue = this.registers.d[reg];
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | (result & 0xFFFF);
        this.setFlagsAdd16(data, dstVal, result);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ADDQ.W #${data},D${reg}             ; Add quick word`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (${dstVal} + ${data} = ${result & 0xFFFF})`);
        
        this.cycles += 4;
        return { 
            name: `ADDQ.W #${data},D${reg}`, 
            cycles: 4,
            asm: `ADDQ.W #${data},D${reg}`,
            description: 'Add quick word to data register',
            pc: pc,
            immediate: data,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    },
    
    op_addq_l_d(data, reg) {
        const pc = this.registers.pc - 2;
        const dstVal = this.registers.d[reg] >>> 0;
        const result = (dstVal + data) >>> 0;
        const oldValue = this.registers.d[reg];
        
        this.registers.d[reg] = result;
        this.setFlagsAdd32(data, dstVal, result);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ADDQ.L #${data},D${reg}             ; Add quick long`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (${dstVal} + ${data} = ${result})`);
        
        this.cycles += 8;
        return { 
            name: `ADDQ.L #${data},D${reg}`, 
            cycles: 8,
            asm: `ADDQ.L #${data},D${reg}`,
            description: 'Add quick long to data register',
            pc: pc,
            immediate: data,
            oldValue: oldValue,
            newValue: result
        };
    },
    
    op_subq_w_d(data, reg) {
        const pc = this.registers.pc - 2;
        const dstVal = this.registers.d[reg] & 0xFFFF;
        const result = dstVal - data;
        const oldValue = this.registers.d[reg];
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | (result & 0xFFFF);
        this.setFlagsSub16(dstVal, data, result);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: SUBQ.W #${data},D${reg}             ; Subtract quick word`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (${dstVal} - ${data} = ${result & 0xFFFF})`);
        
        this.cycles += 4;
        return { 
            name: `SUBQ.W #${data},D${reg}`, 
            cycles: 4,
            asm: `SUBQ.W #${data},D${reg}`,
            description: 'Subtract quick word from data register',
            pc: pc,
            immediate: data,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    },
    
    op_subq_l_d(data, reg) {
        const pc = this.registers.pc - 2;
        const dstVal = this.registers.d[reg] >>> 0;
        const result = (dstVal - data) >>> 0;
        const oldValue = this.registers.d[reg];
        
        this.registers.d[reg] = result;
        this.setFlagsSub32(dstVal, data, result);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: SUBQ.L #${data},D${reg}             ; Subtract quick long`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (${dstVal} - ${data} = ${result})`);
        
        this.cycles += 8;
        return { 
            name: `SUBQ.L #${data},D${reg}`, 
            cycles: 8,
            asm: `SUBQ.L #${data},D${reg}`,
            description: 'Subtract quick long from data register',
            pc: pc,
            immediate: data,
            oldValue: oldValue,
            newValue: result
        };
    }
};

module.exports = { ArithmeticOpcodes };