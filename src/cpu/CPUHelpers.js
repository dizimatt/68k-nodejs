// src/cpu/CPUHelpers.js - CPU Helper Functions

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
    
    setFlagsSub16(dst, src, result) {
        this.flag_z = (result & 0xFFFF) === 0 ? 1 : 0;
        this.flag_n = (result & 0x8000) !== 0 ? 1 : 0;
        this.flag_c = result < 0 ? 1 : 0;
        this.flag_v = ((dst ^ src) & (dst ^ result) & 0x8000) !== 0 ? 1 : 0;
        this.flag_x = this.flag_c;
    },
    
    setFlagsLogic16(result) {
        this.flag_z = (result & 0xFFFF) === 0 ? 1 : 0;
        this.flag_n = (result & 0x8000) !== 0 ? 1 : 0;
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