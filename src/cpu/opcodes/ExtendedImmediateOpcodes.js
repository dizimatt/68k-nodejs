/**
 * Extended Immediate Opcodes
 * Implements missing immediate-to-memory operations for the 68k CPU
 * Based on SAE (Musashi) open-source project
 */

class ExtendedImmediateOpcodes {
    constructor(cpu) {
        this.cpu = cpu;
    }

    setup(opcodeTable) {
        const cpu = this.cpu;

        // ADDI.B #imm,EA - Add immediate to memory byte
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue; // Skip invalid modes
                const opcode = 0x0600 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_addi_b_imm_ea.call(cpu, mode, reg);
            }
        }

        // ADDI.W #imm,EA - Add immediate to memory word
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0640 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_addi_w_imm_ea.call(cpu, mode, reg);
            }
        }

        // ADDI.L #imm,EA - Add immediate to memory long
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0680 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_addi_l_imm_ea.call(cpu, mode, reg);
            }
        }

        // SUBI.B #imm,EA - Subtract immediate from memory byte
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0400 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_subi_b_imm_ea.call(cpu, mode, reg);
            }
        }

        // SUBI.W #imm,EA - Subtract immediate from memory word
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0440 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_subi_w_imm_ea.call(cpu, mode, reg);
            }
        }

        // SUBI.L #imm,EA - Subtract immediate from memory long
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0480 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_subi_l_imm_ea.call(cpu, mode, reg);
            }
        }

        // ANDI.B #imm,EA - AND immediate with memory byte
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0200 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_andi_b_imm_ea.call(cpu, mode, reg);
            }
        }

        // ANDI.W #imm,EA - AND immediate with memory word
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0240 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_andi_w_imm_ea.call(cpu, mode, reg);
            }
        }

        // ANDI.L #imm,EA - AND immediate with memory long
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0280 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_andi_l_imm_ea.call(cpu, mode, reg);
            }
        }

        // ORI.B #imm,EA - OR immediate with memory byte
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0000 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_ori_b_imm_ea.call(cpu, mode, reg);
            }
        }

        // ORI.W #imm,EA - OR immediate with memory word
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0040 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_ori_w_imm_ea.call(cpu, mode, reg);
            }
        }

        // ORI.L #imm,EA - OR immediate with memory long
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0080 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_ori_l_imm_ea.call(cpu, mode, reg);
            }
        }

        // EORI.B #imm,EA - XOR immediate with memory byte
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0A00 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_eori_b_imm_ea.call(cpu, mode, reg);
            }
        }

        // EORI.W #imm,EA - XOR immediate with memory word
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0A40 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_eori_w_imm_ea.call(cpu, mode, reg);
            }
        }

        // EORI.L #imm,EA - XOR immediate with memory long
        for (let mode = 0; mode < 8; mode++) {
            for (let reg = 0; reg < 8; reg++) {
                if (mode === 1 && reg > 7) continue;
                const opcode = 0x0A80 | (mode << 3) | reg;
                opcodeTable[opcode] = () => this.op_eori_l_imm_ea.call(cpu, mode, reg);
            }
        }
    }

    // Immediate operation implementations
    op_addi_b_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord() & 0xFF;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const value = this.readMemory(ea, 1);
        const result = value + immediate;
        
        this.writeMemory(ea, result & 0xFF, 1);
        this.setFlagsAdd8(immediate, value, result);
        this.cycles += 8;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ADDI.B #${immediate},${this.formatEA(mode, reg)} ; Add immediate byte`);
        return {
            name: `ADDI.B #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 8,
            asm: `ADDI.B #${immediate},${this.formatEA(mode, reg)}`,
            description: `Add immediate byte to effective address`,
            pc: pc
        };
    }

    op_addi_w_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord();
        const ea = this.getEffectiveAddress(mode, reg, 2);
        const value = this.readMemory(ea, 2);
        const result = value + immediate;
        
        this.writeMemory(ea, result & 0xFFFF, 2);
        this.setFlagsAdd16(immediate, value, result);
        this.cycles += 8;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ADDI.W #${immediate},${this.formatEA(mode, reg)} ; Add immediate word`);
        return {
            name: `ADDI.W #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 8,
            asm: `ADDI.W #${immediate},${this.formatEA(mode, reg)}`,
            description: `Add immediate word to effective address`,
            pc: pc
        };
    }

    op_addi_l_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchLong();
        const ea = this.getEffectiveAddress(mode, reg, 4);
        const value = this.readMemory(ea, 4);
        const result = value + immediate;
        
        this.writeMemory(ea, result >>> 0, 4);
        this.setFlagsAdd32(immediate, value, result);
        this.cycles += 12;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ADDI.L #${immediate},${this.formatEA(mode, reg)} ; Add immediate long`);
        return {
            name: `ADDI.L #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 12,
            asm: `ADDI.L #${immediate},${this.formatEA(mode, reg)}`,
            description: `Add immediate long to effective address`,
            pc: pc
        };
    }

    op_subi_b_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord() & 0xFF;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const value = this.readMemory(ea, 1);
        const result = value - immediate;
        
        this.writeMemory(ea, result & 0xFF, 1);
        this.setFlagsSub8(value, immediate, result);
        this.cycles += 8;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: SUBI.B #${immediate},${this.formatEA(mode, reg)} ; Subtract immediate byte`);
        return {
            name: `SUBI.B #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 8,
            asm: `SUBI.B #${immediate},${this.formatEA(mode, reg)}`,
            description: `Subtract immediate byte from effective address`,
            pc: pc
        };
    }

    op_subi_w_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord();
        const ea = this.getEffectiveAddress(mode, reg, 2);
        const value = this.readMemory(ea, 2);
        const result = value - immediate;
        
        this.writeMemory(ea, result & 0xFFFF, 2);
        this.setFlagsSub16(value, immediate, result);
        this.cycles += 8;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: SUBI.W #${immediate},${this.formatEA(mode, reg)} ; Subtract immediate word`);
        return {
            name: `SUBI.W #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 8,
            asm: `SUBI.W #${immediate},${this.formatEA(mode, reg)}`,
            description: `Subtract immediate word from effective address`,
            pc: pc
        };
    }

    op_subi_l_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchLong();
        const ea = this.getEffectiveAddress(mode, reg, 4);
        const value = this.readMemory(ea, 4);
        const result = value - immediate;
        
        this.writeMemory(ea, result >>> 0, 4);
        this.setFlagsSub32(value, immediate, result);
        this.cycles += 12;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: SUBI.L #${immediate},${this.formatEA(mode, reg)} ; Subtract immediate long`);
        return {
            name: `SUBI.L #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 12,
            asm: `SUBI.L #${immediate},${this.formatEA(mode, reg)}`,
            description: `Subtract immediate long from effective address`,
            pc: pc
        };
    }

    op_andi_b_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord() & 0xFF;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const value = this.readMemory(ea, 1);
        const result = value & immediate;
        
        this.writeMemory(ea, result & 0xFF, 1);
        this.setFlagsLogic8(result);
        this.cycles += 8;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ANDI.B #${immediate},${this.formatEA(mode, reg)} ; AND immediate byte`);
        return {
            name: `ANDI.B #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 8,
            asm: `ANDI.B #${immediate},${this.formatEA(mode, reg)}`,
            description: `AND immediate byte with effective address`,
            pc: pc
        };
    }

    op_andi_w_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord();
        const ea = this.getEffectiveAddress(mode, reg, 2);
        const value = this.readMemory(ea, 2);
        const result = value & immediate;
        
        this.writeMemory(ea, result & 0xFFFF, 2);
        this.setFlagsLogic16(result);
        this.cycles += 8;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ANDI.W #${immediate},${this.formatEA(mode, reg)} ; AND immediate word`);
        return {
            name: `ANDI.W #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 8,
            asm: `ANDI.W #${immediate},${this.formatEA(mode, reg)}`,
            description: `AND immediate word with effective address`,
            pc: pc
        };
    }

    op_andi_l_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchLong();
        const ea = this.getEffectiveAddress(mode, reg, 4);
        const value = this.readMemory(ea, 4);
        const result = value & immediate;
        
        this.writeMemory(ea, result >>> 0, 4);
        this.setFlagsLogic32(result);
        this.cycles += 12;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ANDI.L #${immediate},${this.formatEA(mode, reg)} ; AND immediate long`);
        return {
            name: `ANDI.L #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 12,
            asm: `ANDI.L #${immediate},${this.formatEA(mode, reg)}`,
            description: `AND immediate long with effective address`,
            pc: pc
        };
    }

    op_ori_b_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord() & 0xFF;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const value = this.readMemory(ea, 1);
        const result = value | immediate;
        
        this.writeMemory(ea, result & 0xFF, 1);
        this.setFlagsLogic8(result);
        this.cycles += 8;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ORI.B #${immediate},${this.formatEA(mode, reg)} ; OR immediate byte`);
        console.log(`       → ${this.formatEA(mode, reg)}: 0x${value.toString(16).padStart(2, '0')} | 0x${immediate.toString(16).padStart(2, '0')} = 0x${(result & 0xFF).toString(16).padStart(2, '0')}`);
        
        return {
            name: `ORI.B #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 8,
            asm: `ORI.B #${immediate},${this.formatEA(mode, reg)}`,
            description: `OR immediate byte with effective address`,
            pc: pc,
            immediate: immediate,
            result: result & 0xFF
        };
    }

    op_ori_w_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord();
        const ea = this.getEffectiveAddress(mode, reg, 2);
        const value = this.readMemory(ea, 2);
        const result = value | immediate;
        
        this.writeMemory(ea, result & 0xFFFF, 2);
        this.setFlagsLogic16(result);
        this.cycles += 8;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ORI.W #${immediate},${this.formatEA(mode, reg)} ; OR immediate word`);
        return {
            name: `ORI.W #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 8,
            asm: `ORI.W #${immediate},${this.formatEA(mode, reg)}`,
            description: `OR immediate word with effective address`,
            pc: pc
        };
    }

    op_ori_l_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchLong();
        const ea = this.getEffectiveAddress(mode, reg, 4);
        const value = this.readMemory(ea, 4);
        const result = value | immediate;
        
        this.writeMemory(ea, result >>> 0, 4);
        this.setFlagsLogic32(result);
        this.cycles += 12;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ORI.L #${immediate},${this.formatEA(mode, reg)} ; OR immediate long`);
        return {
            name: `ORI.L #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 12,
            asm: `ORI.L #${immediate},${this.formatEA(mode, reg)}`,
            description: `OR immediate long with effective address`,
            pc: pc
        };
    }

    op_eori_b_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord() & 0xFF;
        const ea = this.getEffectiveAddress(mode, reg, 1);
        const value = this.readMemory(ea, 1);
        const result = value ^ immediate;
        
        this.writeMemory(ea, result & 0xFF, 1);
        this.setFlagsLogic8(result);
        this.cycles += 8;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: EORI.B #${immediate},${this.formatEA(mode, reg)} ; XOR immediate byte`);
        return {
            name: `EORI.B #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 8,
            asm: `EORI.B #${immediate},${this.formatEA(mode, reg)}`,
            description: `XOR immediate byte with effective address`,
            pc: pc
        };
    }

    op_eori_w_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord();
        const ea = this.getEffectiveAddress(mode, reg, 2);
        const value = this.readMemory(ea, 2);
        const result = value ^ immediate;
        
        this.writeMemory(ea, result & 0xFFFF, 2);
        this.setFlagsLogic16(result);
        this.cycles += 8;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: EORI.W #${immediate},${this.formatEA(mode, reg)} ; XOR immediate word`);
        return {
            name: `EORI.W #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 8,
            asm: `EORI.W #${immediate},${this.formatEA(mode, reg)}`,
            description: `XOR immediate word with effective address`,
            pc: pc
        };
    }

    op_eori_l_imm_ea(mode, reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchLong();
        const ea = this.getEffectiveAddress(mode, reg, 4);
        const value = this.readMemory(ea, 4);
        const result = value ^ immediate;
        
        this.writeMemory(ea, result >>> 0, 4);
        this.setFlagsLogic32(result);
        this.cycles += 12;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: EORI.L #${immediate},${this.formatEA(mode, reg)} ; XOR immediate long`);
        return {
            name: `EORI.L #${immediate},${this.formatEA(mode, reg)}`,
            cycles: 12,
            asm: `EORI.L #${immediate},${this.formatEA(mode, reg)}`,
            description: `XOR immediate long with effective address`,
            pc: pc
        };
    }

    // Helper methods
    getEffectiveAddress(mode, reg, size) {
        switch (mode) {
            case 0: return this.registers.d[reg]; // Dn
            case 1: return this.registers.a[reg]; // An
            case 2: return this.registers.a[reg]; // (An)
            case 3: return this.registers.a[reg] + (size === 1 ? 1 : size === 2 ? 2 : 4); // (An)+
            case 4: return this.registers.a[reg] - (size === 1 ? 1 : size === 2 ? 2 : 4); // -(An)
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

    formatEA(mode, reg) {
        const modes = ['Dn', 'An', '(An)', '(An)+', '-(An)', 'd16(An)', 'd8(An,Xn)', 'abs'];
        return `${modes[mode]}${reg}`;
    }

    // Flag setting methods
    setFlagsLogic8(result) {
        this.flag_z = (result & 0xFF) === 0 ? 1 : 0;
        this.flag_n = (result & 0x80) !== 0 ? 1 : 0;
        this.flag_c = 0;
        this.flag_v = 0;
    }

    setFlagsLogic16(result) {
        this.flag_z = (result & 0xFFFF) === 0 ? 1 : 0;
        this.flag_n = (result & 0x8000) !== 0 ? 1 : 0;
        this.flag_c = 0;
        this.flag_v = 0;
    }

    setFlagsLogic32(result) {
        this.flag_z = (result >>> 0) === 0 ? 1 : 0;
        this.flag_n = (result & 0x80000000) !== 0 ? 1 : 0;
        this.flag_c = 0;
        this.flag_v = 0;
    }

    setFlagsAdd8(src, dst, result) {
        const res8 = result & 0xFF;
        this.flag_x = this.flag_c = (result > 0xFF) ? 1 : 0;
        this.flag_z = (res8 === 0) ? 1 : 0;
        this.flag_n = (res8 & 0x80) !== 0 ? 1 : 0;
        this.flag_v = ((src ^ res8) & (dst ^ res8) & 0x80) !== 0 ? 1 : 0;
    }

    setFlagsAdd16(src, dst, result) {
        const res16 = result & 0xFFFF;
        this.flag_x = this.flag_c = (result > 0xFFFF) ? 1 : 0;
        this.flag_z = (res16 === 0) ? 1 : 0;
        this.flag_n = (res16 & 0x8000) !== 0 ? 1 : 0;
        this.flag_v = ((src ^ res16) & (dst ^ res16) & 0x8000) !== 0 ? 1 : 0;
    }

    setFlagsAdd32(src, dst, result) {
        const res32 = result >>> 0;
        this.flag_x = this.flag_c = (result > 0xFFFFFFFF) ? 1 : 0;
        this.flag_z = (res32 === 0) ? 1 : 0;
        this.flag_n = (res32 & 0x80000000) !== 0 ? 1 : 0;
        this.flag_v = ((src ^ res32) & (dst ^ res32) & 0x80000000) !== 0 ? 1 : 0;
    }

    setFlagsSub8(src, dst, result) {
        const res8 = result & 0xFF;
        this.flag_x = this.flag_c = (result < 0) ? 1 : 0;
        this.flag_z = (res8 === 0) ? 1 : 0;
        this.flag_n = (res8 & 0x80) !== 0 ? 1 : 0;
        this.flag_v = ((src ^ dst) & (res8 ^ dst) & 0x80) !== 0 ? 1 : 0;
    }

    setFlagsSub16(src, dst, result) {
        const res16 = result & 0xFFFF;
        this.flag_x = this.flag_c = (result < 0) ? 1 : 0;
        this.flag_z = (res16 === 0) ? 1 : 0;
        this.flag_n = (res16 & 0x8000) !== 0 ? 1 : 0;
        this.flag_v = ((src ^ dst) & (res16 ^ dst) & 0x8000) !== 0 ? 1 : 0;
    }

    setFlagsSub32(src, dst, result) {
        const res32 = result >>> 0;
        this.flag_x = this.flag_c = (result < 0) ? 1 : 0;
        this.flag_z = (res32 === 0) ? 1 : 0;
        this.flag_n = (res32 & 0x80000000) !== 0 ? 1 : 0;
        this.flag_v = ((src ^ dst) & (res32 ^ dst) & 0x80000000) !== 0 ? 1 : 0;
    }
}

module.exports = ExtendedImmediateOpcodes;