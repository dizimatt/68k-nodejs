// FIXED: src/SimpleCPU.js - Corrected exit address handling

class SimpleCPU {
    constructor(memory) {
        this.memory = memory;
        this.registers = {
            d: new Array(8).fill(0),
            a: new Array(8).fill(0),
            pc: 0,
            sr: 0
        };
        this.running = true;
        this.instructionStats = new Map();
        this.totalInstructions = 0;
        this.unknownInstructions = new Map();
        this.implementedCount = 0;
        this.unimplementedCount = 0;
        
        // Stack management
        this.stackBase = 0;
        this.stackTop = 0;
        this.initialSP = 0;
        this.exitAddress = 0x12345678; // Use a distinctive 32-bit exit address
    }
    
    // Initialize the CPU with proper stack setup
    initialize(programEntry, stackSize = 8192) {
        console.log(`🔧 [CPU] Initializing CPU...`);
        
        // Set up stack in chip RAM (at the end)
        this.stackTop = 0x200000;
        this.stackBase = this.stackTop - stackSize;
        this.initialSP = this.stackTop - 16;
        
        // Set stack pointer (A7)
        this.registers.a[7] = this.initialSP;
        
        // Set program counter
        this.registers.pc = programEntry;
        
        // Push exit address onto stack (32-bit value stored as two 16-bit words)
        this.pushLongToStack(this.exitAddress);
        
        console.log(`📍 [CPU] Program entry: 0x${programEntry.toString(16)}`);
        console.log(`📚 [CPU] Stack area: 0x${this.stackBase.toString(16)} - 0x${this.stackTop.toString(16)} (${stackSize} bytes)`);
        console.log(`📌 [CPU] Initial SP: 0x${this.registers.a[7].toString(16)}`);
        console.log(`🚪 [CPU] Exit address: 0x${this.exitAddress.toString(16)} (pushed to stack as 32-bit)`);
        
        this.running = true;
    }
    
