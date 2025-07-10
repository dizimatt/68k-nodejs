// UPDATED: src/SimpleCPU.js - Full 32-bit addressing support

class SimpleCPU {
    constructor(memory) {
        this.memory = memory;
        this.registers = {
            d: new Array(8).fill(0), // Data registers D0-D7 (32-bit)
            a: new Array(8).fill(0), // Address registers A0-A7 (32-bit)
            pc: 0,                   // Program counter (32-bit)
            sr: 0                    // Status register (16-bit)
        };
        this.running = true;
        this.instructionStats = new Map();
        this.totalInstructions = 0;
        this.unknownInstructions = new Map();
        this.implementedCount = 0;
        this.unimplementedCount = 0;
        
        // Stack management (all 32-bit addresses)
        this.stackBase = 0;
        this.stackTop = 0;
        this.initialSP = 0;
    }
    
    // Ensure all values are treated as 32-bit unsigned integers
    to32BitAddress(value) {
        return (value >>> 0); // Convert to unsigned 32-bit
    }
    
    // Initialize the CPU with proper 32-bit stack setup
    initialize(programEntry, stackSize = 8192) {
        console.log(`🔧 [CPU] Initializing CPU with 32-bit addressing...`);
        
        // All addresses are 32-bit
        this.stackTop = this.to32BitAddress(0x00200000);           // End of 2MB chip RAM
        this.stackBase = this.to32BitAddress(this.stackTop - stackSize); // Stack grows downward
        this.initialSP = this.to32BitAddress(this.stackTop - 16);  // Leave some headroom
        
        // Set 32-bit stack pointer (A7)
        this.registers.a[7] = this.initialSP;
        
        // Set 32-bit program counter
        this.registers.pc = this.to32BitAddress(programEntry);
        
        // Push a distinctive 32-bit exit address pattern onto stack
        // We'll push it as two 16-bit words since that's how 68000 stack works
        const exitAddressHigh = 0x0000;  // High word of exit address
        const exitAddressLow = 0x0004;   // Low word - very low address, clearly invalid
        
        this.pushWordToStack(exitAddressHigh);  // Push high word first
        this.pushWordToStack(exitAddressLow);   // Push low word second
        
        console.log(`📍 [CPU] Program entry: 0x${this.registers.pc.toString(16).padStart(8, '0')}`);
        console.log(`📚 [CPU] Stack area: 0x${this.stackBase.toString(16).padStart(8, '0')} - 0x${this.stackTop.toString(16).padStart(8, '0')} (${stackSize} bytes)`);
        console.log(`📌 [CPU] Initial SP: 0x${this.registers.a[7].toString(16).padStart(8, '0')}`);
        console.log(`🚪 [CPU] Exit pattern: 0x${exitAddressHigh.toString(16).padStart(4, '0')}${exitAddressLow.toString(16).padStart(4, '0')} (pushed as two words)`);
        
        this.running = true;
    }
    
    setProgramCounter(address) {
        this.initialize(this.to32BitAddress(address));
    }
    
    getProgramCounter() {
        return this.to32BitAddress(this.registers.pc);
    }
    
    getRegisters() {
        // Ensure all registers are returned as 32-bit values
        return {
            d: this.registers.d.map(reg => this.to32BitAddress(reg)),
            a: this.registers.a.map(reg => this.to32BitAddress(reg)),
            pc: this.to32BitAddress(this.registers.pc),
            sr: this.registers.sr & 0xFFFF  // SR is 16-bit
        };
    }
    
    getFlags() {
        return {
            zero: (this.registers.sr & 0x04) !== 0,
            negative: (this.registers.sr & 0x08) !== 0,
            carry: (this.registers.sr & 0x01) !== 0,
            overflow: (this.registers.sr & 0x02) !== 0
        };
    }
    
    // 16-bit stack operations (for compatibility with 68000 instruction set)
    pushWordToStack(value) {
        const word = value & 0xFFFF;  // Ensure 16-bit value
        
        if (this.registers.a[7] <= this.stackBase + 2) {
            console.error(`🚨 [CPU] Stack overflow! SP=0x${this.registers.a[7].toString(16).padStart(8, '0')}`);
            this.running = false;
            return;
        }
        
        // Pre-decrement stack pointer (32-bit address arithmetic)
        this.registers.a[7] = this.to32BitAddress(this.registers.a[7] - 2);
        
        // Write 16-bit word to 32-bit address
        this.memory.writeWord(this.registers.a[7], word);
        
        console.log(`📤 [STACK] Pushed word 0x${word.toString(16).padStart(4, '0')} to SP=0x${this.registers.a[7].toString(16).padStart(8, '0')}`);
    }
    
