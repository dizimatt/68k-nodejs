// UPDATED: src/AmigaInterpreter.js - Fix reset to keep executable loaded

const { HunkLoader } = require('./HunkLoader');
const { MemoryManager } = require('./MemoryManager');
const { MusashiInspiredCPU } = require('./MusashiInspiredCPU');
const { BlitterChip } = require('./BlitterChip');
const { CopperChip } = require('./CopperChip');
const { VirtualCanvas } = require('./VirtualCanvas');

class AmigaInterpreter {
    constructor() {
        this.cpu = null;
        this.memory = new MemoryManager();
        this.hunkLoader = new HunkLoader();
        this.customChips = {
            blitter: new BlitterChip(this.memory),
            copper: new CopperChip(this.memory)
        };
        this.canvas = new VirtualCanvas();
        this.loaded = false;
        this.running = false;
        this.loadedHunks = [];  // Store hunks separately so reset doesn't lose them
    }

    loadExecutable(buffer) {
        try {
            // Parse Amiga Hunk format
            const hunks = this.hunkLoader.loadHunks(buffer);
            
            // Store hunks for reset functionality
            this.loadedHunks = hunks;
            
            // Set up memory
            this.memory.loadHunks(hunks);
            
            // Initialize CPU
            this.cpu = new MusashiInspiredCPU(this.memory);            
            
            // Set program counter to first hunk
            if (hunks.length > 0) {
                this.cpu.setProgramCounter(hunks[0].loadAddress);
            }
            
            this.loaded = true;
            
            console.log('📁 [INTERPRETER] Executable loaded and ready');
            
            return {
                success: true,
                info: {
                    hunks: hunks.length,
                    totalSize: hunks.reduce((sum, hunk) => sum + hunk.data.length, 0),
                    entryPoint: hunks[0]?.loadAddress || 0
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    run() {
        if (!this.loaded) {
            throw new Error('No executable loaded');
        }

        // Check if CPU needs initialization
        if (!this.cpu.isInitialized()) {
            console.log('🔧 [INTERPRETER] CPU not initialized for run, initializing...');
            const entryPoint = this.loadedHunks.length > 0 ? this.loadedHunks[0].loadAddress : 0x400000;
            this.cpu.initialize(entryPoint);
        } else {
            console.log('🔄 [INTERPRETER] CPU already initialized, resetting execution state...');
            this.cpu.resetExecution();
        }

        this.running = true;
        
        console.log('🚀 [INTERPRETER] Starting execution run...');
        
        let steps = 0;
        const maxSteps = 1000;
        
        while (this.running && this.cpu.isRunning() && steps < maxSteps) {
            const result = this.cpu.step();
            
            if (result.finished || result.error) {
                console.log(`🏁 [INTERPRETER] Execution ended after ${steps + 1} steps: ${result.finished ? 'completed normally' : 'error occurred'}`);
                this.running = false;
                break;
            }
            
            if (!this.cpu.isRunning()) {
                console.log(`🏁 [INTERPRETER] CPU stopped running after ${steps + 1} steps`);
                this.running = false;
                break;
            }
            
            steps++;
            this.customChips.copper.update();
            this.customChips.blitter.update();
            this.canvas.update();
        }
        
        if (steps >= maxSteps) {
            console.log(`⏰ [INTERPRETER] Execution stopped after maximum ${maxSteps} steps`);
            this.running = false;
        }

        const finalStats = this.cpu.getStatistics();
        
        console.log(`📊 [INTERPRETER] Final execution summary:`);
        console.log(`   - Total steps: ${steps}`);
        console.log(`   - Instructions executed: ${finalStats.totalInstructions}`);
        console.log(`   - Implemented: ${finalStats.implementedCount} (${finalStats.implementedPercent}%)`);
        console.log(`   - CPU running: ${this.cpu.isRunning()}`);
        console.log(`   - Program finished: ${this.cpu.isFinished()}`);

        return {
            steps: steps,
            running: this.running && this.cpu.isRunning(),
            pc: this.cpu.getProgramCounter(),
            finished: this.cpu.isFinished() || !this.cpu.isRunning() || steps >= maxSteps,
            maxStepsReached: steps >= maxSteps,
            stats: finalStats
        };
    }
    
    step() {
        if (!this.loaded) {
            throw new Error('No executable loaded');
        }

        // Check if CPU needs initialization
        if (!this.cpu.isInitialized()) {
            console.log('🔧 [INTERPRETER] CPU not initialized for step, initializing...');
            const entryPoint = this.loadedHunks.length > 0 ? this.loadedHunks[0].loadAddress : 0x400000;
            this.cpu.initialize(entryPoint);
        }

        // Check if CPU can still execute
        if (!this.cpu.isRunning()) {
            console.log('🛑 [INTERPRETER] Cannot step - CPU execution already finished');
            return {
                cpu: {
                    pc: this.cpu.getProgramCounter(),
                    registers: this.cpu.getRegisters(),
                    flags: this.cpu.getFlags(),
                    stats: this.cpu.getStatistics(),
                    finished: true,
                    error: false,
                    running: false,
                    instruction: 'FINISHED',
                    cycles: 0
                },
                memory: {
                    chipRam: this.memory.getChipRamSample(),
                    customRegs: this.memory.getCustomRegisters()
                },
                display: this.canvas.getPixelData(),
                message: 'Execution already finished'
            };
        }

        // Execute one CPU instruction
        const cpuResult = this.cpu.step();
                
        // Update custom chips only if still running
        if (this.cpu.isRunning()) {
            this.customChips.copper.update();
            this.customChips.blitter.update();
            this.canvas.update();
        }

        // *** CRUCIAL: Make sure ALL cpuResult data is passed through ***
        return {
            cpu: {
                pc: this.cpu.getProgramCounter(),
                registers: this.cpu.getRegisters(),
                flags: this.cpu.getFlags(),
                stats: this.cpu.getStatistics(),
                finished: cpuResult.finished || !this.cpu.isRunning(),
                error: cpuResult.error,
                running: this.cpu.isRunning(),
                instruction: cpuResult.instruction,
                cycles: cpuResult.cycles,
                // *** THESE ARE THE MISSING FIELDS ***
                asm: cpuResult.asm,                    // ← Must pass this through
                description: cpuResult.description,    // ← Must pass this through
                oldValue: cpuResult.oldValue,          // ← Must pass this through
                newValue: cpuResult.newValue,          // ← Must pass this through (crucial!)
                target: cpuResult.target,
                immediate: cpuResult.immediate,
                // *** ADD NEXT INSTRUCTION PREVIEW ***
                nextInstruction: (() => {
                    try {
                        if (this.cpu && typeof this.cpu.peekNextInstruction === 'function') {
                            const result = this.cpu.peekNextInstruction();
                            return result;
                        }
                        return null;
                    } catch (error) {
                        return null;
                    }
                })()
            },
            memory: {
                chipRam: this.memory.getChipRamSample(),
                customRegs: this.memory.getCustomRegisters()
            },
            display: this.canvas.getPixelData()
        };
    }
    // Add method to get detailed statistics
    getDetailedStats() {
        if (!this.cpu) {
            return { error: 'No CPU loaded' };
        }
        
        return {
            cpu: this.cpu.getStatistics(),
            memory: {
                chipRamUsed: this.memory.getUsageStats ? this.memory.getUsageStats() : 'N/A',
                hunksLoaded: this.loadedHunks.length  // Use stored hunks
            },
            execution: {
                loaded: this.loaded,
                running: this.running,
                cpuRunning: this.cpu.isRunning(),
                finished: this.cpu.isFinished()
            }
        };
    }

    // *** NEW: Enable authentic ROM-driven initialization mode ***
    enableROMDrivenMode() {
        console.log('🚀 [INTERPRETER] Enabling authentic ROM-driven emulation mode');
        
        try {
            const resetVectors = this.memory.enableROMDrivenMode();
            console.log(`✅ [INTERPRETER] ROM-driven mode enabled`);
            console.log(`📍 [INTERPRETER] ROM Reset PC: 0x${resetVectors.programCounter.toString(16)}`);
            console.log(`📍 [INTERPRETER] ROM Reset SP: 0x${resetVectors.stackPointer.toString(16)}`);
            
            return resetVectors;
        } catch (error) {
            console.error(`❌ [INTERPRETER] Failed to enable ROM-driven mode: ${error.message}`);
            throw error;
        }
    }

    // *** NEW: Initialize CPU from ROM reset vectors ***
    initializeFromROM() {
        console.log('🚀 [INTERPRETER] Initializing CPU from ROM reset vectors...');
        
        try {
            const resetVectors = this.memory.getROMResetVectors();
            
            // Initialize CPU with ROM-provided values
            this.cpu = new MusashiInspiredCPU(this.memory);
            this.cpu.initializeFromROM(resetVectors);
            
            console.log('✅ [INTERPRETER] CPU initialized from ROM reset vectors');
            console.log(`📍 [INTERPRETER] Starting execution at ROM PC: 0x${resetVectors.programCounter.toString(16)}`);
            console.log(`🎯 [INTERPRETER] Ready to step through ROM startup code`);
            
            this.loaded = true;
            return resetVectors;
            
        } catch (error) {
            console.error(`❌ [INTERPRETER] ROM initialization failed: ${error.message}`);
            throw error;
        }
    }

    // *** NEW: Load ROM and automatically initialize for authentic execution ***
    loadROM(romBuffer, romId, romInfo) {
        console.log('🔥 [INTERPRETER] Loading ROM and enabling authentic mode...');
        
        try {
            // Load ROM into memory (this auto-enables ROM-driven mode)
            const loadResult = this.memory.loadKickstartROM(romBuffer, romId, romInfo);
            
            // Automatically initialize CPU from ROM reset vectors
            const resetVectors = this.initializeFromROM();
            
            console.log('🚀 [INTERPRETER] ROM loaded and CPU initialized - ready for ROM execution');
            
            return {
                success: true,
                romInfo: loadResult,
                resetVectors: resetVectors,
                message: 'ROM loaded and CPU automatically initialized from reset vectors'
            };
            
        } catch (error) {
            console.error(`❌ [INTERPRETER] ROM loading failed: ${error.message}`);
            throw error;
        }
    }

    // FIXED: Reset - keep executable loaded!
    reset() {
        console.log('🔄 [INTERPRETER] Resetting system state (keeping executable loaded)...');
        
        this.running = false;
        
        // Reset CPU state but DON'T destroy the CPU
        if (this.cpu) {
            this.cpu.reset();  // This clears registers and marks as uninitialized
        }
        
        // DON'T reset memory completely - just clear the working areas
        // Keep the loaded hunks in memory
        this.memory.resetWorkingState();  // We need to add this method
        
        // Reset custom chips
        this.customChips.blitter.reset();
        this.customChips.copper.reset();
        this.canvas.reset();
        
        // IMPORTANT: Keep the loaded state and hunks
        // this.loaded = false;     ← DON'T do this!
        // this.loadedHunks = [];   ← DON'T do this!
        
        // But we need to reload the hunks into memory since memory was cleared
        if (this.loadedHunks.length > 0) {
            console.log('📁 [INTERPRETER] Reloading executable into memory...');
            this.memory.loadHunks(this.loadedHunks);
        }
        
        console.log('✅ [INTERPRETER] Reset complete - executable still loaded and ready to run');
        console.log(`📊 [INTERPRETER] Status: loaded=${this.loaded}, hunks=${this.loadedHunks.length}`);
    }
}

module.exports = { AmigaInterpreter };

// ALSO NEED TO UPDATE: src/MemoryManager.js - Add resetWorkingState method

// ADD this method to MemoryManager class:
/*
resetWorkingState() {
    // Clear chip RAM and fast RAM but DON'T clear the hunks array
    this.chipRam.fill(0);
    this.fastRam.fill(0);
    this.customRegisters.fill(0);
    
    // DON'T clear this.hunks - that would lose the loaded executable
    // this.hunks = [];  ← DON'T do this in resetWorkingState!
    
    console.log('🧹 [MEMORY] Working state cleared, hunks preserved');
}
*/