    setProgramCounter(address) {
        this.initialize(address);
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
    
    // 16-bit stack operations (for RTS/JSR)
    pushToStack(value) {
        if (this.registers.a[7] <= this.stackBase + 2) {
            console.error(`🚨 [CPU] Stack overflow! SP=0x${this.registers.a[7].toString(16)}`);
            this.running = false;
            return;
        }
        
        this.registers.a[7] -= 2;
        this.memory.writeWord(this.registers.a[7], value & 0xFFFF);
        
        console.log(`📤 [STACK] Pushed word 0x${(value & 0xFFFF).toString(16)} to SP=0x${this.registers.a[7].toString(16)}`);
    }
    
    popFromStack() {
        if (this.registers.a[7] >= this.initialSP) {
            console.error(`🚨 [CPU] Stack underflow! SP=0x${this.registers.a[7].toString(16)}`);
            this.running = false;
            return 0;
        }
        
        const value = this.memory.readWord(this.registers.a[7]);
        this.registers.a[7] += 2;
        
        console.log(`📥 [STACK] Popped word 0x${value.toString(16)} from SP=0x${(this.registers.a[7] - 2).toString(16)}`);
        
        return value;
    }
    
    // 32-bit stack operations (for storing addresses)
    pushLongToStack(value) {
        // Push high word first, then low word (68000 convention)
        this.pushToStack((value >> 16) & 0xFFFF);  // High word
        this.pushToStack(value & 0xFFFF);           // Low word
        
        console.log(`📤 [STACK] Pushed long 0x${value.toString(16)} (as two words)`);
    }
    
    popLongFromStack() {
        // Pop low word first, then high word
        const lowWord = this.popFromStack();
        const highWord = this.popFromStack();
        const value = (highWord << 16) | lowWord;
        
        console.log(`📥 [STACK] Popped long 0x${value.toString(16)} (from two words)`);
        
        return value;
    }
    
    // Get stack usage statistics
    getStackInfo() {
        const used = this.initialSP - this.registers.a[7];
        const available = this.registers.a[7] - this.stackBase;
        
        return {
            currentSP: this.registers.a[7],
            stackBase: this.stackBase,
            stackTop: this.stackTop,
            initialSP: this.initialSP,
            bytesUsed: used,
            bytesAvailable: available,
            percentUsed: ((used / (this.stackTop - this.stackBase)) * 100).toFixed(1)
        };
    }
    
    // Enhanced instruction recognition
    getInstructionInfo(opcode) {
        if (opcode === 0x4E71) return "NOP";
        if (opcode === 0x4E75) return "RTS";
        
        if ((opcode & 0xFFC0) === 0x4E80) return "JSR (absolute)";
        if ((opcode & 0xFFC0) === 0x4EC0) return "JMP (absolute)";
        
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
    
    step() {
        if (!this.running) {
            return { instruction: 'STOPPED', cycles: 0, finished: true };
        }
        
        const instruction = this.memory.readWord(this.registers.pc);
        const oldPC = this.registers.pc;
        this.registers.pc += 2;
        
        const instrType = this.getInstructionInfo(instruction);
        this.updateStats(instruction, instrType);
        
        // ✅ IMPLEMENTED INSTRUCTIONS
        if (instruction === 0x4E75) { // RTS
            console.log(`🟢 [IMPLEMENTED] RTS at PC=0x${oldPC.toString(16)} - Return from subroutine`);
            this.implementedCount++;
            
            // RTS only pops 16 bits (program counter), not 32 bits
            const returnAddress = this.popFromStack();
            
            console.log(`🔍 [DEBUG] RTS return address: 0x${returnAddress.toString(16)}`);
            
            // Check if this is our special exit pattern
            // Since we pushed 32-bit address but RTS only pops 16-bit,
            // we need a different approach
            
            // Simple solution: Check if we're returning to an address outside our program
            if (returnAddress < 0x400000 || returnAddress > 0x500000) {
                console.log(`🏁 [CPU] Program completed - RTS to invalid address 0x${returnAddress.toString(16)}`);
                this.running = false;
                return { instruction: 'RTS', cycles: 16, finished: true };
            }
            
            // Normal subroutine return
            this.registers.pc = returnAddress;
            console.log(`↩️  [CPU] Returned to PC=0x${returnAddress.toString(16)}`);
            
            return { instruction: 'RTS', cycles: 16 };
        }
        
        if (instruction === 0x4E71) { // NOP
            console.log(`🟢 [IMPLEMENTED] NOP at PC=0x${oldPC.toString(16)} - No operation`);
            this.implementedCount++;
            return { instruction: 'NOP', cycles: 4 };
        }
        
        // 🚧 PARTIALLY IMPLEMENTED - JSR (Jump to Subroutine)
        if ((instruction & 0xFFC0) === 0x4E80) { // JSR absolute word
            const target = this.memory.readWord(this.registers.pc);
            this.registers.pc += 2;
            
            console.log(`🟡 [PARTIAL] JSR 0x${target.toString(16)} at PC=0x${oldPC.toString(16)} - Jump to subroutine`);
            
            // Push return address to stack (16-bit, as RTS expects)
            this.pushToStack(this.registers.pc);
            
            // Jump to target
            this.registers.pc = target;
            
            this.implementedCount++;
            return { instruction: 'JSR', cycles: 18 };
        }
        
        // ❌ UNIMPLEMENTED INSTRUCTIONS
        if ((instruction & 0xF000) === 0x3000) { // MOVE.W
            console.log(`🔴 [UNIMPLEMENTED] MOVE.W at PC=0x${oldPC.toString(16)} - opcode: 0x${instruction.toString(16)}`);
            this.unimplementedCount++;
            return { instruction: 'MOVE.W', cycles: 8 };
        }
        
        // Check for execution errors
        if (instruction === 0x0000) {
            console.log(`🚨 [CPU] Executing zero opcode at PC=0x${oldPC.toString(16)} - possible execution error`);
            
            if (!this.zeroOpcodeCount) this.zeroOpcodeCount = 0;
            this.zeroOpcodeCount++;
            
            if (this.zeroOpcodeCount > 3) { // Reduced threshold
                console.log(`🚨 [CPU] Too many zero opcodes - stopping execution`);
                this.running = false;
                return { instruction: 'ZERO_OPCODE', cycles: 4, error: true };
            }
        } else {
            this.zeroOpcodeCount = 0;
        }
        
        console.log(`🔴 [UNIMPLEMENTED] Unknown opcode: 0x${instruction.toString(16).toUpperCase()} (${instrType}) at PC=0x${oldPC.toString(16)}`);
        this.unimplementedCount++;
        
        return { instruction: `UNK_${instruction.toString(16)}`, cycles: 4 };
    }
    
    updateStats(instruction, instrType) {
        this.totalInstructions++;
        this.instructionStats.set(instrType, (this.instructionStats.get(instrType) || 0) + 1);
        
        if (instrType === "Unknown") {
            const opcodeHex = `0x${instruction.toString(16).toUpperCase()}`;
            this.unknownInstructions.set(opcodeHex, (this.unknownInstructions.get(opcodeHex) || 0) + 1);
        }
        
        if (this.totalInstructions % 25 === 0) {
            this.logProgress();
        }
    }
    
    logProgress() {
        const implementedPercent = ((this.implementedCount / this.totalInstructions) * 100).toFixed(1);
        const unimplementedPercent = ((this.unimplementedCount / this.totalInstructions) * 100).toFixed(1);
        const stackInfo = this.getStackInfo();
        
        console.log(`\n📊 === PROGRESS REPORT (${this.totalInstructions} instructions) ===`);
        console.log(`🟢 IMPLEMENTED: ${this.implementedCount} (${implementedPercent}%)`);
        console.log(`🔴 UNIMPLEMENTED: ${this.unimplementedCount} (${unimplementedPercent}%)`);
        console.log(`📚 STACK: SP=0x${stackInfo.currentSP.toString(16)}, used=${stackInfo.bytesUsed} bytes (${stackInfo.percentUsed}%)`);
        
        if (this.unknownInstructions.size > 0) {
            console.log(`🎯 TOP OPCODES TO IMPLEMENT:`);
            const sortedUnknown = Array.from(this.unknownInstructions.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
            
            for (const [opcode, count] of sortedUnknown) {
                console.log(`  ${opcode}: ${count} times`);
            }
        }
        console.log(`📊 === END PROGRESS ===\n`);
    }
    
    isRunning() {
        return this.running;
    }
    
    getStatistics() {
        const stackInfo = this.getStackInfo();
        
        return {
            totalInstructions: this.totalInstructions,
            implementedCount: this.implementedCount,
            unimplementedCount: this.unimplementedCount,
            implementedPercent: ((this.implementedCount / this.totalInstructions) * 100).toFixed(1),
            instructionTypes: Object.fromEntries(this.instructionStats),
            unknownOpcodes: Object.fromEntries(this.unknownInstructions),
            topUnknown: Array.from(this.unknownInstructions.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5),
            stack: stackInfo
        };
    }
    
    reset() {
        this.registers.d.fill(0);
        this.registers.a.fill(0);
        this.registers.pc = 0;
        this.registers.sr = 0;
        this.running = true;
        this.instructionStats.clear();
        this.unknownInstructions.clear();
        this.totalInstructions = 0;
        this.implementedCount = 0;
        this.unimplementedCount = 0;
        this.zeroOpcodeCount = 0;
        this.stackBase = 0;
        this.stackTop = 0;
        this.initialSP = 0;
        this.exitAddress = 0;
        
        console.log("🔄 [CPU] Reset - all statistics and stack cleared");
    }
}

module.exports = { SimpleCPU };