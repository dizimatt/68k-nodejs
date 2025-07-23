// src/cpu/opcodes/HighPriorityOpcodes.js - High Priority Instructions (Bit manipulation, Multiply/Divide)

class HighPriorityOpcodes {
    constructor(cpu) {
        this.cpu = cpu;
    }

    setup(opcodeTable) {
        const cpu = this.cpu;
        console.log('🔧 [CPU] Setting up high priority opcodes...');

        // BTST #imm,Dn - Bit test immediate with data register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x0800 | reg;
            opcodeTable[opcode] = () => this.op_btst_imm_d.call(cpu, reg);
        }

        // BTST #imm,(An) - Bit test immediate with memory
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x0810 | reg;
            opcodeTable[opcode] = () => this.op_btst_imm_an.call(cpu, reg);
        }

        // BTST Dn,Dm - Bit test register with register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x0100 | (src << 9) | dst;
                opcodeTable[opcode] = () => this.op_btst_d_d.call(cpu, src, dst);
            }
        }

        // BSET #imm,Dn - Bit set immediate with data register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x08C0 | reg;
            opcodeTable[opcode] = () => this.op_bset_imm_d.call(cpu, reg);
        }

        // BSET #imm,(An) - Bit set immediate with memory
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x08D0 | reg;
            opcodeTable[opcode] = () => this.op_bset_imm_an.call(cpu, reg);
        }

        // BSET Dn,Dm - Bit set register with register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x01C0 | (src << 9) | dst;
                opcodeTable[opcode] = () => this.op_bset_d_d.call(cpu, src, dst);
            }
        }

        // BCLR #imm,Dn - Bit clear immediate with data register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x0880 | reg;
            opcodeTable[opcode] = () => this.op_bclr_imm_d.call(cpu, reg);
        }

        // BCLR #imm,(An) - Bit clear immediate with memory
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x0890 | reg;
            opcodeTable[opcode] = () => this.op_bclr_imm_an.call(cpu, reg);
        }

        // BCLR Dn,Dm - Bit clear register with register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x0180 | (src << 9) | dst;
                opcodeTable[opcode] = () => this.op_bclr_d_d.call(cpu, src, dst);
            }
        }

        // BCHG #imm,Dn - Bit change immediate with data register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x0840 | reg;
            opcodeTable[opcode] = () => this.op_bchg_imm_d.call(cpu, reg);
        }

        // BCHG #imm,(An) - Bit change immediate with memory
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x0850 | reg;
            opcodeTable[opcode] = () => this.op_bchg_imm_an.call(cpu, reg);
        }

        // BCHG Dn,Dm - Bit change register with register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x0140 | (src << 9) | dst;
                opcodeTable[opcode] = () => this.op_bchg_d_d.call(cpu, src, dst);
            }
        }

        // MULS.W Dn,Dm - Signed multiply word
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xC1C0 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_muls_w_d_d.call(cpu, src, dst);
            }
        }

        // MULS.W #imm,Dn - Signed multiply word immediate
        for (let dst = 0; dst < 8; dst++) {
            const opcode = 0xC1FC | (dst << 9);
            opcodeTable[opcode] = () => this.op_muls_w_imm_d.call(cpu, dst);
        }

        // MULU.W Dn,Dm - Unsigned multiply word
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xC0C0 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_mulu_w_d_d.call(cpu, src, dst);
            }
        }

        // MULU.W #imm,Dn - Unsigned multiply word immediate
        for (let dst = 0; dst < 8; dst++) {
            const opcode = 0xC0FC | (dst << 9);
            opcodeTable[opcode] = () => this.op_mulu_w_imm_d.call(cpu, dst);
        }

        // DIVS.W Dn,Dm - Signed divide word
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x81C0 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_divs_w_d_d.call(cpu, src, dst);
            }
        }

        // DIVS.W #imm,Dn - Signed divide word immediate
        for (let dst = 0; dst < 8; dst++) {
            const opcode = 0x81FC | (dst << 9);
            opcodeTable[opcode] = () => this.op_divs_w_imm_d.call(cpu, dst);
        }

        // DIVU.W Dn,Dm - Unsigned divide word
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x80C0 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_divu_w_d_d.call(cpu, src, dst);
            }
        }

        // DIVU.W #imm,Dn - Unsigned divide word immediate
        for (let dst = 0; dst < 8; dst++) {
            const opcode = 0x80FC | (dst << 9);
            opcodeTable[opcode] = () => this.op_divu_w_imm_d.call(cpu, dst);
        }

        // EXG Dn,Dm - Exchange data registers
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xC140 | (src << 9) | dst;
                opcodeTable[opcode] = () => this.op_exg_d_d.call(cpu, src, dst);
            }
        }

        // EXG An,Am - Exchange address registers
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xC148 | (src << 9) | dst;
                opcodeTable[opcode] = () => this.op_exg_a_a.call(cpu, src, dst);
            }
        }

        // EXG Dn,Am - Exchange data and address registers
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xC188 | (src << 9) | dst;
                opcodeTable[opcode] = () => this.op_exg_d_a.call(cpu, src, dst);
            }
        }

        // SWAP Dn - Swap register halves
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4840 | reg;
            opcodeTable[opcode] = () => this.op_swap.call(cpu, reg);
        }

        console.log('✅ [CPU] High priority opcodes setup complete');
    }

    // Bit manipulation implementations
    op_btst_imm_d(reg) {
        const pc = this.registers.pc - 2;
        const bitNum = this.fetchWord() & 0x1F; // Modulo 32 for data registers
        const value = this.registers.d[reg];
        const bitSet = (value & (1 << bitNum)) !== 0;

        this.flag_z = bitSet ? 0 : 1;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BTST #${bitNum},D${reg}            ; Test bit ${bitNum} in data register`);
        console.log(`       → D${reg}[${bitNum}] = ${bitSet ? '1' : '0'} (Z=${this.flag_z})`);

        this.cycles += 10;
        return {
            name: `BTST #${bitNum},D${reg}`,
            cycles: 10,
            asm: `BTST #${bitNum},D${reg}`,
            description: 'Test bit in data register',
            pc: pc,
            bitNum: bitNum,
            bitSet: bitSet
        };
    }

    op_btst_imm_an(reg) {
        const pc = this.registers.pc - 2;
        const bitNum = this.fetchWord() & 0x07; // Modulo 8 for memory
        const address = this.registers.a[reg];
        const value = this.memory.readByte(address);
        const bitSet = (value & (1 << bitNum)) !== 0;

        this.flag_z = bitSet ? 0 : 1;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BTST #${bitNum},(A${reg})          ; Test bit ${bitNum} in memory`);
        console.log(`       → (A${reg})@0x${address.toString(16)}[${bitNum}] = ${bitSet ? '1' : '0'} (Z=${this.flag_z})`);

        this.cycles += 12;
        return {
            name: `BTST #${bitNum},(A${reg})`,
            cycles: 12,
            asm: `BTST #${bitNum},(A${reg})`,
            description: 'Test bit in memory',
            pc: pc,
            bitNum: bitNum,
            bitSet: bitSet,
            address: address
        };
    }

    op_btst_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const bitNum = this.registers.d[src] & 0x1F; // Modulo 32 for data registers
        const value = this.registers.d[dst];
        const bitSet = (value & (1 << bitNum)) !== 0;

        this.flag_z = bitSet ? 0 : 1;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BTST D${src},D${dst}              ; Test bit D${src}[4:0] in D${dst}`);
        console.log(`       → D${dst}[${bitNum}] = ${bitSet ? '1' : '0'} (Z=${this.flag_z})`);

        this.cycles += 6;
        return {
            name: `BTST D${src},D${dst}`,
            cycles: 6,
            asm: `BTST D${src},D${dst}`,
            description: 'Test bit register with register',
            pc: pc,
            bitNum: bitNum,
            bitSet: bitSet
        };
    }

    op_bset_imm_d(reg) {
        const pc = this.registers.pc - 2;
        const bitNum = this.fetchWord() & 0x1F;
        const oldValue = this.registers.d[reg];
        const bitSet = (oldValue & (1 << bitNum)) !== 0;

        this.registers.d[reg] |= (1 << bitNum);
        this.flag_z = bitSet ? 0 : 1;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BSET #${bitNum},D${reg}            ; Set bit ${bitNum} in data register`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (was ${bitSet ? '1' : '0'})`);

        this.cycles += 12;
        return {
            name: `BSET #${bitNum},D${reg}`,
            cycles: 12,
            asm: `BSET #${bitNum},D${reg}`,
            description: 'Set bit in data register',
            pc: pc,
            bitNum: bitNum,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    op_bset_imm_an(reg) {
        const pc = this.registers.pc - 2;
        const bitNum = this.fetchWord() & 0x07;
        const address = this.registers.a[reg];
        const oldValue = this.memory.readByte(address);
        const bitSet = (oldValue & (1 << bitNum)) !== 0;
        const newValue = oldValue | (1 << bitNum);

        this.memory.writeByte(address, newValue);
        this.flag_z = bitSet ? 0 : 1;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BSET #${bitNum},(A${reg})          ; Set bit ${bitNum} in memory`);
        console.log(`       → (A${reg})@0x${address.toString(16)}: 0x${oldValue.toString(16).padStart(2, '0')} → 0x${newValue.toString(16).padStart(2, '0')} (was ${bitSet ? '1' : '0'})`);

        this.cycles += 16;
        return {
            name: `BSET #${bitNum},(A${reg})`,
            cycles: 16,
            asm: `BSET #${bitNum},(A${reg})`,
            description: 'Set bit in memory',
            pc: pc,
            bitNum: bitNum,
            address: address
        };
    }

    op_bset_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const bitNum = this.registers.d[src] & 0x1F;
        const oldValue = this.registers.d[dst];
        const bitSet = (oldValue & (1 << bitNum)) !== 0;

        this.registers.d[dst] |= (1 << bitNum);
        this.flag_z = bitSet ? 0 : 1;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BSET D${src},D${dst}              ; Set bit D${src}[4:0] in D${dst}`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[dst].toString(16).padStart(8, '0')} (was ${bitSet ? '1' : '0'})`);

        this.cycles += 8;
        return {
            name: `BSET D${src},D${dst}`,
            cycles: 8,
            asm: `BSET D${src},D${dst}`,
            description: 'Set bit register with register',
            pc: pc,
            bitNum: bitNum,
            oldValue: oldValue,
            newValue: this.registers.d[dst]
        };
    }

    op_bclr_imm_d(reg) {
        const pc = this.registers.pc - 2;
        const bitNum = this.fetchWord() & 0x1F;
        const oldValue = this.registers.d[reg];
        const bitSet = (oldValue & (1 << bitNum)) !== 0;

        this.registers.d[reg] &= ~(1 << bitNum);
        this.flag_z = bitSet ? 0 : 1;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BCLR #${bitNum},D${reg}            ; Clear bit ${bitNum} in data register`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (was ${bitSet ? '1' : '0'})`);

        this.cycles += 14;
        return {
            name: `BCLR #${bitNum},D${reg}`,
            cycles: 14,
            asm: `BCLR #${bitNum},D${reg}`,
            description: 'Clear bit in data register',
            pc: pc,
            bitNum: bitNum,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    op_bclr_imm_an(reg) {
        const pc = this.registers.pc - 2;
        const bitNum = this.fetchWord() & 0x07;
        const address = this.registers.a[reg];
        const oldValue = this.memory.readByte(address);
        const bitSet = (oldValue & (1 << bitNum)) !== 0;
        const newValue = oldValue & ~(1 << bitNum);

        this.memory.writeByte(address, newValue);
        this.flag_z = bitSet ? 0 : 1;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BCLR #${bitNum},(A${reg})          ; Clear bit ${bitNum} in memory`);
        console.log(`       → (A${reg})@0x${address.toString(16)}: 0x${oldValue.toString(16).padStart(2, '0')} → 0x${newValue.toString(16).padStart(2, '0')} (was ${bitSet ? '1' : '0'})`);

        this.cycles += 16;
        return {
            name: `BCLR #${bitNum},(A${reg})`,
            cycles: 16,
            asm: `BCLR #${bitNum},(A${reg})`,
            description: 'Clear bit in memory',
            pc: pc,
            bitNum: bitNum,
            address: address
        };
    }

    op_bclr_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const bitNum = this.registers.d[src] & 0x1F;
        const oldValue = this.registers.d[dst];
        const bitSet = (oldValue & (1 << bitNum)) !== 0;

        this.registers.d[dst] &= ~(1 << bitNum);
        this.flag_z = bitSet ? 0 : 1;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BCLR D${src},D${dst}              ; Clear bit D${src}[4:0] in D${dst}`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[dst].toString(16).padStart(8, '0')} (was ${bitSet ? '1' : '0'})`);

        this.cycles += 10;
        return {
            name: `BCLR D${src},D${dst}`,
            cycles: 10,
            asm: `BCLR D${src},D${dst}`,
            description: 'Clear bit register with register',
            pc: pc,
            bitNum: bitNum,
            oldValue: oldValue,
            newValue: this.registers.d[dst]
        };
    }

    op_bchg_imm_d(reg) {
        const pc = this.registers.pc - 2;
        const bitNum = this.fetchWord() & 0x1F;
        const oldValue = this.registers.d[reg];
        const bitSet = (oldValue & (1 << bitNum)) !== 0;

        this.registers.d[reg] ^= (1 << bitNum);
        this.flag_z = bitSet ? 0 : 1;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BCHG #${bitNum},D${reg}            ; Change bit ${bitNum} in data register`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (was ${bitSet ? '1' : '0'})`);

        this.cycles += 12;
        return {
            name: `BCHG #${bitNum},D${reg}`,
            cycles: 12,
            asm: `BCHG #${bitNum},D${reg}`,
            description: 'Change bit in data register',
            pc: pc,
            bitNum: bitNum,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    op_bchg_imm_an(reg) {
        const pc = this.registers.pc - 2;
        const bitNum = this.fetchWord() & 0x07;
        const address = this.registers.a[reg];
        const oldValue = this.memory.readByte(address);
        const bitSet = (oldValue & (1 << bitNum)) !== 0;
        const newValue = oldValue ^ (1 << bitNum);

        this.memory.writeByte(address, newValue);
        this.flag_z = bitSet ? 0 : 1;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BCHG #${bitNum},(A${reg})          ; Change bit ${bitNum} in memory`);
        console.log(`       → (A${reg})@0x${address.toString(16)}: 0x${oldValue.toString(16).padStart(2, '0')} → 0x${newValue.toString(16).padStart(2, '0')} (was ${bitSet ? '1' : '0'})`);

        this.cycles += 16;
        return {
            name: `BCHG #${bitNum},(A${reg})`,
            cycles: 16,
            asm: `BCHG #${bitNum},(A${reg})`,
            description: 'Change bit in memory',
            pc: pc,
            bitNum: bitNum,
            address: address
        };
    }

    op_bchg_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const bitNum = this.registers.d[src] & 0x1F;
        const oldValue = this.registers.d[dst];
        const bitSet = (oldValue & (1 << bitNum)) !== 0;

        this.registers.d[dst] ^= (1 << bitNum);
        this.flag_z = bitSet ? 0 : 1;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: BCHG D${src},D${dst}              ; Change bit D${src}[4:0] in D${dst}`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[dst].toString(16).padStart(8, '0')} (was ${bitSet ? '1' : '0'})`);

        this.cycles += 8;
        return {
            name: `BCHG D${src},D${dst}`,
            cycles: 8,
            asm: `BCHG D${src},D${dst}`,
            description: 'Change bit register with register',
            pc: pc,
            bitNum: bitNum,
            oldValue: oldValue,
            newValue: this.registers.d[dst]
        };
    }

    // Multiply/Divide implementations
    op_muls_w_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        
        // Sign extend to 16-bit signed values
        const srcSigned = (srcVal & 0x8000) ? (srcVal | 0xFFFF0000) : srcVal;
        const dstSigned = (dstVal & 0x8000) ? (dstVal | 0xFFFF0000) : dstVal;
        
        const result = (srcSigned * dstSigned) >>> 0;
        const oldValue = this.registers.d[dst];

        this.registers.d[dst] = result;
        this.setFlagsLogic32(result);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MULS.W D${src},D${dst}            ; Signed multiply word`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (${dstSigned} * ${srcSigned} = ${result})`);

        this.cycles += 70; // Average cycle count for multiply
        return {
            name: `MULS.W D${src},D${dst}`,
            cycles: 70,
            asm: `MULS.W D${src},D${dst}`,
            description: 'Signed multiply word',
            pc: pc,
            oldValue: oldValue,
            newValue: result
        };
    }

    op_muls_w_imm_d(dst) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord();
        const dstVal = this.registers.d[dst] & 0xFFFF;
        
        const srcSigned = (immediate & 0x8000) ? (immediate | 0xFFFF0000) : immediate;
        const dstSigned = (dstVal & 0x8000) ? (dstVal | 0xFFFF0000) : dstVal;
        
        const result = (srcSigned * dstSigned) >>> 0;
        const oldValue = this.registers.d[dst];

        this.registers.d[dst] = result;
        this.setFlagsLogic32(result);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MULS.W #$${immediate.toString(16).padStart(4, '0')},D${dst}       ; Signed multiply word immediate`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (${dstSigned} * ${srcSigned} = ${result})`);

        this.cycles += 70;
        return {
            name: `MULS.W #$${immediate.toString(16).padStart(4, '0')},D${dst}`,
            cycles: 70,
            asm: `MULS.W #$${immediate.toString(16).padStart(4, '0')},D${dst}`,
            description: 'Signed multiply word immediate',
            pc: pc,
            immediate: immediate,
            oldValue: oldValue,
            newValue: result
        };
    }

    op_mulu_w_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = (srcVal * dstVal) >>> 0;
        const oldValue = this.registers.d[dst];

        this.registers.d[dst] = result;
        this.setFlagsLogic32(result);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MULU.W D${src},D${dst}            ; Unsigned multiply word`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (${dstVal} * ${srcVal} = ${result})`);

        this.cycles += 70;
        return {
            name: `MULU.W D${src},D${dst}`,
            cycles: 70,
            asm: `MULU.W D${src},D${dst}`,
            description: 'Unsigned multiply word',
            pc: pc,
            oldValue: oldValue,
            newValue: result
        };
    }

    op_mulu_w_imm_d(dst) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord();
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = (immediate * dstVal) >>> 0;
        const oldValue = this.registers.d[dst];

        this.registers.d[dst] = result;
        this.setFlagsLogic32(result);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MULU.W #$${immediate.toString(16).padStart(4, '0')},D${dst}       ; Unsigned multiply word immediate`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (${dstVal} * ${immediate} = ${result})`);

        this.cycles += 70;
        return {
            name: `MULU.W #$${immediate.toString(16).padStart(4, '0')},D${dst}`,
            cycles: 70,
            asm: `MULU.W #$${immediate.toString(16).padStart(4, '0')},D${dst}`,
            description: 'Unsigned multiply word immediate',
            pc: pc,
            immediate: immediate,
            oldValue: oldValue,
            newValue: result
        };
    }

    op_divs_w_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const divisor = this.registers.d[src] & 0xFFFF;
        const dividend = this.registers.d[dst] >>> 0;
        const oldValue = this.registers.d[dst];

        if (divisor === 0) {
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DIVS.W D${src},D${dst}            ; DIVIDE BY ZERO!`);
            // Generate divide by zero exception
            this.exception_divide_by_zero();
            return {
                name: `DIVS.W D${src},D${dst}`,
                cycles: 4,
                asm: `DIVS.W D${src},D${dst}`,
                description: 'Signed divide word (DIVIDE BY ZERO)',
                pc: pc,
                exception: true
            };
        }

        const divisorSigned = (divisor & 0x8000) ? (divisor | 0xFFFF0000) : divisor;
        const dividendSigned = (dividend & 0x80000000) ? dividend | 0x00000000 : dividend;
        
        const quotient = Math.trunc(dividendSigned / divisorSigned);
        const remainder = dividendSigned % divisorSigned;

        // Check for overflow
        if (quotient > 32767 || quotient < -32768) {
            this.flag_v = 1;
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DIVS.W D${src},D${dst}            ; OVERFLOW!`);
            this.cycles += 158;
            return {
                name: `DIVS.W D${src},D${dst}`,
                cycles: 158,
                asm: `DIVS.W D${src},D${dst}`,
                description: 'Signed divide word (OVERFLOW)',
                pc: pc,
                overflow: true
            };
        }

        const result = ((remainder & 0xFFFF) << 16) | (quotient & 0xFFFF);
        this.registers.d[dst] = result >>> 0;
        this.setFlagsLogic16(quotient);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DIVS.W D${src},D${dst}            ; Signed divide word`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (${dividendSigned} / ${divisorSigned} = Q:${quotient}, R:${remainder})`);

        this.cycles += 158;
        return {
            name: `DIVS.W D${src},D${dst}`,
            cycles: 158,
            asm: `DIVS.W D${src},D${dst}`,
            description: 'Signed divide word',
            pc: pc,
            oldValue: oldValue,
            newValue: result
        };
    }

    op_divs_w_imm_d(dst) {
        const pc = this.registers.pc - 2;
        const divisor = this.fetchWord();
        const dividend = this.registers.d[dst] >>> 0;
        const oldValue = this.registers.d[dst];

        if (divisor === 0) {
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DIVS.W #$${divisor.toString(16).padStart(4, '0')},D${dst}       ; DIVIDE BY ZERO!`);
            this.exception_divide_by_zero();
            return {
                name: `DIVS.W #$${divisor.toString(16).padStart(4, '0')},D${dst}`,
                cycles: 4,
                asm: `DIVS.W #$${divisor.toString(16).padStart(4, '0')},D${dst}`,
                description: 'Signed divide word immediate (DIVIDE BY ZERO)',
                pc: pc,
                immediate: divisor,
                exception: true
            };
        }

        const divisorSigned = (divisor & 0x8000) ? (divisor | 0xFFFF0000) : divisor;
        const dividendSigned = (dividend & 0x80000000) ? dividend | 0x00000000 : dividend;
        
        const quotient = Math.trunc(dividendSigned / divisorSigned);
        const remainder = dividendSigned % divisorSigned;

        if (quotient > 32767 || quotient < -32768) {
            this.flag_v = 1;
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DIVS.W #$${divisor.toString(16).padStart(4, '0')},D${dst}       ; OVERFLOW!`);
            this.cycles += 158;
            return {
                name: `DIVS.W #$${divisor.toString(16).padStart(4, '0')},D${dst}`,
                cycles: 158,
                asm: `DIVS.W #$${divisor.toString(16).padStart(4, '0')},D${dst}`,
                description: 'Signed divide word immediate (OVERFLOW)',
                pc: pc,
                immediate: divisor,
                overflow: true
            };
        }

        const result = ((remainder & 0xFFFF) << 16) | (quotient & 0xFFFF);
        this.registers.d[dst] = result >>> 0;
        this.setFlagsLogic16(quotient);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DIVS.W #$${divisor.toString(16).padStart(4, '0')},D${dst}       ; Signed divide word immediate`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (${dividendSigned} / ${divisorSigned} = Q:${quotient}, R:${remainder})`);

        this.cycles += 158;
        return {
            name: `DIVS.W #$${divisor.toString(16).padStart(4, '0')},D${dst}`,
            cycles: 158,
            asm: `DIVS.W #$${divisor.toString(16).padStart(4, '0')},D${dst}`,
            description: 'Signed divide word immediate',
            pc: pc,
            immediate: divisor,
            oldValue: oldValue,
            newValue: result
        };
    }

    op_divu_w_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const divisor = this.registers.d[src] & 0xFFFF;
        const dividend = this.registers.d[dst] >>> 0;
        const oldValue = this.registers.d[dst];

        if (divisor === 0) {
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DIVU.W D${src},D${dst}            ; DIVIDE BY ZERO!`);
            this.exception_divide_by_zero();
            return {
                name: `DIVU.W D${src},D${dst}`,
                cycles: 4,
                asm: `DIVU.W D${src},D${dst}`,
                description: 'Unsigned divide word (DIVIDE BY ZERO)',
                pc: pc,
                exception: true
            };
        }

        const quotient = Math.trunc(dividend / divisor);
        const remainder = dividend % divisor;

        if (quotient > 65535) {
            this.flag_v = 1;
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DIVU.W D${src},D${dst}            ; OVERFLOW!`);
            this.cycles += 140;
            return {
                name: `DIVU.W D${src},D${dst}`,
                cycles: 140,
                asm: `DIVU.W D${src},D${dst}`,
                description: 'Unsigned divide word (OVERFLOW)',
                pc: pc,
                overflow: true
            };
        }

        const result = ((remainder & 0xFFFF) << 16) | (quotient & 0xFFFF);
        this.registers.d[dst] = result >>> 0;
        this.setFlagsLogic16(quotient);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DIVU.W D${src},D${dst}            ; Unsigned divide word`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (${dividend} / ${divisor} = Q:${quotient}, R:${remainder})`);

        this.cycles += 140;
        return {
            name: `DIVU.W D${src},D${dst}`,
            cycles: 140,
            asm: `DIVU.W D${src},D${dst}`,
            description: 'Unsigned divide word',
            pc: pc,
            oldValue: oldValue,
            newValue: result
        };
    }

    op_divu_w_imm_d(dst) {
        const pc = this.registers.pc - 2;
        const divisor = this.fetchWord();
        const dividend = this.registers.d[dst] >>> 0;
        const oldValue = this.registers.d[dst];

        if (divisor === 0) {
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DIVU.W #$${divisor.toString(16).padStart(4, '0')},D${dst}       ; DIVIDE BY ZERO!`);
            this.exception_divide_by_zero();
            return {
                name: `DIVU.W #$${divisor.toString(16).padStart(4, '0')},D${dst}`,
                cycles: 4,
                asm: `DIVU.W #$${divisor.toString(16).padStart(4, '0')},D${dst}`,
                description: 'Unsigned divide word immediate (DIVIDE BY ZERO)',
                pc: pc,
                immediate: divisor,
                exception: true
            };
        }

        const quotient = Math.trunc(dividend / divisor);
        const remainder = dividend % divisor;

        if (quotient > 65535) {
            this.flag_v = 1;
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DIVU.W #$${divisor.toString(16).padStart(4, '0')},D${dst}       ; OVERFLOW!`);
            this.cycles += 140;
            return {
                name: `DIVU.W #$${divisor.toString(16).padStart(4, '0')},D${dst}`,
                cycles: 140,
                asm: `DIVU.W #$${divisor.toString(16).padStart(4, '0')},D${dst}`,
                description: 'Unsigned divide word immediate (OVERFLOW)',
                pc: pc,
                immediate: divisor,
                overflow: true
            };
        }

        const result = ((remainder & 0xFFFF) << 16) | (quotient & 0xFFFF);
        this.registers.d[dst] = result >>> 0;
        this.setFlagsLogic16(quotient);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DIVU.W #$${divisor.toString(16).padStart(4, '0')},D${dst}       ; Unsigned divide word immediate`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (${dividend} / ${divisor} = Q:${quotient}, R:${remainder})`);

        this.cycles += 140;
        return {
            name: `DIVU.W #$${divisor.toString(16).padStart(4, '0')},D${dst}`,
            cycles: 140,
            asm: `DIVU.W #$${divisor.toString(16).padStart(4, '0')},D${dst}`,
            description: 'Unsigned divide word immediate',
            pc: pc,
            immediate: divisor,
            oldValue: oldValue,
            newValue: result
        };
    }

    // Exchange implementations
    op_exg_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const srcValue = this.registers.d[src];
        const dstValue = this.registers.d[dst];

        this.registers.d[src] = dstValue;
        this.registers.d[dst] = srcValue;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: EXG D${src},D${dst}               ; Exchange data registers`);
        console.log(`       → D${src}: 0x${srcValue.toString(16).padStart(8, '0')} ↔ D${dst}: 0x${dstValue.toString(16).padStart(8, '0')}`);

        this.cycles += 6;
        return {
            name: `EXG D${src},D${dst}`,
            cycles: 6,
            asm: `EXG D${src},D${dst}`,
            description: 'Exchange data registers',
            pc: pc
        };
    }

    op_exg_a_a(src, dst) {
        const pc = this.registers.pc - 2;
        const srcValue = this.registers.a[src];
        const dstValue = this.registers.a[dst];

        this.registers.a[src] = dstValue;
        this.registers.a[dst] = srcValue;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: EXG A${src},A${dst}               ; Exchange address registers`);
        console.log(`       → A${src}: 0x${srcValue.toString(16).padStart(8, '0')} ↔ A${dst}: 0x${dstValue.toString(16).padStart(8, '0')}`);

        this.cycles += 6;
        return {
            name: `EXG A${src},A${dst}`,
            cycles: 6,
            asm: `EXG A${src},A${dst}`,
            description: 'Exchange address registers',
            pc: pc
        };
    }

    op_exg_d_a(src, dst) {
        const pc = this.registers.pc - 2;
        const srcValue = this.registers.d[src];
        const dstValue = this.registers.a[dst];

        this.registers.d[src] = dstValue;
        this.registers.a[dst] = srcValue;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: EXG D${src},A${dst}               ; Exchange data and address registers`);
        console.log(`       → D${src}: 0x${srcValue.toString(16).padStart(8, '0')} ↔ A${dst}: 0x${dstValue.toString(16).padStart(8, '0')}`);

        this.cycles += 6;
        return {
            name: `EXG D${src},A${dst}`,
            cycles: 6,
            asm: `EXG D${src},A${dst}`,
            description: 'Exchange data and address registers',
            pc: pc
        };
    }

    // SWAP implementation
    op_swap(reg) {
        const pc = this.registers.pc - 2;
        const oldValue = this.registers.d[reg];
        const lowWord = oldValue & 0xFFFF;
        const highWord = (oldValue >>> 16) & 0xFFFF;
        const result = (lowWord << 16) | highWord;

        this.registers.d[reg] = result >>> 0;
        this.setFlagsLogic32(result);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: SWAP D${reg}                 ; Swap register halves`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (swapped words)`);

        this.cycles += 4;
        return {
            name: `SWAP D${reg}`,
            cycles: 4,
            asm: `SWAP D${reg}`,
            description: 'Swap register halves',
            pc: pc,
            oldValue: oldValue,
            newValue: result
        };
    }
}

module.exports = HighPriorityOpcodes;