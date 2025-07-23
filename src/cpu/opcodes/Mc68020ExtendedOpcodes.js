// src/cpu/opcodes/Mc68020ExtendedOpcodes.js - 68020 Extended Instructions

class Mc68020ExtendedOpcodes {
    constructor(cpu) {
        this.cpu = cpu;
    }

    setup(opcodeTable) {
        const cpu = this.cpu;
        console.log('🔧 [CPU] Setting up 68020 extended opcodes...');

        // PACK Dn,Dm,#adjustment - Pack data register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x8140 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_pack_d_d.call(cpu, src, dst);
            }
        }

        // UNPK Dn,Dm,#adjustment - Unpack data register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x8180 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_unpk_d_d.call(cpu, src, dst);
            }
        }

        // CAS.W Dc,Du,Dn - Compare and swap word
        for (let compareReg = 0; compareReg < 8; compareReg++) {
            for (let updateReg = 0; updateReg < 8; updateReg++) {
                for (let reg = 0; reg < 8; reg++) {
                    const opcode = 0x0AC0 | (compareReg << 9) | (updateReg << 6) | reg;
                    opcodeTable[opcode] = () => this.op_cas_w_d.call(cpu, compareReg, updateReg, reg);
                }
            }
        }

        // CAS.L Dc,Du,Dn - Compare and swap long
        for (let compareReg = 0; compareReg < 8; compareReg++) {
            for (let updateReg = 0; updateReg < 8; updateReg++) {
                for (let reg = 0; reg < 8; reg++) {
                    const opcode = 0x0EC0 | (compareReg << 9) | (updateReg << 6) | reg;
                    opcodeTable[opcode] = () => this.op_cas_l_d.call(cpu, compareReg, updateReg, reg);
                }
            }
        }

        // Enhanced MULS.L/MULU.L - 32-bit multiply with 64-bit result
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                // MULS.L Dn,Dm - Signed 32x32->64 bit multiply
                const opcode1 = 0x4C00 | (dst << 9) | 0x0800 | src;
                opcodeTable[opcode1] = () => this.op_muls_l_d_d.call(cpu, src, dst);
                
                // MULU.L Dn,Dm - Unsigned 32x32->64 bit multiply
                const opcode2 = 0x4C00 | (dst << 9) | 0x0000 | src;
                opcodeTable[opcode2] = () => this.op_mulu_l_d_d.call(cpu, src, dst);
            }
        }

        // Enhanced DIVS.L/DIVU.L - 64/32->32 bit divide
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                // DIVS.L Dn,Dm - Signed 64/32->32 bit divide
                const opcode1 = 0x4C40 | (dst << 9) | 0x0800 | src;
                opcodeTable[opcode1] = () => this.op_divs_l_d_d.call(cpu, src, dst);
                
                // DIVU.L Dn,Dm - Unsigned 64/32->32 bit divide
                const opcode2 = 0x4C40 | (dst << 9) | 0x0000 | src;
                opcodeTable[opcode2] = () => this.op_divu_l_d_d.call(cpu, src, dst);
            }
        }

        // BFEXTU/BFEXTS - Bit field extract
        for (let reg = 0; reg < 8; reg++) {
            // BFEXTU Dn{offset:width},Dm - Unsigned bit field extract
            const opcode1 = 0xE9C0 | reg;
            opcodeTable[opcode1] = () => this.op_bfextu_d.call(cpu, reg);
            
            // BFEXTS Dn{offset:width},Dm - Signed bit field extract
            const opcode2 = 0xEBC0 | reg;
            opcodeTable[opcode2] = () => this.op_bfexts_d.call(cpu, reg);
        }

        // BFINS - Bit field insert
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0xEFC0 | reg;
            opcodeTable[opcode] = () => this.op_bfins_d.call(cpu, reg);
        }

        // BFSET/BFCLR/BFCHG/BFTST - Bit field operations
        for (let reg = 0; reg < 8; reg++) {
            // BFSET Dn{offset:width}
            const opcode1 = 0xEEC0 | reg;
            opcodeTable[opcode1] = () => this.op_bfset_d.call(cpu, reg);
            
            // BFCLR Dn{offset:width}
            const opcode2 = 0xECC0 | reg;
            opcodeTable[opcode2] = () => this.op_bfclr_d.call(cpu, reg);
            
            // BFCHG Dn{offset:width}
            const opcode3 = 0xEAC0 | reg;
            opcodeTable[opcode3] = () => this.op_bfchg_d.call(cpu, reg);
            
            // BFTST Dn{offset:width}
            const opcode4 = 0xE8C0 | reg;
            opcodeTable[opcode4] = () => this.op_bftst_d.call(cpu, reg);
        }

        // BFFFO - Bit field find first one
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0xEDC0 | reg;
            opcodeTable[opcode] = () => this.op_bfffo_d.call(cpu, reg);
        }

        // TRAPcc - Conditional trap
        const conditions = [
            'T',  'F',  'HI', 'LS', 'CC', 'CS', 'NE', 'EQ',
            'VC', 'VS', 'PL', 'MI', 'GE', 'LT', 'GT', 'LE'
        ];

        for (let cc = 0; cc < 16; cc++) {
            // TRAPcc (no operand)
            const opcode1 = 0x50FA | (cc << 8);
            opcodeTable[opcode1] = () => this.op_trapcc.call(cpu, cc, conditions[cc], null);
            
            // TRAPcc #imm.W
            const opcode2 = 0x50FB | (cc << 8);
            opcodeTable[opcode2] = () => this.op_trapcc_w.call(cpu, cc, conditions[cc]);
            
            // TRAPcc #imm.L
            const opcode3 = 0x50FC | (cc << 8);
            opcodeTable[opcode3] = () => this.op_trapcc_l.call(cpu, cc, conditions[cc]);
        }

        console.log('✅ [CPU] 68020 extended opcodes setup complete');
    }

    // PACK/UNPK implementations
    op_pack_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const adjustment = this.fetchWord();
        const srcValue = this.registers.d[src] & 0xFFFF;
        const adjustedValue = (srcValue + adjustment) & 0xFFFF;
        
        // Pack: take bits 11-8 and 3-0, combine into one byte
        const highNibble = (adjustedValue >> 8) & 0x0F;
        const lowNibble = adjustedValue & 0x0F;
        const packedValue = (highNibble << 4) | lowNibble;
        
        const oldValue = this.registers.d[dst];
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFFFF00) | packedValue;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: PACK D${src},D${dst},#$${adjustment.toString(16)} ; Pack data register`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[dst].toString(16).padStart(8, '0')} (packed 0x${srcValue.toString(16)} → 0x${packedValue.toString(16)})`);

        this.cycles += 6;
        return {
            name: `PACK D${src},D${dst},#$${adjustment.toString(16)}`,
            cycles: 6,
            asm: `PACK D${src},D${dst},#$${adjustment.toString(16)}`,
            description: 'Pack data register',
            pc: pc,
            immediate: adjustment,
            oldValue: oldValue,
            newValue: this.registers.d[dst]
        };
    }

    op_unpk_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const adjustment = this.fetchWord();
        const srcValue = this.registers.d[src] & 0xFF;
        
        // Unpack: expand one byte into word format
        const highNibble = (srcValue >> 4) & 0x0F;
        const lowNibble = srcValue & 0x0F;
        const unpackedValue = (highNibble << 8) | lowNibble;
        const adjustedValue = (unpackedValue + adjustment) & 0xFFFF;
        
        const oldValue = this.registers.d[dst];
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFF0000) | adjustedValue;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: UNPK D${src},D${dst},#$${adjustment.toString(16)} ; Unpack data register`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[dst].toString(16).padStart(8, '0')} (unpacked 0x${srcValue.toString(16)} → 0x${adjustedValue.toString(16)})`);

        this.cycles += 8;
        return {
            name: `UNPK D${src},D${dst},#$${adjustment.toString(16)}`,
            cycles: 8,
            asm: `UNPK D${src},D${dst},#$${adjustment.toString(16)}`,
            description: 'Unpack data register',
            pc: pc,
            immediate: adjustment,
            oldValue: oldValue,
            newValue: this.registers.d[dst]
        };
    }

    // Compare and Swap implementations
    op_cas_w_d(compareReg, updateReg, reg) {
        const pc = this.registers.pc - 2;
        const compareValue = this.registers.d[compareReg] & 0xFFFF;
        const updateValue = this.registers.d[updateReg] & 0xFFFF;
        const memoryValue = this.registers.d[reg] & 0xFFFF;
        const oldValue = this.registers.d[reg];

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: CAS.W D${compareReg},D${updateReg},D${reg}    ; Compare and swap word`);
        console.log(`       → Compare: D${reg}(${memoryValue}) with D${compareReg}(${compareValue})`);

        if (memoryValue === compareValue) {
            // Values match, perform swap
            this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | updateValue;
            this.flag_z = 1;
            console.log(`       → MATCH: D${reg} := D${updateReg}(${updateValue})`);
        } else {
            // Values don't match, load memory value into compare register
            this.registers.d[compareReg] = (this.registers.d[compareReg] & 0xFFFF0000) | memoryValue;
            this.flag_z = 0;
            console.log(`       → NO MATCH: D${compareReg} := ${memoryValue}`);
        }

        this.setFlagsCmp16(compareValue, memoryValue, memoryValue - compareValue);

        this.cycles += 12;
        return {
            name: `CAS.W D${compareReg},D${updateReg},D${reg}`,
            cycles: 12,
            asm: `CAS.W D${compareReg},D${updateReg},D${reg}`,
            description: 'Compare and swap word',
            pc: pc,
            matched: this.flag_z === 1,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    op_cas_l_d(compareReg, updateReg, reg) {
        const pc = this.registers.pc - 2;
        const compareValue = this.registers.d[compareReg] >>> 0;
        const updateValue = this.registers.d[updateReg] >>> 0;
        const memoryValue = this.registers.d[reg] >>> 0;
        const oldValue = this.registers.d[reg];

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: CAS.L D${compareReg},D${updateReg},D${reg}    ; Compare and swap long`);
        console.log(`       → Compare: D${reg}(${memoryValue}) with D${compareReg}(${compareValue})`);

        if (memoryValue === compareValue) {
            this.registers.d[reg] = updateValue;
            this.flag_z = 1;
            console.log(`       → MATCH: D${reg} := D${updateReg}(${updateValue})`);
        } else {
            this.registers.d[compareReg] = memoryValue;
            this.flag_z = 0;
            console.log(`       → NO MATCH: D${compareReg} := ${memoryValue}`);
        }

        this.setFlagsCmp32(compareValue, memoryValue, memoryValue - compareValue);

        this.cycles += 12;
        return {
            name: `CAS.L D${compareReg},D${updateReg},D${reg}`,
            cycles: 12,
            asm: `CAS.L D${compareReg},D${updateReg},D${reg}`,
            description: 'Compare and swap long',
            pc: pc,
            matched: this.flag_z === 1,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    // Enhanced multiply implementations - 32x32->64 bit
    op_muls_l_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] >>> 0;
        const dstVal = this.registers.d[dst] >>> 0;
        
        // Convert to signed 32-bit
        const srcSigned = (srcVal & 0x80000000) ? (srcVal | 0x00000000) - 0x100000000 : srcVal;
        const dstSigned = (dstVal & 0x80000000) ? (dstVal | 0x00000000) - 0x100000000 : dstVal;
        
        // Perform 64-bit multiply (JavaScript handles this automatically)
        const result64 = srcSigned * dstSigned;
        const resultLow = (result64 & 0xFFFFFFFF) >>> 0;
        const resultHigh = Math.floor(result64 / 0x100000000) >>> 0;
        
        const oldValue = this.registers.d[dst];
        this.registers.d[dst] = resultLow;
        
        // Store high 32 bits in next register (68020 convention)
        if (dst < 7) {
            this.registers.d[dst + 1] = resultHigh;
        }

        this.setFlagsLogic32(resultLow);
        this.flag_v = (resultHigh !== 0 && resultHigh !== 0xFFFFFFFF) ? 1 : 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MULS.L D${src},D${dst}           ; Signed 32x32->64 multiply`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${resultLow.toString(16).padStart(8, '0')} (${dstSigned} * ${srcSigned} = ${result64})`);

        this.cycles += 70;
        return {
            name: `MULS.L D${src},D${dst}`,
            cycles: 70,
            asm: `MULS.L D${src},D${dst}`,
            description: 'Signed 32x32->64 multiply',
            pc: pc,
            oldValue: oldValue,
            newValue: resultLow,
            resultHigh: resultHigh
        };
    }

    op_mulu_l_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] >>> 0;
        const dstVal = this.registers.d[dst] >>> 0;
        
        // Perform 64-bit unsigned multiply
        const result64 = srcVal * dstVal;
        const resultLow = (result64 & 0xFFFFFFFF) >>> 0;
        const resultHigh = Math.floor(result64 / 0x100000000) >>> 0;
        
        const oldValue = this.registers.d[dst];
        this.registers.d[dst] = resultLow;
        
        if (dst < 7) {
            this.registers.d[dst + 1] = resultHigh;
        }

        this.setFlagsLogic32(resultLow);
        this.flag_v = (resultHigh !== 0) ? 1 : 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MULU.L D${src},D${dst}           ; Unsigned 32x32->64 multiply`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${resultLow.toString(16).padStart(8, '0')} (${dstVal} * ${srcVal} = ${result64})`);

        this.cycles += 70;
        return {
            name: `MULU.L D${src},D${dst}`,
            cycles: 70,
            asm: `MULU.L D${src},D${dst}`,
            description: 'Unsigned 32x32->64 multiply',
            pc: pc,
            oldValue: oldValue,
            newValue: resultLow,
            resultHigh: resultHigh
        };
    }

    // Bit field extract implementations
    op_bfextu_d(reg) {
        const pc = this.registers.pc - 2;
        const extension = this.fetchWord();
        const offset = (extension >> 6) & 0x1F;
        const width = ((extension & 0x1F) === 0) ? 32 : (extension & 0x1F);
        
        const sourceValue = this.registers.d[reg] >>> 0;
        const extractMask = (1 << width) - 1;
        const extractedValue = (sourceValue >>> (32 - offset - width)) & extractMask;
        
        const oldValue = this.registers.d[reg];
        this.registers.d[reg] = extractedValue;
        
        this.setFlagsLogic32(extractedValue);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BFEXTU D${reg}{${offset}:${width}},D${reg}   ; Unsigned bit field extract`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${extractedValue.toString(16).padStart(8, '0')} (extracted bits ${offset}-${offset + width - 1})`);

        this.cycles += 8;
        return {
            name: `BFEXTU D${reg}{${offset}:${width}},D${reg}`,
            cycles: 8,
            asm: `BFEXTU D${reg}{${offset}:${width}},D${reg}`,
            description: 'Unsigned bit field extract',
            pc: pc,
            offset: offset,
            width: width,
            oldValue: oldValue,
            newValue: extractedValue
        };
    }

    op_bfexts_d(reg) {
        const pc = this.registers.pc - 2;
        const extension = this.fetchWord();
        const offset = (extension >> 6) & 0x1F;
        const width = ((extension & 0x1F) === 0) ? 32 : (extension & 0x1F);
        
        const sourceValue = this.registers.d[reg] >>> 0;
        const extractMask = (1 << width) - 1;
        let extractedValue = (sourceValue >>> (32 - offset - width)) & extractMask;
        
        // Sign extend if necessary
        if (extractedValue & (1 << (width - 1))) {
            extractedValue |= (0xFFFFFFFF << width);
        }
        
        const oldValue = this.registers.d[reg];
        this.registers.d[reg] = extractedValue >>> 0;
        
        this.setFlagsLogic32(extractedValue);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BFEXTS D${reg}{${offset}:${width}},D${reg}   ; Signed bit field extract`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (extracted/signed bits ${offset}-${offset + width - 1})`);

        this.cycles += 8;
        return {
            name: `BFEXTS D${reg}{${offset}:${width}},D${reg}`,
            cycles: 8,
            asm: `BFEXTS D${reg}{${offset}:${width}},D${reg}`,
            description: 'Signed bit field extract',
            pc: pc,
            offset: offset,
            width: width,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    // Bit field test implementation
    op_bftst_d(reg) {
        const pc = this.registers.pc - 2;
        const extension = this.fetchWord();
        const offset = (extension >> 6) & 0x1F;
        const width = ((extension & 0x1F) === 0) ? 32 : (extension & 0x1F);
        
        const sourceValue = this.registers.d[reg] >>> 0;
        const testMask = ((1 << width) - 1) << (32 - offset - width);
        const testedField = sourceValue & testMask;
        
        this.flag_n = (testedField & (1 << (32 - offset - 1))) ? 1 : 0;
        this.flag_z = (testedField === 0) ? 1 : 0;
        this.flag_v = 0;
        this.flag_c = 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BFTST D${reg}{${offset}:${width}}        ; Test bit field`);
        console.log(`       → Test bits ${offset}-${offset + width - 1} in D${reg}(0x${sourceValue.toString(16).padStart(8, '0')}), result: N=${this.flag_n}, Z=${this.flag_z}`);

        this.cycles += 6;
        return {
            name: `BFTST D${reg}{${offset}:${width}}`,
            cycles: 6,
            asm: `BFTST D${reg}{${offset}:${width}}`,
            description: 'Test bit field',
            pc: pc,
            offset: offset,
            width: width
        };
    }

    // Conditional trap implementations
    op_trapcc(condition, condName, operand) {
        const pc = this.registers.pc - 2;
        const conditionMet = this.testCondition(condition);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: TRAP${condName}                 ; Conditional trap`);

        if (conditionMet) {
            console.log(`🔴 [EXEC]        TRAP${condName}: Condition ${condName} is TRUE, generating trap!`);
            this.exception_trapcc();
            return {
                name: `TRAP${condName}`,
                cycles: 34,
                asm: `TRAP${condName}`,
                description: `Conditional trap ${condName} (TRAP TAKEN)`,
                pc: pc,
                exception: true
            };
        }

        console.log(`✅ [EXEC]        TRAP${condName}: Condition ${condName} is FALSE, continuing`);
        this.cycles += 4;
        return {
            name: `TRAP${condName}`,
            cycles: 4,
            asm: `TRAP${condName}`,
            description: `Conditional trap ${condName} (NO TRAP)`,
            pc: pc
        };
    }

    op_trapcc_w(condition, condName) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord();
        const conditionMet = this.testCondition(condition);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: TRAP${condName} #$${immediate.toString(16).padStart(4, '0')}           ; Conditional trap with word immediate`);

        if (conditionMet) {
            console.log(`🔴 [EXEC]        TRAP${condName}: Condition ${condName} is TRUE, generating trap!`);
            this.exception_trapcc();
            return {
                name: `TRAP${condName} #$${immediate.toString(16).padStart(4, '0')}`,
                cycles: 34,
                asm: `TRAP${condName} #$${immediate.toString(16).padStart(4, '0')}`,
                description: `Conditional trap ${condName} with word immediate (TRAP TAKEN)`,
                pc: pc,
                immediate: immediate,
                exception: true
            };
        }

        console.log(`✅ [EXEC]        TRAP${condName}: Condition ${condName} is FALSE, continuing`);
        this.cycles += 6;
        return {
            name: `TRAP${condName} #$${immediate.toString(16).padStart(4, '0')}`,
            cycles: 6,
            asm: `TRAP${condName} #$${immediate.toString(16).padStart(4, '0')}`,
            description: `Conditional trap ${condName} with word immediate (NO TRAP)`,
            pc: pc,
            immediate: immediate
        };
    }

    op_trapcc_l(condition, condName) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchLong();
        const conditionMet = this.testCondition(condition);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: TRAP${condName} #$${immediate.toString(16).padStart(8, '0')}       ; Conditional trap with long immediate`);

        if (conditionMet) {
            console.log(`🔴 [EXEC]        TRAP${condName}: Condition ${condName} is TRUE, generating trap!`);
            this.exception_trapcc();
            return {
                name: `TRAP${condName} #$${immediate.toString(16).padStart(8, '0')}`,
                cycles: 34,
                asm: `TRAP${condName} #$${immediate.toString(16).padStart(8, '0')}`,
                description: `Conditional trap ${condName} with long immediate (TRAP TAKEN)`,
                pc: pc,
                immediate: immediate,
                exception: true
            };
        }

        console.log(`✅ [EXEC]        TRAP${condName}: Condition ${condName} is FALSE, continuing`);
        this.cycles += 8;
        return {
            name: `TRAP${condName} #$${immediate.toString(16).padStart(8, '0')}`,
            cycles: 8,
            asm: `TRAP${condName} #$${immediate.toString(16).padStart(8, '0')}`,
            description: `Conditional trap ${condName} with long immediate (NO TRAP)`,
            pc: pc,
            immediate: immediate
        };
    }

    // Helper method to test conditions (same as in CriticalOpcodes)
    testCondition(condition) {
        switch (condition) {
            case 0:  return true;                           // T  - True
            case 1:  return false;                          // F  - False
            case 2:  return !this.flag_c && !this.flag_z;  // HI - High
            case 3:  return this.flag_c || this.flag_z;    // LS - Low or Same
            case 4:  return !this.flag_c;                  // CC - Carry Clear
            case 5:  return this.flag_c;                   // CS - Carry Set
            case 6:  return !this.flag_z;                  // NE - Not Equal
            case 7:  return this.flag_z;                   // EQ - Equal
            case 8:  return !this.flag_v;                  // VC - Overflow Clear
            case 9:  return this.flag_v;                   // VS - Overflow Set
            case 10: return !this.flag_n;                  // PL - Plus
            case 11: return this.flag_n;                   // MI - Minus
            case 12: return this.flag_n === this.flag_v;   // GE - Greater or Equal
            case 13: return this.flag_n !== this.flag_v;   // LT - Less Than
            case 14: return !this.flag_z && (this.flag_n === this.flag_v); // GT - Greater Than
            case 15: return this.flag_z || (this.flag_n !== this.flag_v);  // LE - Less or Equal
            default: return false;
        }
    }
}

module.exports = Mc68020ExtendedOpcodes;