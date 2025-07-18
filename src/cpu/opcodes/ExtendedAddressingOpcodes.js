/**
 * Extended Addressing Opcodes
 * Implements missing addressing modes and memory-to-memory operations for the 68k CPU
 * Based on SAE (Musashi) open-source project
 */

class ExtendedAddressingOpcodes {
    constructor(cpu) {
        this.cpu = cpu;
    }

    setup(opcodeTable) {
        const cpu = this.cpu;

        // MOVE.B EA,EA - Memory to memory byte transfers (avoiding register conflicts)
        for (let srcMode = 2; srcMode < 8; srcMode++) { // Skip Dn direct mode
            for (let srcReg = 0; srcReg < 8; srcReg++) {
                for (let dstMode = 2; dstMode < 8; dstMode++) { // Skip Dn direct mode
                    for (let dstReg = 0; dstReg < 8; dstReg++) {
                        const opcode = 0x1000 | (dstMode << 6) | (dstReg << 9) | (srcMode << 3) | srcReg;
                        opcodeTable[opcode] = () => this.op_move_b_ea_ea.call(cpu, srcMode, srcReg, dstMode, dstReg);
                    }
                }
            }
        }

        // MOVE.W EA,EA - Memory to memory word transfers (extended modes)
        for (let srcMode = 2; srcMode < 8; srcMode++) {
            for (let srcReg = 0; srcReg < 8; srcReg++) {
                for (let dstMode = 2; dstMode < 8; dstMode++) {
                    for (let dstReg = 0; dstReg < 8; dstReg++) {
                        const opcode = 0x3000 | (dstMode << 6) | (dstReg << 9) | (srcMode << 3) | srcReg;
                        opcodeTable[opcode] = () => this.op_move_w_ea_ea.call(cpu, srcMode, srcReg, dstMode, dstReg);
                    }
                }
            }
        }

        // MOVE.L EA,EA - Memory to memory long transfers (extended modes)
        for (let srcMode = 2; srcMode < 8; srcMode++) {
            for (let srcReg = 0; srcReg < 8; srcReg++) {
                for (let dstMode = 2; dstMode < 8; dstMode++) {
                    for (let dstReg = 0; dstReg < 8; dstReg++) {
                        const opcode = 0x2000 | (dstMode << 6) | (dstReg << 9) | (srcMode << 3) | srcReg;
                        opcodeTable[opcode] = () => this.op_move_l_ea_ea.call(cpu, srcMode, srcReg, dstMode, dstReg);
                    }
                }
            }
        }

        // MOVE with absolute addressing to memory
        for (let srcReg = 0; srcReg < 8; srcReg++) {
            // MOVE.W Dn,abs.W
            const opcodeW = 0x31C0 | (srcReg << 9);
            opcodeTable[opcodeW] = () => this.op_move_w_d_abs_w.call(cpu, srcReg);
            
            // MOVE.L Dn,abs.L - REMOVED: This conflicts with MoveOpcodes.js
            // The correct implementation is in MoveOpcodes.js with pattern 0x23C0 | reg
            // const opcodeL = 0x21C0 | (srcReg << 9);
            // opcodeTable[opcodeL] = () => this.op_move_l_d_abs_l.call(cpu, srcReg);
        }

        // MOVE with PC-relative addressing
        for (let dstReg = 0; dstReg < 8; dstReg++) {
            // MOVE.W d16(PC),Dn
            const opcodeW = 0x303A | (dstReg << 9);
            opcodeTable[opcodeW] = () => this.op_move_w_pc_rel_d.call(cpu, dstReg);
            
            // MOVE.L d16(PC),Dn
            const opcodeL = 0x203A | (dstReg << 9);
            opcodeTable[opcodeL] = () => this.op_move_l_pc_rel_d.call(cpu, dstReg);
        }
    }

    // Memory-to-memory transfer implementations
    op_move_b_ea_ea(srcMode, srcReg, dstMode, dstReg) {
        const pc = this.registers.pc - 2;
        const srcEA = this.getEffectiveAddress(srcMode, srcReg, 1);
        const dstEA = this.getEffectiveAddress(dstMode, dstReg, 1);
        const value = this.readMemory(srcEA, 1);
        
        this.writeMemory(dstEA, value, 1);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE.B ${this.formatEA(srcMode, srcReg)},${this.formatEA(dstMode, dstReg)} ; Move byte`);
        
        return {
            name: `MOVE.B ${this.formatEA(srcMode, srcReg)},${this.formatEA(dstMode, dstReg)}`,
            cycles: 8,
            asm: `MOVE.B ${this.formatEA(srcMode, srcReg)},${this.formatEA(dstMode, dstReg)}`,
            description: 'Move byte from memory to memory'
        };
    }

    op_move_w_ea_ea(srcMode, srcReg, dstMode, dstReg) {
        const pc = this.registers.pc - 2;
        const srcEA = this.getEffectiveAddress(srcMode, srcReg, 2);
        const dstEA = this.getEffectiveAddress(dstMode, dstReg, 2);
        const value = this.readMemory(srcEA, 2);
        
        this.writeMemory(dstEA, value, 2);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE.W ${this.formatEA(srcMode, srcReg)},${this.formatEA(dstMode, dstReg)} ; Move word`);
        
