class SimpleCPU {
    constructor(memory) {
        this.memory = memory;
        this.registers = {
            d: new Array(8).fill(0), // Data registers
            a: new Array(8).fill(0), // Address registers
            pc: 0,                   // Program counter
            sr: 0                    // Status register
        };
        this.running = true;
    }
    
    setProgramCounter(address) {
        this.registers.pc = address;
    }
    
    getProgramCounter() {
        return this.registers.pc;
    }
    
    getRegisters() {
        return { ...this.registers };
    }
    
    getFlags() {
        return {
            zero: (this.registers.sr & 0x04) !== 0,
            negative: (this.registers.sr & 0x08) !== 0,
            carry: (this.registers.sr & 0x01) !== 0,
            overflow: (this.registers.sr & 0x02) !== 0
        };
    }
    
    step() {
        // Read instruction
        const instruction = this.memory.readWord(this.registers.pc);
        this.registers.pc += 2;
        
        // Very simple instruction decoder (just handle a few basics)
        if (instruction === 0x4E75) { // RTS
            // Return from subroutine - pop PC from stack
            this.registers.pc = this.popFromStack();
            return { instruction: 'RTS', cycles: 16 };
        }
        
        if (instruction === 0x4E71) { // NOP
            return { instruction: 'NOP', cycles: 4 };
        }
        
        if ((instruction & 0xF000) === 0x3000) { // MOVE.W
            // Simple MOVE.W implementation
            const src = instruction & 0x3F;
            const dst = (instruction >> 6) & 0x3F;
            return { instruction: 'MOVE.W', cycles: 8 };
        }
        
        // Default: treat as NOP
        return { instruction: `UNK_${instruction.toString(16)}`, cycles: 4 };
    }
    
    popFromStack() {
        const value = this.memory.readWord(this.registers.a[7]);
        this.registers.a[7] += 2;
        return value;
    }
    
    reset() {
        this.registers.d.fill(0);
        this.registers.a.fill(0);
        this.registers.pc = 0;
        this.registers.sr = 0;
        this.running = true;
    }
}
module.exports = { SimpleCPU };
