// src/CopperChip.js
class CopperChip {
    constructor(memory) {
        this.memory = memory;
        this.active = false;
        this.pc = 0;
    }
    
    update() {
        // Placeholder for copper updates
    }
    
    reset() {
        this.active = false;
        this.pc = 0;
    }
}
module.exports = { CopperChip };
