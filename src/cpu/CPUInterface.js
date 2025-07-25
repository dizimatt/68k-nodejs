// src/cpu/CPUInterface.js - Public Interface Methods (Compatible with AmigaInterpreter)

const CPUInterface = {
    // Main interface methods
    initialize(programEntry) {
        this.registers.pc = programEntry >>> 0;
        this.registers.a[7] = 0x00200000; // Stack pointer
        this.registers.sr = 0x2700;       // Supervisor mode
        this.updateFlagsFromSR();
        this.cycles = 0;
        this.instructionCount = 0;
        this.running = true;
        this.initialized = true;
        
        console.log(`✅ [CPU] Pure JS CPU initialized at PC=0x${programEntry.toString(16)}`);
    },

    // *** NEW: Initialize CPU from ROM reset vectors for authentic emulation ***
    initializeFromROM(resetVectors) {
        console.log('🚀 [CPU] Initializing from ROM reset vectors (authentic mode)...');
        
        // Set registers from ROM reset vectors
        this.registers.pc = resetVectors.programCounter >>> 0;
        this.registers.a[7] = resetVectors.stackPointer >>> 0;  // ROM-provided stack
        this.registers.sr = 0x2700;  // Supervisor mode (required for ROM startup)
        
        // Update CPU flags from status register
        this.updateFlagsFromSR();
        
        // Reset statistics
        this.cycles = 0;
        this.instructionCount = 0;
        this.running = true;
        this.initialized = true;
        
        console.log(`✅ [CPU] ROM initialization complete`);
        console.log(`📍 [CPU] PC: 0x${this.registers.pc.toString(16)}`);
        console.log(`📍 [CPU] SP: 0x${this.registers.a[7].toString(16)}`);
        console.log(`🚀 [CPU] Ready to execute authentic Amiga ROM startup code`);
    },
    
    getStatistics() {
        return {
            totalInstructions: this.instructionCount,
            totalCycles: this.cycles,
            implementedOpcodes: this.implementedInstructions.size,
            implementedPercent: ((this.implementedInstructions.size / 65536) * 100).toFixed(2),
            instructionFrequency: Object.fromEntries(this.instructionStats),
            cpuType: 'Pure JavaScript 68000 (Musashi-Inspired)'
        };
    },
    
    // Interface compatibility methods
    isRunning() { 
        return this.running && this.initialized; 
    },
    
    isFinished() { 
        return !this.running; 
    },
    
    isInitialized() { 
        return this.initialized; 
    },
    
    getProgramCounter() { 
        return this.registers.pc; 
    },
    
    getRegisters() {
        return {
            d: Array.from(this.registers.d),
            a: Array.from(this.registers.a),
            pc: this.registers.pc,
            sr: this.registers.sr
        };
    },
    
    getFlags() {
        return {
            zero: this.flag_z !== 0,
            negative: this.flag_n !== 0,
            carry: this.flag_c !== 0,
            overflow: this.flag_v !== 0,
            extend: this.flag_x !== 0,
            supervisor: this.flag_s !== 0
        };
    },
    
    reset() {
        this.registers.d.fill(0);
        this.registers.a.fill(0);
        this.registers.pc = 0;
        this.registers.sr = 0x2700;
        this.updateFlagsFromSR();
        this.running = true;
        this.initialized = false;
        this.cycles = 0;
        this.instructionCount = 0;
        this.instructionStats.clear();
        
        console.log('✅ [CPU] Pure JS CPU reset complete');
    },
    
    resetExecution() {
        this.running = true;
        console.log('🔄 [CPU] Execution state reset - ready to run');
    },
    
    setProgramCounter(address) {
        this.initialize(address);
    }
};

module.exports = { CPUInterface };