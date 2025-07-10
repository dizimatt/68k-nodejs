// UPDATED: src/AmigaInterpreter.js - Fix run loop to stop properly

const { HunkLoader } = require('./HunkLoader');
const { MemoryManager } = require('./MemoryManager');
const { SimpleCPU } = require('./SimpleCPU');
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
    }

    loadExecutable(buffer) {
        try {
            // Parse Amiga Hunk format
            const hunks = this.hunkLoader.loadHunks(buffer);
            
            // Set up memory
            this.memory.loadHunks(hunks);
            
            // Initialize CPU (we'll use a simple CPU implementation for now)
            this.cpu = new SimpleCPU(this.memory);
            
            // Set program counter to first hunk
            if (hunks.length > 0) {
                this.cpu.setProgramCounter(hunks[0].loadAddress);
            }
            
            this.loaded = true;
            
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

        // Don't reinitialize if already initialized - just reset execution state
        if (!this.cpu.isInitialized()) {
            console.log('🔧 [INTERPRETER] CPU not initialized, setting up...');
            // Find the entry point from loaded hunks
            const entryPoint = this.memory.hunks.length > 0 ? this.memory.hunks[0].loadAddress : 0x400000;
            this.cpu.initialize(entryPoint);
        } else {
            console.log('🔄 [INTERPRETER] CPU already initialized, starting execution...');
            // Just reset execution state, don't reinitialize stack
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

        // IMPORTANT FIX: Check if CPU needs initialization before stepping
        if (!this.cpu.isInitialized()) {
            console.log('🔧 [INTERPRETER] CPU not initialized for step, initializing...');
            // Find the entry point from loaded hunks
            const entryPoint = this.memory.hunks.length > 0 ? this.memory.hunks[0].loadAddress : 0x400000;
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
                    running: false
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
                cycles: cpuResult.cycles
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
                hunksLoaded: this.memory.hunks.length
            },
            execution: {
                loaded: this.loaded,
                running: this.running,
                cpuRunning: this.cpu.isRunning(),
                finished: this.cpu.isFinished()
            }
        };
    }

    reset() {
        this.running = false;
        if (this.cpu) {
            this.cpu.reset();  // This should completely reset CPU including initialization state
        }
        this.memory.reset();
        this.customChips.blitter.reset();
        this.customChips.copper.reset();
        this.canvas.reset();
        
        console.log('🔄 [INTERPRETER] System reset completed - CPU will be reinitialized on next run');
    }
}

module.exports = { AmigaInterpreter };