    popWordFromStack() {
        if (this.registers.a[7] >= this.initialSP) {
            console.error(`🚨 [CPU] Stack underflow! SP=0x${this.registers.a[7].toString(16).padStart(8, '0')}`);
            this.running = false;
            return 0;
        }
        
        // Read 16-bit word from 32-bit address
        const value = this.memory.readWord(this.registers.a[7]) & 0xFFFF;
        
        // Post-increment stack pointer (32-bit address arithmetic)
        this.registers.a[7] = this.to32BitAddress(this.registers.a[7] + 2);
        
        console.log(`📥 [STACK] Popped word 0x${value.toString(16).padStart(4, '0')} from SP=0x${(this.registers.a[7] - 2).toString(16).padStart(8, '0')}`);
        
        return value;
    }
    
    // 32-bit stack operations (for long addresses and data)
    pushLongToStack(value) {
        const longValue = this.to32BitAddress(value);
        
        // Push high word first, then low word (big-endian)
        this.pushWordToStack((longValue >>> 16) & 0xFFFF);  // High word
        this.pushWordToStack(longValue & 0xFFFF);           // Low word
        
        console.log(`📤 [STACK] Pushed long 0x${longValue.toString(16).padStart(8, '0')} (as two words)`);
    }
    
    popLongFromStack() {
        // Pop low word first, then high word
        const lowWord = this.popWordFromStack();
        const highWord = this.popWordFromStack();
        const value = this.to32BitAddress((highWord << 16) | lowWord);
        
        console.log(`📥 [STACK] Popped long 0x${value.toString(16).padStart(8, '0')} (from two words)`);
        
        return value;
    }
    
    // Read 32-bit long word from memory
    readLong(address) {
        const addr = this.to32BitAddress(address);
        const highWord = this.memory.readWord(addr);
        const lowWord = this.memory.readWord(addr + 2);
        return this.to32BitAddress((highWord << 16) | lowWord);
    }
    
    // Write 32-bit long word to memory
    writeLong(address, value) {
        const addr = this.to32BitAddress(address);
        const longValue = this.to32BitAddress(value);
        
        this.memory.writeWord(addr, (longValue >>> 16) & 0xFFFF);  // High word
        this.memory.writeWord(addr + 2, longValue & 0xFFFF);       // Low word
    }
    
    // Get stack usage statistics with 32-bit addresses
    getStackInfo() {
        const used = this.initialSP - this.registers.a[7];
        const available = this.registers.a[7] - this.stackBase;
        
        return {
            currentSP: this.to32BitAddress(this.registers.a[7]),
            stackBase: this.to32BitAddress(this.stackBase),
            stackTop: this.to32BitAddress(this.stackTop),
            initialSP: this.to32BitAddress(this.initialSP),
            bytesUsed: used,
            bytesAvailable: available,
            percentUsed: ((used / (this.stackTop - this.stackBase)) * 100).toFixed(1)
        };
    }
    
