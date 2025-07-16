// src/cpu/CPUHelpers.js - CPU Helper Functions
//
// setFlagsCmp8 implementation based on SAE (Scripted Amiga Emulator)
// SAE Copyright (C) 2012 Rupert Hausberger
// https://github.com/naTmeg/ScriptedAmigaEmulator
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.

const CPUHelpers = {
    // Memory access helpers
    fetchWord() {
        const word = this.memory.readWord(this.registers.pc);
        this.registers.pc = (this.registers.pc + 2) >>> 0;
        return word;
    },
    
    fetchLong() {
        const high = this.fetchWord();
        const low = this.fetchWord();
        return ((high << 16) | low) >>> 0;
    },
    
    // Methods for instruction operand fetching
    getNextWord() {
        const word = this.memoryManager.read16(this.registers.pc);
        this.registers.pc = (this.registers.pc + 2) >>> 0;
        return word;
    },
    
    getNextLong() {
        const high = this.getNextWord();
        const low = this.getNextWord();
        return ((high << 16) | low) >>> 0;
    },
    
    // Stack operations
    pushWord(value) {
        this.registers.a[7] = (this.registers.a[7] - 2) >>> 0;
        this.memory.writeWord(this.registers.a[7], value & 0xFFFF);
    },
    
    pushLong(value) {
        this.pushWord((value >>> 16) & 0xFFFF);
        this.pushWord(value & 0xFFFF);
    },
    
    pullWord() {
        const value = this.memory.readWord(this.registers.a[7]);
        this.registers.a[7] = (this.registers.a[7] + 2) >>> 0;
        return value;
    },
    
    pullLong() {
        const low = this.pullWord();
        const high = this.pullWord();
        return ((high << 16) | low) >>> 0;
    },
    
    // Flag setting helpers
    setFlags8(value) {
        this.flag_z = (value & 0xFF) === 0 ? 1 : 0;
        this.flag_n = (value & 0x80) !== 0 ? 1 : 0;
    },
    
    setFlags16(value) {
        this.flag_z = (value & 0xFFFF) === 0 ? 1 : 0;
        this.flag_n = (value & 0x8000) !== 0 ? 1 : 0;
    },
    
    setFlags32(value) {
        this.flag_z = value === 0 ? 1 : 0;
        this.flag_n = (value & 0x80000000) !== 0 ? 1 : 0;
    },
    
    setFlagsAdd16(src, dst, result) {
        this.flag_z = (result & 0xFFFF) === 0 ? 1 : 0;
        this.flag_n = (result & 0x8000) !== 0 ? 1 : 0;
        this.flag_c = result > 0xFFFF ? 1 : 0;
        this.flag_v = ((src ^ result) & (dst ^ result) & 0x8000) !== 0 ? 1 : 0;
        this.flag_x = this.flag_c;
    },
    
    setFlagsAdd32(src, dst, result) {
        this.flag_z = (result >>> 0) === 0 ? 1 : 0;
        this.flag_n = (result & 0x80000000) !== 0 ? 1 : 0;
        this.flag_c = result > 0xFFFFFFFF ? 1 : 0;
        this.flag_v = ((src ^ result) & (dst ^ result) & 0x80000000) !== 0 ? 1 : 0;
        this.flag_x = this.flag_c;
    },
    
    setFlagsSub16(dst, src, result) {
        this.flag_z = (result & 0xFFFF) === 0 ? 1 : 0;
        this.flag_n = (result & 0x8000) !== 0 ? 1 : 0;
        this.flag_c = result < 0 ? 1 : 0;
        this.flag_v = ((dst ^ src) & (dst ^ result) & 0x8000) !== 0 ? 1 : 0;
        this.flag_x = this.flag_c;
    },
    
    setFlagsSub32(dst, src, result) {
        this.flag_z = (result >>> 0) === 0 ? 1 : 0;
        this.flag_n = (result & 0x80000000) !== 0 ? 1 : 0;
        this.flag_c = result < 0 ? 1 : 0;
        this.flag_v = ((dst ^ src) & (dst ^ result) & 0x80000000) !== 0 ? 1 : 0;
        this.flag_x = this.flag_c;
    },
    
    // CMP flag setting based on SAE emulator implementation
    setFlagsCmp8(src, dst, result) {
        const srcNeg = (src & 0x80) !== 0;
        const dstNeg = (dst & 0x80) !== 0;
        const resNeg = (result & 0x80) !== 0;
        
        this.flag_v = (!srcNeg && dstNeg && !resNeg) || (srcNeg && !dstNeg && resNeg) ? 1 : 0;
        this.flag_c = (srcNeg && !dstNeg) || (resNeg && !dstNeg) || (srcNeg && resNeg) ? 1 : 0;
        this.flag_n = resNeg ? 1 : 0;
        this.flag_z = (result & 0xFF) === 0 ? 1 : 0;
    },
    
    setFlagsLogic16(result) {
        this.flag_z = (result & 0xFFFF) === 0 ? 1 : 0;
        this.flag_n = (result & 0x8000) !== 0 ? 1 : 0;
        this.flag_c = 0;
        this.flag_v = 0;
    },
    
    setFlagsLogic8(result) {
        this.flag_z = (result & 0xFF) === 0 ? 1 : 0;
        this.flag_n = (result & 0x80) !== 0 ? 1 : 0;
        this.flag_c = 0;
        this.flag_v = 0;
    },
    
    // Condition code testing
    testCondition(condition) {
        switch (condition) {
            case 0x0: return true;                              // BRA - Always
            case 0x1: return false;                             // BSR - Never (handled separately)
            case 0x2: return !this.flag_c && !this.flag_z;     // BHI - Higher
            case 0x3: return this.flag_c || this.flag_z;       // BLS - Lower or Same
            case 0x4: return !this.flag_c;                     // BCC - Carry Clear
            case 0x5: return this.flag_c;                      // BCS - Carry Set
            case 0x6: return !this.flag_z;                     // BNE - Not Equal
            case 0x7: return this.flag_z;                      // BEQ - Equal
            case 0x8: return !this.flag_v;                     // BVC - Overflow Clear
            case 0x9: return this.flag_v;                      // BVS - Overflow Set
            case 0xA: return !this.flag_n;                     // BPL - Plus
            case 0xB: return this.flag_n;                      // BMI - Minus
            case 0xC: return (this.flag_n && this.flag_v) || (!this.flag_n && !this.flag_v); // BGE
            case 0xD: return (this.flag_n && !this.flag_v) || (!this.flag_n && this.flag_v); // BLT
            case 0xE: return ((this.flag_n && this.flag_v) || (!this.flag_n && !this.flag_v)) && !this.flag_z; // BGT
            case 0xF: return this.flag_z || ((this.flag_n && !this.flag_v) || (!this.flag_n && this.flag_v)); // BLE
            default: return false;
        }
    },
    
    getConditionName(condition) {
        const names = ['RA', 'SR', 'HI', 'LS', 'CC', 'CS', 'NE', 'EQ', 'VC', 'VS', 'PL', 'MI', 'GE', 'LT', 'GT', 'LE'];
        return names[condition] || 'XX';
    },
    
    // Status register management
    updateFlagsFromSR() {
        this.flag_c = (this.registers.sr & 0x01) ? 1 : 0;
        this.flag_v = (this.registers.sr & 0x02) ? 1 : 0;
        this.flag_z = (this.registers.sr & 0x04) ? 1 : 0;
        this.flag_n = (this.registers.sr & 0x08) ? 1 : 0;
        this.flag_x = (this.registers.sr & 0x10) ? 1 : 0;
        this.flag_s = (this.registers.sr & 0x2000) ? 1 : 0;
    },
    
    updateSRFromFlags() {
        this.registers.sr = (this.registers.sr & 0xFFE0) |
                           (this.flag_c ? 0x01 : 0) |
                           (this.flag_v ? 0x02 : 0) |
                           (this.flag_z ? 0x04 : 0) |
                           (this.flag_n ? 0x08 : 0) |
                           (this.flag_x ? 0x10 : 0) |
                           (this.flag_s ? 0x2000 : 0);
    },
    setFlagsAdd32(src, dst, result) {
        this.flag_z = result === 0 ? 1 : 0;
        this.flag_n = (result & 0x80000000) !== 0 ? 1 : 0;
        this.flag_c = result > 0xFFFFFFFF ? 1 : 0;
        this.flag_v = ((src ^ result) & (dst ^ result) & 0x80000000) !== 0 ? 1 : 0;
        this.flag_x = this.flag_c;
    },

    setFlagsSub32(dst, src, result) {
        this.flag_z = result === 0 ? 1 : 0;
        this.flag_n = (result & 0x80000000) !== 0 ? 1 : 0;
        this.flag_c = result < 0 ? 1 : 0;
        this.flag_v = ((dst ^ src) & (dst ^ result) & 0x80000000) !== 0 ? 1 : 0;
        this.flag_x = this.flag_c;
    },
    
    // Effective Address calculation
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
    },

    readMemory(address, size) {
        switch (size) {
            case 1: return this.memory.readByte(address);
            case 2: return this.memory.readWord(address);
            case 4: return this.memory.readLong(address);
            default: return 0;
        }
    },

    writeMemory(address, value, size) {
        switch (size) {
            case 1: this.memory.writeByte(address, value); break;
            case 2: this.memory.writeWord(address, value); break;
            case 4: this.memory.writeLong(address, value); break;
        }
    },

    calculateIndexedAddress(reg) {
        const extension = this.fetchWord();
        const displacement = (extension & 0x80) ? (extension | 0xFFFFFF00) : (extension & 0xFF);
        const indexReg = (extension >> 12) & 7;
        const indexType = (extension >> 15) & 1;
        const indexSize = (extension >> 11) & 1;
        
        let indexValue = indexType ? this.registers.a[indexReg] : this.registers.d[indexReg];
        if (!indexSize) indexValue = (indexValue & 0x8000) ? (indexValue | 0xFFFF0000) : (indexValue & 0xFFFF);
        
        return this.registers.a[reg] + displacement + indexValue;
    },

    calculatePCIndexedAddress() {
        const extension = this.fetchWord();
        const displacement = (extension & 0x80) ? (extension | 0xFFFFFF00) : (extension & 0xFF);
        const indexReg = (extension >> 12) & 7;
        const indexType = (extension >> 15) & 1;
        const indexSize = (extension >> 11) & 1;
        
        let indexValue = indexType ? this.registers.a[indexReg] : this.registers.d[indexReg];
        if (!indexSize) indexValue = (indexValue & 0x8000) ? (indexValue | 0xFFFF0000) : (indexValue & 0xFFFF);
        
        return this.registers.pc + displacement + indexValue;
    },

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
    },
    
    // Exception handling
    exception_privilege_violation() {
        console.log('🚨 [CPU] Privilege violation exception');
        this.running = false;
    }
};

// Export static helper functions that can access 'this' properly
CPUHelpers.fetchWord = function() {
    const word = this.memory.readWord(this.registers.pc);
    this.registers.pc = (this.registers.pc + 2) >>> 0;
    return word;
};

module.exports = { CPUHelpers };