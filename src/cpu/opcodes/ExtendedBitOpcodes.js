/**
 * Extended Bit Manipulation Opcodes
 * Implements missing bit manipulation instructions for the 68k CPU
 * Based on SAE (Musashi) open-source project
 */

class ExtendedBitOpcodes {
    constructor(cpu) {
        this.cpu = cpu;
    }

    setup(opcodeTable) {
        const cpu = this.cpu;

        // BTST.B #imm,EA - Test bit with immediate
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0800 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_btst_b_imm_ea.call(cpu, mode, reg);
            }
        }

        // BCHG.B #imm,EA - Change bit with immediate
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0840 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_bchg_b_imm_ea.call(cpu, mode, reg);
            }
        }

        // BCLR.B #imm,EA - Clear bit with immediate
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0880 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_bclr_b_imm_ea.call(cpu, mode, reg);
            }
        }

        // BSET.B #imm,EA - Set bit with immediate
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x08C0 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_bset_b_imm_ea.call(cpu, mode, reg);
            }
        }

        // BTST.B Dn,EA - Test bit with register
        for (let bitReg = 0; bitReg < 8; bitReg++) {
            for (let mode = 0; mode < 8; mode++) {
                for (let reg = 0; reg < 8; reg++) {
                    if (mode === 1 && reg > 7) continue;
                    const opcode = 0x0100 | (bitReg << 9) | (mode << 3) | reg;
                    opcodeTable[opcode] = () => this.op_btst_b_d_ea.call(cpu, bitReg, mode, reg);
                }
            }
        }

        // BCHG.B Dn,EA - Change bit with register
        for (let bitReg = 0; bitReg < 8; bitReg++) {
            for (let mode = 0; mode < 8; mode++) {
                for (let reg = 0; reg < 8; reg++) {
                    if (mode === 1 && reg > 7) continue;
                    const opcode = 0x0140 | (bitReg << 9) | (mode << 3) | reg;
                    opcodeTable[opcode] = () => this.op_bchg_b_d_ea.call(cpu, bitReg, mode, reg);
                }
            }
        }

        // BCLR.B Dn,EA - Clear bit with register
        for (let bitReg = 0; bitReg < 8; bitReg++) {
            for (let mode = 0; mode < 8; mode++) {
                for (let reg = 0; reg < 8; reg++) {
                    if (mode === 1 && reg > 7) continue;
                    const opcode = 0x0180 | (bitReg << 9) | (mode << 3) | reg;
                    opcodeTable[opcode] = () => this.op_bclr_b_d_ea.call(cpu, bitReg, mode, reg);
                }
            }
        }

        // BSET.B Dn,EA - Set bit with register
        for (let bitReg = 0; bitReg < 8; bitReg++) {
            for (let mode = 0; mode < 8; mode++) {
                for (let reg = 0; reg < 8; reg++) {
                    if (mode === 1 && reg > 7) continue;
                    const opcode = 0x01C0 | (bitReg << 9) | (mode << 3) | reg;
                    opcodeTable[opcode] = () => this.op_bset_b_d_ea.call(cpu, bitReg, mode, reg);
                }
            }
        }

        // Scc - Set condition codes
        for (let condition = 0; condition < 16; condition++) {
            for (let mode = 0; mode < 8; mode++) {
                for (let reg = 0; reg < 8; reg++) {
                    if (mode === 1 && reg > 7) continue;
                    const opcode = 0x50C0 | (condition << 8) | (mode << 3) | reg;
                    opcodeTable[opcode] = () => this.op_scc.call(cpu, condition, mode, reg);
                }
            }
        }

        // DBcc - Test condition, decrement and branch
        for (let condition = 0; condition < 16; condition++) {
            for (let reg = 0; reg < 8; reg++) {
                const opcode = 0x50C8 | (condition << 8) | reg;
                opcodeTable[opcode] = () => this.op_dbcc.call(cpu, condition, reg);
            }
        }
    }

    // Bit manipulation implementations
    op_btst_b_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const bitNumber = this.fetchWord() & 7;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const value = this.readMemory(ea, 1);
        const bit = (value >> bitNumber) & 1;
        
        this.flag_z = bit === 0 ? 1 : 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BTST.B #${bitNumber},${this.formatEA(mode, reg)} ; Test bit ${bitNumber}`);
    }

    op_bchg_b_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const bitNumber = this.fetchWord() & 7;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const value = this.readMemory(ea, 1);
        const newValue = value ^ (1 << bitNumber);
        
        this.writeMemory(ea, newValue, 1);
        this.flag_z = ((value >> bitNumber) & 1) === 0 ? 1 : 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BCHG.B #${bitNumber},${this.formatEA(mode, reg)} ; Change bit ${bitNumber}`);
    }

    op_bclr_b_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const bitNumber = this.fetchWord() & 7;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const value = this.readMemory(ea, 1);
        const newValue = value & ~(1 << bitNumber);
        
        this.writeMemory(ea, newValue, 1);
        this.flag_z = ((value >> bitNumber) & 1) === 0 ? 1 : 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BCLR.B #${bitNumber},${this.formatEA(mode, reg)} ; Clear bit ${bitNumber}`);
    }

    op_bset_b_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const bitNumber = this.fetchWord() & 7;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const value = this.readMemory(ea, 1);
        const newValue = value | (1 << bitNumber);
        
        this.writeMemory(ea, newValue, 1);
        this.flag_z = ((value >> bitNumber) & 1) === 0 ? 1 : 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BSET.B #${bitNumber},${this.formatEA(mode, reg)} ; Set bit ${bitNumber}`);
    }

    op_btst_b_d_ea(bitReg, mode, reg) {
        const pc = this.registers.pc - 2;
        const bitNumber = this.registers.d[bitReg] & 7;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const value = this.readMemory(ea, 1);
        const bit = (value >> bitNumber) & 1;
        
        this.flag_z = bit === 0 ? 1 : 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BTST.B D${bitReg},${this.formatEA(mode, reg)} ; Test bit D${bitReg}`);
    }

    op_bchg_b_d_ea(bitReg, mode, reg) {
        const pc = this.registers.pc - 2;
        const bitNumber = this.registers.d[bitReg] & 7;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const value = this.readMemory(ea, 1);
        const newValue = value ^ (1 << bitNumber);
        
        this.writeMemory(ea, newValue, 1);
        this.flag_z = ((value >> bitNumber) & 1) === 0 ? 1 : 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BCHG.B D${bitReg},${this.formatEA(mode, reg)} ; Change bit D${bitReg}`);
    }

    op_bclr_b_d_ea(bitReg, mode, reg) {
        const pc = this.registers.pc - 2;
        const bitNumber = this.registers.d[bitReg] & 7;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const value = this.readMemory(ea, 1);
        const newValue = value & ~(1 << bitNumber);
        
        this.writeMemory(ea, newValue, 1);
        this.flag_z = ((value >> bitNumber) & 1) === 0 ? 1 : 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BCLR.B D${bitReg},${this.formatEA(mode, reg)} ; Clear bit D${bitReg}`);
    }

    op_bset_b_d_ea(bitReg, mode, reg) {
        const pc = this.registers.pc - 2;
        const bitNumber = this.registers.d[bitReg] & 7;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const value = this.readMemory(ea, 1);
        const newValue = value | (1 << bitNumber);
        
        this.writeMemory(ea, newValue, 1);
        this.flag_z = ((value >> bitNumber) & 1) === 0 ? 1 : 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BSET.B D${bitReg},${this.formatEA(mode, reg)} ; Set bit D${bitReg}`);
    }

    op_scc(condition, mode, reg) {
        const pc = this.registers.pc - 2;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const conditionMet = this.testCondition(condition);
        const value = conditionMet ? 0xFF : 0x00;
        
        this.writeMemory(ea, value, 1);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: S${this.getConditionName(condition)} ${this.formatEA(mode, reg)} ; Set condition`);
    }

    op_dbcc(condition, reg) {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        
        if (!this.testCondition(condition)) {
            this.registers.d[reg] = (this.registers.d[reg] - 1) & 0xFFFF;
            if ((this.registers.d[reg] & 0xFFFF) !== 0xFFFF) {
                this.registers.pc = (pc + 2 + signedDisp) >>> 0;
            }
        }
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DB${this.getConditionName(condition)} D${reg},$${(pc + 2 + signedDisp).toString(16).padStart(8, '0')} ; Decrement and branch`);
    }

    // Helper methods
    getEffectiveAddress(mode, reg, size) {
        switch (mode) {
            case 0: return this.registers.d[reg]; // Dn
            case 1: return this.registers.a[reg]; // An
            case 2: return this.registers.a[reg]; // (An)
            case 3: return this.registers.a[reg]; // (An)+
            case 4: return this.registers.a[reg]; // -(An)
            case 5: {
                const displacement = this.fetchWord();
                return this.registers.a[reg] + ((displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement);
            }
            case 6: return this.calculateIndexedAddress(reg);
            case 7: {
                switch (reg) {
                    case 0: return this.fetchWord(); // abs.W
                    case 1: return this.fetchLong(); // abs.L
                    case 2: {
                        const displacement = this.fetchWord();
                        return this.registers.pc + ((displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement);
                    }
                    case 3: return this.calculatePCIndexedAddress();
                    default: return 0;
                }
            }
            default: return 0;
        }
    }

    readMemory(address, size) {
        switch (size) {
            case 1: return this.memory.readByte(address);
            case 2: return this.memory.readWord(address);
            case 4: return this.memory.readLong(address);
            default: return 0;
        }
    }

    writeMemory(address, value, size) {
        switch (size) {
            case 1: this.memory.writeByte(address, value); break;
            case 2: this.memory.writeWord(address, value); break;
            case 4: this.memory.writeLong(address, value); break;
        }
    }

    calculateIndexedAddress(reg) {
        const extension = this.fetchWord();
        const displacement = (extension & 0x80) ? (extension | 0xFFFFFF00) : (extension & 0xFF);
        const indexReg = (extension >> 12) & 7;
        const indexType = (extension >> 15) & 1;
        const indexSize = (extension >> 11) & 1;
        
        let indexValue = indexType ? this.registers.a[indexReg] : this.registers.d[indexReg];
        if (!indexSize) indexValue = (indexValue & 0x8000) ? (indexValue | 0xFFFF0000) : (indexValue & 0xFFFF);
        
        return this.registers.a[reg] + displacement + indexValue;
    }

    calculatePCIndexedAddress() {
        const extension = this.fetchWord();
        const displacement = (extension & 0x80) ? (extension | 0xFFFFFF00) : (extension & 0xFF);
        const indexReg = (extension >> 12) & 7;
        const indexType = (extension >> 15) & 1;
        const indexSize = (extension >> 11) & 1;
        
        let indexValue = indexType ? this.registers.a[indexReg] : this.registers.d[indexReg];
        if (!indexSize) indexValue = (indexValue & 0x8000) ? (indexValue | 0xFFFF0000) : (indexValue & 0xFFFF);
        
        return this.registers.pc + displacement + indexValue;
    }

    testCondition(condition) {
        switch (condition) {
            case 0: return true; // T
            case 1: return false; // F
            case 2: return this.flag_c === 0 && this.flag_z === 0; // HI
            case 3: return this.flag_c === 1 || this.flag_z === 1; // LS
            case 4: return this.flag_c === 0; // CC
            case 5: return this.flag_c === 1; // CS
            case 6: return this.flag_z === 0; // NE
            case 7: return this.flag_z === 1; // EQ
            case 8: return this.flag_v === 0; // VC
            case 9: return this.flag_v === 1; // VS
            case 10: return this.flag_n === 0; // PL
            case 11: return this.flag_n === 1; // MI
            case 12: return (this.flag_n ^ this.flag_v) === 0 && this.flag_z === 0; // GE
            case 13: return (this.flag_n ^ this.flag_v) === 1 || this.flag_z === 1; // LT
            case 14: return (this.flag_n ^ this.flag_v) === 0 && this.flag_z === 0; // GT
            case 15: return (this.flag_n ^ this.flag_v) === 1 || this.flag_z === 1; // LE
            default: return false;
        }
    }

    getConditionName(condition) {
        const names = ['T', 'F', 'HI', 'LS', 'CC', 'CS', 'NE', 'EQ', 'VC', 'VS', 'PL', 'MI', 'GE', 'LT', 'GT', 'LE'];
        return names[condition];
    }

    formatEA(mode, reg) {
        const modes = ['Dn', 'An', '(An)', '(An)+', '-(An)', 'd16(An)', 'd8(An,Xn)', 'abs'];
        return `${modes[mode]}${reg}`;
    }
}

module.exports = ExtendedBitOpcodes;