        return {
            name: `MOVE.W ${this.formatEA(srcMode, srcReg)},${this.formatEA(dstMode, dstReg)}`,
            cycles: 8,
            asm: `MOVE.W ${this.formatEA(srcMode, srcReg)},${this.formatEA(dstMode, dstReg)}`,
            description: 'Move word from memory to memory'
        };
    }

    op_move_l_ea_ea(srcMode, srcReg, dstMode, dstReg) {
        const pc = this.registers.pc - 2;
        const srcEA = this.getEffectiveAddress(srcMode, srcReg, 4);
        const dstEA = this.getEffectiveAddress(dstMode, dstReg, 4);
        const value = this.readMemory(srcEA, 4);
        
        this.writeMemory(dstEA, value, 4);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE.L ${this.formatEA(srcMode, srcReg)},${this.formatEA(dstMode, dstReg)} ; Move long`);
        
        return {
            name: `MOVE.L ${this.formatEA(srcMode, srcReg)},${this.formatEA(dstMode, dstReg)}`,
            cycles: 12,
            asm: `MOVE.L ${this.formatEA(srcMode, srcReg)},${this.formatEA(dstMode, dstReg)}`,
            description: 'Move long from memory to memory'
        };
    }

    op_move_w_d_abs_w(srcReg) {
        const pc = this.registers.pc - 2;
        const address = this.fetchWord();
        const value = this.registers.d[srcReg] & 0xFFFF;
        
        this.memory.writeWord(address, value);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE.W D${srcReg},$${address.toString(16).padStart(4, '0')} ; Move word to absolute`);
        
        return {
            name: `MOVE.W D${srcReg},$${address.toString(16)}`,
            cycles: 12,
            asm: `MOVE.W D${srcReg},$${address.toString(16).padStart(4, '0')}`,
            description: 'Move word to absolute address'
        };
    }

    op_move_l_d_abs_l(srcReg) {
        const pc = this.registers.pc - 2;
        const address = this.fetchLong();
        const value = this.registers.d[srcReg];
        
        this.memory.writeLong(address, value);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE.L D${srcReg},$${address.toString(16).padStart(8, '0')} ; Move long to absolute`);
        
        return {
            name: `MOVE.L D${srcReg},$${address.toString(16)}`,
            cycles: 20,
            asm: `MOVE.L D${srcReg},$${address.toString(16).padStart(8, '0')}`,
            description: 'Move long to absolute address'
        };
    }

    op_move_w_pc_rel_d(dstReg) {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        const address = (pc + 2 + signedDisp) >>> 0;
        const value = this.memory.readWord(address);
        
        this.registers.d[dstReg] = (this.registers.d[dstReg] & 0xFFFF0000) | value;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE.W $${address.toString(16).padStart(4, '0')}(PC),D${dstReg} ; Move word from PC-relative`);
        
        return {
            name: `MOVE.W (${signedDisp},PC),D${dstReg}`,
            cycles: 12,
            asm: `MOVE.W (${signedDisp},PC),D${dstReg}`,
            description: 'Move word from PC-relative address'
        };
    }

    op_move_l_pc_rel_d(dstReg) {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        const address = (pc + 2 + signedDisp) >>> 0;
        const value = this.memory.readLong(address);
        
        this.registers.d[dstReg] = value;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE.L $${address.toString(16).padStart(8, '0')}(PC),D${dstReg} ; Move long from PC-relative`);
        
        return {
            name: `MOVE.L (${signedDisp},PC),D${dstReg}`,
            cycles: 16,
            asm: `MOVE.L (${signedDisp},PC),D${dstReg}`,
            description: 'Move long from PC-relative address'
        };
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

    formatEA(mode, reg) {
        switch (mode) {
            case 0: return `D${reg}`;           // Dn
            case 1: return `A${reg}`;           // An
            case 2: return `(A${reg})`;         // (An)
            case 3: return `(A${reg})+`;        // (An)+
            case 4: return `-(A${reg})`;        // -(An)
            case 5: return `d16(A${reg})`;      // d16(An)
            case 6: return `d8(A${reg},Xn)`;    // d8(An,Xn)
            case 7: {
                switch (reg) {
                    case 0: return 'abs.W';     // absolute word
                    case 1: return 'abs.L';     // absolute long
                    case 2: return 'd16(PC)';   // PC-relative
                    case 3: return 'd8(PC,Xn)'; // PC-indexed
                    case 4: return '#imm';      // immediate
                    default: return `abs.${reg}`;
                }
            }
            default: return `mode${mode}.${reg}`;
        }
    }
}

module.exports = ExtendedAddressingOpcodes;