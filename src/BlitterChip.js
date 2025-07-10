class BlitterChip {
    constructor(memory) {
        this.memory = memory;
        this.active = false;
        this.registers = {};
    }
    
    update() {
        // Placeholder for blitter updates
    }
    
    reset() {
        this.active = false;
        this.registers = {};
    }
}

module.exports = { BlitterChip };
