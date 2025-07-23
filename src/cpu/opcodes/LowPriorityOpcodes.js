// src/cpu/opcodes/LowPriorityOpcodes.js - Low Priority Instructions (BCD, Extended arithmetic, Exception handling)

class LowPriorityOpcodes {
    constructor(cpu) {
        this.cpu = cpu;
    }

    setup(opcodeTable) {
        const cpu = this.cpu;
        console.log('🔧 [CPU] Setting up low priority opcodes...');

        // ABCD Dn,Dm - Add BCD data register to data register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xC100 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_abcd_d_d.call(cpu, src, dst);
            }
        }

        // ABCD -(An),-(Am) - Add BCD predecrement to predecrement
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xC108 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_abcd_predec_predec.call(cpu, src, dst);
            }
        }

        // SBCD Dn,Dm - Subtract BCD data register from data register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x8100 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_sbcd_d_d.call(cpu, src, dst);
            }
        }

        // SBCD -(An),-(Am) - Subtract BCD predecrement from predecrement
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x8108 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_sbcd_predec_predec.call(cpu, src, dst);
            }
        }

        // NBCD Dn - Negate BCD in data register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4800 | reg;
            opcodeTable[opcode] = () => this.op_nbcd_d.call(cpu, reg);
        }

        // NBCD (An) - Negate BCD in memory
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4810 | reg;
            opcodeTable[opcode] = () => this.op_nbcd_an.call(cpu, reg);
        }

        // ADDX Dn,Dm - Add extended data register to data register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xD100 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_addx_d_d.call(cpu, src, dst);
            }
        }

        // ADDX -(An),-(Am) - Add extended predecrement to predecrement
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xD108 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_addx_predec_predec.call(cpu, src, dst);
            }
        }

        // SUBX Dn,Dm - Subtract extended data register from data register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x9100 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_subx_d_d.call(cpu, src, dst);
            }
        }

        // SUBX -(An),-(Am) - Subtract extended predecrement from predecrement
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x9108 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_subx_predec_predec.call(cpu, src, dst);
            }
        }

        // NEG.B Dn - Negate byte in data register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4400 | reg;
            opcodeTable[opcode] = () => this.op_neg_b_d.call(cpu, reg);
        }

        // NEG.W Dn - Negate word in data register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4440 | reg;
            opcodeTable[opcode] = () => this.op_neg_w_d.call(cpu, reg);
        }

        // NEG.L Dn - Negate long in data register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4480 | reg;
            opcodeTable[opcode] = () => this.op_neg_l_d.call(cpu, reg);
        }

        // NEGX.B Dn - Negate extended byte in data register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4000 | reg;
            opcodeTable[opcode] = () => this.op_negx_b_d.call(cpu, reg);
        }

        // NEGX.W Dn - Negate extended word in data register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4040 | reg;
            opcodeTable[opcode] = () => this.op_negx_w_d.call(cpu, reg);
        }

        // NEGX.L Dn - Negate extended long in data register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4080 | reg;
            opcodeTable[opcode] = () => this.op_negx_l_d.call(cpu, reg);
        }

        console.log('✅ [CPU] Low priority opcodes setup complete');
    }

    // BCD (Binary Coded Decimal) implementations
    op_abcd_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] & 0xFF;
        const dstVal = this.registers.d[dst] & 0xFF;
        const oldValue = this.registers.d[dst];

        // Convert BCD to binary, add, convert back
        const srcBin = ((srcVal >> 4) * 10) + (srcVal & 0x0F);
        const dstBin = ((dstVal >> 4) * 10) + (dstVal & 0x0F);
        let result = srcBin + dstBin + (this.flag_x ? 1 : 0);

        // Handle BCD overflow (>99)
        let carry = 0;
        if (result > 99) {
            result -= 100;
            carry = 1;
        }

        // Convert back to BCD
        const resultBCD = ((Math.floor(result / 10) & 0x0F) << 4) | (result % 10);
        
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFFFF00) | resultBCD;
        
        // Set flags
        this.flag_c = this.flag_x = carry;
        this.flag_z = (resultBCD === 0) ? 1 : 0;
        this.flag_n = (resultBCD & 0x80) ? 1 : 0;
        this.flag_v = 0; // Overflow not set for BCD operations

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ABCD D${src},D${dst}              ; Add BCD data registers`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[dst].toString(16).padStart(8, '0')} (BCD: ${dstBin} + ${srcBin} = ${result})`);

        this.cycles += 6;
        return {
            name: `ABCD D${src},D${dst}`,
            cycles: 6,
            asm: `ABCD D${src},D${dst}`,
            description: 'Add BCD data registers',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.d[dst]
        };
    }

    op_abcd_predec_predec(src, dst) {
        const pc = this.registers.pc - 2;
        
        // Predecrement address registers
        this.registers.a[src] = (this.registers.a[src] - 1) >>> 0;
        this.registers.a[dst] = (this.registers.a[dst] - 1) >>> 0;
        
        const srcVal = this.memory.readByte(this.registers.a[src]);
        const dstVal = this.memory.readByte(this.registers.a[dst]);

        const srcBin = ((srcVal >> 4) * 10) + (srcVal & 0x0F);
        const dstBin = ((dstVal >> 4) * 10) + (dstVal & 0x0F);
        let result = srcBin + dstBin + (this.flag_x ? 1 : 0);

        let carry = 0;
        if (result > 99) {
            result -= 100;
            carry = 1;
        }

        const resultBCD = ((Math.floor(result / 10) & 0x0F) << 4) | (result % 10);
        this.memory.writeByte(this.registers.a[dst], resultBCD);
        
        this.flag_c = this.flag_x = carry;
        this.flag_z = (resultBCD === 0) ? 1 : 0;
        this.flag_n = (resultBCD & 0x80) ? 1 : 0;
        this.flag_v = 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ABCD -(A${src}),-(A${dst})        ; Add BCD predecrement`);
        console.log(`       → (A${dst})@0x${this.registers.a[dst].toString(16)} = 0x${resultBCD.toString(16).padStart(2, '0')} (BCD: ${dstBin} + ${srcBin} = ${result})`);

        this.cycles += 18;
        return {
            name: `ABCD -(A${src}),-(A${dst})`,
            cycles: 18,
            asm: `ABCD -(A${src}),-(A${dst})`,
            description: 'Add BCD predecrement',
            pc: pc
        };
    }

    op_sbcd_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] & 0xFF;
        const dstVal = this.registers.d[dst] & 0xFF;
        const oldValue = this.registers.d[dst];

        const srcBin = ((srcVal >> 4) * 10) + (srcVal & 0x0F);
        const dstBin = ((dstVal >> 4) * 10) + (dstVal & 0x0F);
        let result = dstBin - srcBin - (this.flag_x ? 1 : 0);

        let borrow = 0;
        if (result < 0) {
            result += 100;
            borrow = 1;
        }

        const resultBCD = ((Math.floor(result / 10) & 0x0F) << 4) | (result % 10);
        
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFFFF00) | resultBCD;
        
        this.flag_c = this.flag_x = borrow;
        this.flag_z = (resultBCD === 0) ? 1 : 0;
        this.flag_n = (resultBCD & 0x80) ? 1 : 0;
        this.flag_v = 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: SBCD D${src},D${dst}              ; Subtract BCD data registers`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[dst].toString(16).padStart(8, '0')} (BCD: ${dstBin} - ${srcBin} = ${result})`);

        this.cycles += 6;
        return {
            name: `SBCD D${src},D${dst}`,
            cycles: 6,
            asm: `SBCD D${src},D${dst}`,
            description: 'Subtract BCD data registers',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.d[dst]
        };
    }

    op_sbcd_predec_predec(src, dst) {
        const pc = this.registers.pc - 2;
        
        this.registers.a[src] = (this.registers.a[src] - 1) >>> 0;
        this.registers.a[dst] = (this.registers.a[dst] - 1) >>> 0;
        
        const srcVal = this.memory.readByte(this.registers.a[src]);
        const dstVal = this.memory.readByte(this.registers.a[dst]);

        const srcBin = ((srcVal >> 4) * 10) + (srcVal & 0x0F);
        const dstBin = ((dstVal >> 4) * 10) + (dstVal & 0x0F);
        let result = dstBin - srcBin - (this.flag_x ? 1 : 0);

        let borrow = 0;
        if (result < 0) {
            result += 100;
            borrow = 1;
        }

        const resultBCD = ((Math.floor(result / 10) & 0x0F) << 4) | (result % 10);
        this.memory.writeByte(this.registers.a[dst], resultBCD);
        
        this.flag_c = this.flag_x = borrow;
        this.flag_z = (resultBCD === 0) ? 1 : 0;
        this.flag_n = (resultBCD & 0x80) ? 1 : 0;
        this.flag_v = 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: SBCD -(A${src}),-(A${dst})        ; Subtract BCD predecrement`);
        console.log(`       → (A${dst})@0x${this.registers.a[dst].toString(16)} = 0x${resultBCD.toString(16).padStart(2, '0')} (BCD: ${dstBin} - ${srcBin} = ${result})`);

        this.cycles += 18;
        return {
            name: `SBCD -(A${src}),-(A${dst})`,
            cycles: 18,
            asm: `SBCD -(A${src}),-(A${dst})`,
            description: 'Subtract BCD predecrement',
            pc: pc
        };
    }

    op_nbcd_d(reg) {
        const pc = this.registers.pc - 2;
        const value = this.registers.d[reg] & 0xFF;
        const oldValue = this.registers.d[reg];

        const valueBin = ((value >> 4) * 10) + (value & 0x0F);
        let result = 0 - valueBin - (this.flag_x ? 1 : 0);

        let borrow = 0;
        if (result < 0) {
            result += 100;
            borrow = 1;
        }

        const resultBCD = ((Math.floor(result / 10) & 0x0F) << 4) | (result % 10);
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFFFF00) | resultBCD;
        
        this.flag_c = this.flag_x = borrow;
        this.flag_z = (resultBCD === 0) ? 1 : 0;
        this.flag_n = (resultBCD & 0x80) ? 1 : 0;
        this.flag_v = 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: NBCD D${reg}                 ; Negate BCD data register`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (BCD: -${valueBin} = ${result})`);

        this.cycles += 6;
        return {
            name: `NBCD D${reg}`,
            cycles: 6,
            asm: `NBCD D${reg}`,
            description: 'Negate BCD data register',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    op_nbcd_an(reg) {
        const pc = this.registers.pc - 2;
        const address = this.registers.a[reg];
        const value = this.memory.readByte(address);

        const valueBin = ((value >> 4) * 10) + (value & 0x0F);
        let result = 0 - valueBin - (this.flag_x ? 1 : 0);

        let borrow = 0;
        if (result < 0) {
            result += 100;
            borrow = 1;
        }

        const resultBCD = ((Math.floor(result / 10) & 0x0F) << 4) | (result % 10);
        this.memory.writeByte(address, resultBCD);
        
        this.flag_c = this.flag_x = borrow;
        this.flag_z = (resultBCD === 0) ? 1 : 0;
        this.flag_n = (resultBCD & 0x80) ? 1 : 0;
        this.flag_v = 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: NBCD (A${reg})               ; Negate BCD in memory`);
        console.log(`       → (A${reg})@0x${address.toString(16)} = 0x${resultBCD.toString(16).padStart(2, '0')} (BCD: -${valueBin} = ${result})`);

        this.cycles += 12;
        return {
            name: `NBCD (A${reg})`,
            cycles: 12,
            asm: `NBCD (A${reg})`,
            description: 'Negate BCD in memory',
            pc: pc,
            address: address
        };
    }

    // Extended arithmetic implementations
    op_addx_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] & 0xFF;
        const dstVal = this.registers.d[dst] & 0xFF;
        const result = srcVal + dstVal + (this.flag_x ? 1 : 0);
        const oldValue = this.registers.d[dst];

        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFFFF00) | (result & 0xFF);
        this.setFlagsAdd8(srcVal, dstVal, result, true); // true = preserve zero flag

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ADDX D${src},D${dst}              ; Add extended data registers`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[dst].toString(16).padStart(8, '0')} (${srcVal} + ${dstVal} + X = ${result & 0xFF})`);

        this.cycles += 4;
        return {
            name: `ADDX D${src},D${dst}`,
            cycles: 4,
            asm: `ADDX D${src},D${dst}`,
            description: 'Add extended data registers',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.d[dst]
        };
    }

    op_addx_predec_predec(src, dst) {
        const pc = this.registers.pc - 2;
        
        this.registers.a[src] = (this.registers.a[src] - 1) >>> 0;
        this.registers.a[dst] = (this.registers.a[dst] - 1) >>> 0;
        
        const srcVal = this.memory.readByte(this.registers.a[src]);
        const dstVal = this.memory.readByte(this.registers.a[dst]);
        const result = srcVal + dstVal + (this.flag_x ? 1 : 0);

        this.memory.writeByte(this.registers.a[dst], result & 0xFF);
        this.setFlagsAdd8(srcVal, dstVal, result, true);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ADDX -(A${src}),-(A${dst})        ; Add extended predecrement`);
        console.log(`       → (A${dst})@0x${this.registers.a[dst].toString(16)} = 0x${(result & 0xFF).toString(16).padStart(2, '0')} (${srcVal} + ${dstVal} + X = ${result & 0xFF})`);

        this.cycles += 18;
        return {
            name: `ADDX -(A${src}),-(A${dst})`,
            cycles: 18,
            asm: `ADDX -(A${src}),-(A${dst})`,
            description: 'Add extended predecrement',
            pc: pc
        };
    }

    op_subx_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] & 0xFF;
        const dstVal = this.registers.d[dst] & 0xFF;
        const result = dstVal - srcVal - (this.flag_x ? 1 : 0);
        const oldValue = this.registers.d[dst];

        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFFFF00) | (result & 0xFF);
        this.setFlagsSub8(dstVal, srcVal, result, true); // true = preserve zero flag

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: SUBX D${src},D${dst}              ; Subtract extended data registers`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[dst].toString(16).padStart(8, '0')} (${dstVal} - ${srcVal} - X = ${result & 0xFF})`);

        this.cycles += 4;
        return {
            name: `SUBX D${src},D${dst}`,
            cycles: 4,
            asm: `SUBX D${src},D${dst}`,
            description: 'Subtract extended data registers',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.d[dst]
        };
    }

    op_subx_predec_predec(src, dst) {
        const pc = this.registers.pc - 2;
        
        this.registers.a[src] = (this.registers.a[src] - 1) >>> 0;
        this.registers.a[dst] = (this.registers.a[dst] - 1) >>> 0;
        
        const srcVal = this.memory.readByte(this.registers.a[src]);
        const dstVal = this.memory.readByte(this.registers.a[dst]);
        const result = dstVal - srcVal - (this.flag_x ? 1 : 0);

        this.memory.writeByte(this.registers.a[dst], result & 0xFF);
        this.setFlagsSub8(dstVal, srcVal, result, true);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: SUBX -(A${src}),-(A${dst})        ; Subtract extended predecrement`);
        console.log(`       → (A${dst})@0x${this.registers.a[dst].toString(16)} = 0x${(result & 0xFF).toString(16).padStart(2, '0')} (${dstVal} - ${srcVal} - X = ${result & 0xFF})`);

        this.cycles += 18;
        return {
            name: `SUBX -(A${src}),-(A${dst})`,
            cycles: 18,
            asm: `SUBX -(A${src}),-(A${dst})`,
            description: 'Subtract extended predecrement',
            pc: pc
        };
    }

    // Negate implementations
    op_neg_b_d(reg) {
        const pc = this.registers.pc - 2;
        const value = this.registers.d[reg] & 0xFF;
        const result = (0 - value) & 0xFF;
        const oldValue = this.registers.d[reg];

        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFFFF00) | result;
        this.setFlagsSub8(0, value, result);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: NEG.B D${reg}                ; Negate byte in data register`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (-${value} = ${result})`);

        this.cycles += 4;
        return {
            name: `NEG.B D${reg}`,
            cycles: 4,
            asm: `NEG.B D${reg}`,
            description: 'Negate byte in data register',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    op_neg_w_d(reg) {
        const pc = this.registers.pc - 2;
        const value = this.registers.d[reg] & 0xFFFF;
        const result = (0 - value) & 0xFFFF;
        const oldValue = this.registers.d[reg];

        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | result;
        this.setFlagsSub16(0, value, result);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: NEG.W D${reg}                ; Negate word in data register`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (-${value} = ${result})`);

        this.cycles += 4;
        return {
            name: `NEG.W D${reg}`,
            cycles: 4,
            asm: `NEG.W D${reg}`,
            description: 'Negate word in data register',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    op_neg_l_d(reg) {
        const pc = this.registers.pc - 2;
        const value = this.registers.d[reg] >>> 0;
        const result = (0 - value) >>> 0;
        const oldValue = this.registers.d[reg];

        this.registers.d[reg] = result;
        this.setFlagsSub32(0, value, result);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: NEG.L D${reg}                ; Negate long in data register`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (-${value} = ${result})`);

        this.cycles += 4;
        return {
            name: `NEG.L D${reg}`,
            cycles: 4,
            asm: `NEG.L D${reg}`,
            description: 'Negate long in data register',
            pc: pc,
            oldValue: oldValue,
            newValue: result
        };
    }

    // Negate extended implementations
    op_negx_b_d(reg) {
        const pc = this.registers.pc - 2;
        const value = this.registers.d[reg] & 0xFF;
        const result = (0 - value - (this.flag_x ? 1 : 0)) & 0xFF;
        const oldValue = this.registers.d[reg];

        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFFFF00) | result;
        this.setFlagsSub8(0, value, result, true); // true = preserve zero flag

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: NEGX.B D${reg}               ; Negate extended byte in data register`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (-${value} - X = ${result})`);

        this.cycles += 4;
        return {
            name: `NEGX.B D${reg}`,
            cycles: 4,
            asm: `NEGX.B D${reg}`,
            description: 'Negate extended byte in data register',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    op_negx_w_d(reg) {
        const pc = this.registers.pc - 2;
        const value = this.registers.d[reg] & 0xFFFF;
        const result = (0 - value - (this.flag_x ? 1 : 0)) & 0xFFFF;
        const oldValue = this.registers.d[reg];

        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | result;
        this.setFlagsSub16(0, value, result, true);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: NEGX.W D${reg}               ; Negate extended word in data register`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (-${value} - X = ${result})`);

        this.cycles += 4;
        return {
            name: `NEGX.W D${reg}`,
            cycles: 4,
            asm: `NEGX.W D${reg}`,
            description: 'Negate extended word in data register',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    op_negx_l_d(reg) {
        const pc = this.registers.pc - 2;
        const value = this.registers.d[reg] >>> 0;
        const result = (0 - value - (this.flag_x ? 1 : 0)) >>> 0;
        const oldValue = this.registers.d[reg];

        this.registers.d[reg] = result;
        this.setFlagsSub32(0, value, result, true);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: NEGX.L D${reg}               ; Negate extended long in data register`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (-${value} - X = ${result})`);

        this.cycles += 4;
        return {
            name: `NEGX.L D${reg}`,
            cycles: 4,
            asm: `NEGX.L D${reg}`,
            description: 'Negate extended long in data register',
            pc: pc,
            oldValue: oldValue,
            newValue: result
        };
    }
}

module.exports = LowPriorityOpcodes;