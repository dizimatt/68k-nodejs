// UPDATED: src/MemoryManager.js - Add resetWorkingState method

class MemoryManager {
    constructor() {
        this.chipRam = new Uint8Array(2 * 1024 * 1024); // 2MB chip RAM
        this.fastRam = new Uint8Array(8 * 1024 * 1024); // 8MB fast RAM
        this.customRegisters = new Uint16Array(0x200); // Custom chip registers
        this.hunks = [];
    }
    
    loadHunks(hunks) {
        this.hunks = hunks;
        
        // Copy hunk data to appropriate memory locations
        for (const hunk of hunks) {
            this.writeBytes(hunk.loadAddress, hunk.data);
        }
        
        console.log(`📁 [MEMORY] Loaded ${hunks.length} hunks into memory`);
    }
    
    readByte(address) {
        if (address >= 0xDFF000 && address < 0xDFF200) {
            // Custom chip register
            const reg = (address - 0xDFF000) >> 1;
            return this.customRegisters[reg] & 0xFF;
        }
        
        if (address < this.chipRam.length) {
            return this.chipRam[address];
        }
        
        if (address >= 0x400000 && address < 0x400000 + this.fastRam.length) {
            return this.fastRam[address - 0x400000];
        }
        
        return 0;
    }
    
    writeByte(address, value) {
        if (address >= 0xDFF000 && address < 0xDFF200) {
            // Custom chip register
            const reg = (address - 0xDFF000) >> 1;
            this.customRegisters[reg] = (this.customRegisters[reg] & 0xFF00) | (value & 0xFF);
            return;
        }
        
        if (address < this.chipRam.length) {
            this.chipRam[address] = value;
            return;
        }
        
        if (address >= 0x400000 && address < 0x400000 + this.fastRam.length) {
            this.fastRam[address - 0x400000] = value;
            return;
        }
    }
    
    readWord(address) {
        return (this.readByte(address) << 8) | this.readByte(address + 1);
    }
    
    writeWord(address, value) {
        this.writeByte(address, (value >> 8) & 0xFF);
        this.writeByte(address + 1, value & 0xFF);
    }
    
    writeBytes(address, data) {
        for (let i = 0; i < data.length; i++) {
            this.writeByte(address + i, data[i]);
        }
    }
    
    getChipRamSample() {
        // Return first 1024 bytes for debugging
        return Array.from(this.chipRam.slice(0, 1024));
    }
    
    getCustomRegisters() {
        return Array.from(this.customRegisters.slice(0, 32));
    }
    
    // NEW METHOD: Reset working state but keep loaded hunks
    resetWorkingState() {
        console.log('🧹 [MEMORY] Resetting working state (preserving loaded hunks)...');
        
        // Clear all memory
        this.chipRam.fill(0);
        this.fastRam.fill(0);
        this.customRegisters.fill(0);
        
        // DON'T clear hunks array - that's the key difference from reset()
        // this.hunks = [];  ← DON'T do this!
        
        console.log(`✅ [MEMORY] Working state cleared, ${this.hunks.length} hunks preserved`);
    }
    
    // EXISTING METHOD: Complete reset (clears everything including loaded executable)
    reset() {
        console.log('🧹 [MEMORY] Complete reset - clearing all data including loaded executable...');
        
        this.chipRam.fill(0);
        this.fastRam.fill(0);
        this.customRegisters.fill(0);
        this.hunks = [];  // This clears the loaded executable
        
        console.log('✅ [MEMORY] Complete reset finished');
    }
    
    // OPTIONAL: Add method to check if executable is loaded
    hasExecutableLoaded() {
        return this.hunks.length > 0;
    }
    
    // OPTIONAL: Get loaded executable info
    getLoadedExecutableInfo() {
        if (this.hunks.length === 0) {
            return { loaded: false };
        }
        
        return {
            loaded: true,
            hunkCount: this.hunks.length,
            totalSize: this.hunks.reduce((sum, hunk) => sum + hunk.data.length, 0),
            entryPoint: this.hunks[0]?.loadAddress || 0,
            hunks: this.hunks.map(hunk => ({
                type: hunk.type,
                address: hunk.loadAddress,
                size: hunk.data.length
            }))
        };
    }
}

module.exports = { MemoryManager };