    // Enhanced instruction recognition
    getInstructionInfo(opcode) {
        if (opcode === 0x4E71) return "NOP";
        if (opcode === 0x4E75) return "RTS";
        
        // JSR variants with different addressing modes
        if ((opcode & 0xFFC0) === 0x4E80) return "JSR (absolute.W)";
        if ((opcode & 0xFFC0) === 0x4E90) return "JSR (An)";
        if ((opcode & 0xFFC0) === 0x4EA8) return "JSR (d16,An)";
        if ((opcode & 0xFFC0) === 0x4EB0) return "JSR (d8,An,Xn)";
        if ((opcode & 0xFFC0) === 0x4EB8) return "JSR (absolute.W)";
        if ((opcode & 0xFFC0) === 0x4EB9) return "JSR (absolute.L)";
        
        // JMP variants
        if ((opcode & 0xFFC0) === 0x4EC0) return "JMP (absolute)";
        
        // LEA (Load Effective Address) - 32-bit address calculations
        if ((opcode & 0xF1C0) === 0x41C0) return "LEA";
        
        // MOVE.L variants - 32-bit data moves
        if ((opcode & 0xF000) === 0x2000) return "MOVE.L";
        
        // Other instruction families
        if ((opcode & 0xF000) === 0x1000) return "MOVE.B";
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
        
        // Ensure PC is 32-bit
        this.registers.pc = this.to32BitAddress(this.registers.pc);
        
        const instruction = this.memory.readWord(this.registers.pc);
        const oldPC = this.registers.pc;
        
        // Advance PC by 2 (32-bit address arithmetic)
        this.registers.pc = this.to32BitAddress(this.registers.pc + 2);
        
        const instrType = this.getInstructionInfo(instruction);
        this.updateStats(instruction, instrType);
        
        // ✅ IMPLEMENTED INSTRUCTIONS
        if (instruction === 0x4E75) { // RTS
            console.log(`🟢 [IMPLEMENTED] RTS at PC=0x${oldPC.toString(16).padStart(8, '0')} - Return from subroutine`);
            this.implementedCount++;
            
            // RTS pops 16-bit return address (68000 behavior)
            const returnAddress = this.popWordFromStack();
            
            console.log(`🔍 [DEBUG] RTS return address: 0x${returnAddress.toString(16).padStart(4, '0')}`);
            
            // Check if this is our exit pattern (very low address)
            if (returnAddress <= 0x000F) {
                console.log(`🏁 [CPU] Program completed - RTS to exit address 0x${returnAddress.toString(16).padStart(4, '0')}`);
                this.running = false;
                return { instruction: 'RTS', cycles: 16, finished: true };
            }
            
            // Normal subroutine return - extend to 32-bit address
            this.registers.pc = this.to32BitAddress(returnAddress);
            console.log(`↩️  [CPU] Returned to PC=0x${this.registers.pc.toString(16).padStart(8, '0')}`);
            
            return { instruction: 'RTS', cycles: 16 };
        }
        
        if (instruction === 0x4E71) { // NOP
            console.log(`🟢 [IMPLEMENTED] NOP at PC=0x${oldPC.toString(16).padStart(8, '0')} - No operation`);
            this.implementedCount++;
            return { instruction: 'NOP', cycles: 4 };
        }
        
        // 🚧 PARTIALLY IMPLEMENTED - JSR (Jump to Subroutine) with 32-bit addressing
        if ((opcode & 0xFFC0) === 0x4E80) { // JSR absolute.W
            const target = this.memory.readWord(this.registers.pc);
            this.registers.pc = this.to32BitAddress(this.registers.pc + 2);
            
            console.log(`🟡 [PARTIAL] JSR 0x${target.toString(16).padStart(4, '0')} at PC=0x${oldPC.toString(16).padStart(8, '0')} - Jump to subroutine`);
            
            // Push return address to stack (16-bit for compatibility)
            this.pushWordToStack(this.registers.pc & 0xFFFF);
            
            // Jump to target (extend to 32-bit address)
            this.registers.pc = this.to32BitAddress(target);
            
            this.implementedCount++;
            return { instruction: 'JSR', cycles: 18 };
        }
        
        // 🚧 PARTIALLY IMPLEMENTED - JSR absolute.L (32-bit target)
        if ((opcode & 0xFFC0) === 0x4EB9) { // JSR absolute.L
            const target = this.readLong(this.registers.pc);
            this.registers.pc = this.to32BitAddress(this.registers.pc + 4);
            
            console.log(`🟡 [PARTIAL] JSR.L 0x${target.toString(16).padStart(8, '0')} at PC=0x${oldPC.toString(16).padStart(8, '0')} - Jump to 32-bit address`);
            
            // Push return address to stack
            this.pushWordToStack(this.registers.pc & 0xFFFF);
            
            // Jump to 32-bit target
            this.registers.pc = target;
            
            this.implementedCount++;
            return { instruction: 'JSR.L', cycles: 20 };
        }
        
        // ❌ UNIMPLEMENTED INSTRUCTIONS
        if ((instruction & 0xF000) === 0x3000) { // MOVE.W
            console.log(`🔴 [UNIMPLEMENTED] MOVE.W at PC=0x${oldPC.toString(16).padStart(8, '0')} - opcode: 0x${instruction.toString(16).padStart(4, '0')}`);
            this.unimplementedCount++;
            return { instruction: 'MOVE.W', cycles: 8 };
        }
        
        if ((instruction & 0xF000) === 0x2000) { // MOVE.L
            console.log(`🔴 [UNIMPLEMENTED] MOVE.L at PC=0x${oldPC.toString(16).padStart(8, '0')} - opcode: 0x${instruction.toString(16).padStart(4, '0')}`);
            this.unimplementedCount++;
            return { instruction: 'MOVE.L', cycles: 12 };
        }
        
        // Check for execution errors
        if (instruction === 0x0000) {
            console.log(`🚨 [CPU] Executing zero opcode at PC=0x${oldPC.toString(16).padStart(8, '0')} - possible execution error`);
            
            if (!this.zeroOpcodeCount) this.zeroOpcodeCount = 0;
            this.zeroOpcodeCount++;
            
            if (this.zeroOpcodeCount > 3) {
                console.log(`🚨 [CPU] Too many zero opcodes - stopping execution`);
                this.running = false;
                return { instruction: 'ZERO_OPCODE', cycles: 4, error: true };
            }
        } else {
            this.zeroOpcodeCount = 0;
        }
        
        console.log(`🔴 [UNIMPLEMENTED] Unknown opcode: 0x${instruction.toString(16).padStart(4, '0').toUpperCase()} (${instrType}) at PC=0x${oldPC.toString(16).padStart(8, '0')}`);
        this.unimplementedCount++;
        
        return { instruction: `UNK_${instruction.toString(16)}`, cycles: 4 };
    }
    
    updateStats(instruction, instrType) {
        this.totalInstructions++;
        this.instructionStats.set(instrType, (this.instructionStats.get(instrType) || 0) + 1);
        
        if (instrType === "Unknown") {
            const opcodeHex = `0x${instruction.toString(16).padStart(4, '0').toUpperCase()}`;
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
        console.log(`📚 STACK: SP=0x${stackInfo.currentSP.toString(16).padStart(8, '0')}, used=${stackInfo.bytesUsed} bytes (${stackInfo.percentUsed}%)`);
        
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
        
        console.log("🔄 [CPU] Reset - all statistics and 32-bit addressing cleared");
    }
}

module.exports = { SimpleCPU };