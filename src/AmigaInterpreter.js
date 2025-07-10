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

        this.running = true;
        
        // Run for a limited number of steps to avoid infinite loops
        let steps = 0;
        const maxSteps = 1000;
        
        while (this.running && steps < maxSteps) {
            this.step();
            steps++;
        }

        return {
            steps: steps,
            running: this.running,
            pc: this.cpu.getProgramCounter()
        };
    }

    step() {
        if (!this.loaded) {
            throw new Error('No executable loaded');
        }

        // Execute one CPU instruction
        const cpuResult = this.cpu.step();
        
        // Update custom chips
        this.customChips.copper.update();
        this.customChips.blitter.update();
        
        // Update display
        this.canvas.update();

        return {
            cpu: {
                pc: this.cpu.getProgramCounter(),
                registers: this.cpu.getRegisters(),
                flags: this.cpu.getFlags(),
                stats: this.cpu.getStatistics() // Add CPU statistics
            },
            memory: {
                chipRam: this.memory.getChipRamSample(),
                customRegs: this.memory.getCustomRegisters()
            },
            display: this.canvas.getPixelData()
        };
    }
    
    getDetailedStats() {
        if (!this.cpu) {
            return { error: 'No CPU loaded' };
        }
        
        return {
            cpu: this.cpu.getStatistics(),
            memory: {
                chipRamUsed: this.memory.getUsageStats(),
                hunksLoaded: this.memory.hunks.length
            }
        };
    }

    reset() {
        this.running = false;
        if (this.cpu) {
            this.cpu.reset();
        }
        this.memory.reset();
        this.customChips.blitter.reset();
        this.customChips.copper.reset();
        this.canvas.reset();
    }
}
module.exports = { AmigaInterpreter };
