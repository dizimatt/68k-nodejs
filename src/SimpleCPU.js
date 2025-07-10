// src/SimpleCPU.js - Enhanced version with instruction statistics

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
        
        // Add instruction statistics tracking
        this.instructionStats = new Map();
        this.totalInstructions = 0;
        this.unknownInstructions = new Map(); // Track specific unknown opcodes
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
    
    // Add instruction pattern recognition
    getInstructionInfo(opcode) {
        // Specific instructions first
        if (opcode === 0x4E71) return "NOP";
        if (opcode === 0x4E75) return "RTS";
        
        // Instruction families
        if ((opcode & 0xF000) === 0x1000) return "MOVE.B";
        if ((opcode & 0xF000) === 0x2000) return "MOVE.L";  
        if ((opcode & 0xF000) === 0x3000) return "MOVE.W";
        if ((opcode & 0xF000) === 0x4000) return "Misc/LEA/JSR/CLR";
        if ((opcode & 0xF000) === 0x5000) return "ADDQ/SUBQ/DBcc";
        if ((opcode & 0xF000) === 0x6000) return "Branch (Bcc)";
        if ((opcode & 0xF000) === 0x7000) return "MOVEQ";
        if ((opcode & 0xF000) === 0x8000) return "OR/DIV/SBCD";
        if ((opcode & 0xF000) === 0x9000) return "SUB/SUBX";
        if ((opcode & 0xF000) === 0xA000) return "A-line (Trap)";
        if ((opcode & 0xF000) === 0xB000) return "CMP/EOR";
        if ((opcode & 0xF000) === 0xC000) return "AND/MUL/ABCD/EXG";
        if ((opcode & 0xF000) === 0xD000) return "ADD/ADDX";
        if ((opcode & 0xF000) === 0xE000) return "Shift/Rotate";
        if ((opcode & 0xF000) === 0xF000) return "F-line (Trap)";
        
        return "Unknown";
    }
    
    // Update instruction statistics
    updateStats(instruction, instrType) {
        this.totalInstructions++;
        
        // Track instruction types
        this.instructionStats.set(instrType, (this.instructionStats.get(instrType) || 0) + 1);
        
        // Track specific unknown opcodes
        if (instrType === "Unknown") {
            const opcodeHex = `0x${instruction.toString(16).toUpperCase()}`;
            this.unknownInstructions.set(opcodeHex, (this.unknownInstructions.get(opcodeHex) || 0) + 1);
        }
        
        // Log statistics every 100 instructions
        if (this.totalInstructions % 100 === 0) {
            this.logStatistics();
        }
    }
    
    // Log instruction statistics
    logStatistics() {
        console.log(`\n=== CPU Statistics (${this.totalInstructions} instructions) ===`);
        
        // Sort by frequency
        const sortedStats = Array.from(this.instructionStats.entries())
            .sort((a, b) => b[1] - a[1]);
        
        console.log("Instruction types:");
        for (const [type, count] of sortedStats) {
            const percentage = ((count / this.totalInstructions) * 100).toFixed(1);
            console.log(`  ${type}: ${count} (${percentage}%)`);
        }
        
        // Show most common unknown opcodes
        if (this.unknownInstructions.size > 0) {
            console.log("\nMost common unknown opcodes:");
            const sortedUnknown = Array.from(this.unknownInstructions.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10); // Top 10
            
            for (const [opcode, count] of sortedUnknown) {
                console.log(`  ${opcode}: ${count} times`);
            }
        }
        console.log("=== End Statistics ===\n");
    }
    
    // Get statistics for external use (e.g., web interface)
    getStatistics() {
        return {
            totalInstructions: this.totalInstructions,
            instructionTypes: Object.fromEntries(this.instructionStats),
            unknownOpcodes: Object.fromEntries(this.unknownInstructions),
            topUnknown: Array.from(this.unknownInstructions.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
        };
    }
    
    step() {
        // Read instruction
        const instruction = this.memory.readWord(this.registers.pc);
        const oldPC = this.registers.pc;
        this.registers.pc += 2;
        
        // Get instruction info for statistics
        const instrType = this.getInstructionInfo(instruction);
        this.updateStats(instruction, instrType);
        
        // Very simple instruction decoder (just handle a few basics)
        if (instruction === 0x4E75) { // RTS
            console.log(`[CPU] RTS at PC=0x${oldPC.toString(16)}`);
            // Return from subroutine - pop PC from stack
            this.registers.pc = this.popFromStack();
            return { instruction: 'RTS', cycles: 16 };
        }
        
        if (instruction === 0x4E71) { // NOP
            console.log(`[CPU] NOP at PC=0x${oldPC.toString(16)}`);
            return { instruction: 'NOP', cycles: 4 };
        }
        
        if ((instruction & 0xF000) === 0x3000) { // MOVE.W
            console.log(`[CPU] MOVE.W (unimplemented) at PC=0x${oldPC.toString(16)}`);
            // Simple MOVE.W implementation
            const src = instruction & 0x3F;
            const dst = (instruction >> 6) & 0x3F;
            return { instruction: 'MOVE.W', cycles: 8 };
        }
        
        // Log all unknown instructions with more detail
        console.log(`[CPU] UNKNOWN OPCODE: 0x${instruction.toString(16).toUpperCase()} (${instrType}) at PC=0x${oldPC.toString(16)}`);
        
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
        
        // Reset statistics
        this.instructionStats.clear();
        this.unknownInstructions.clear();
        this.totalInstructions = 0;
        
        console.log("[CPU] Reset - statistics cleared");
    }
}

module.exports = { SimpleCPU };