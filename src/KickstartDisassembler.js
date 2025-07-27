// src/KickstartDisassembler.js - Leverages Existing CPU Opcode Parsing

class KickstartDisassembler {
    constructor(memoryManager, cpu) {
        this.memory = memoryManager;
        this.cpu = cpu;  // Leverage existing CPU for opcode parsing
        this.disassemblyCache = new Map();
        this.initializationSequence = [];
        this.currentInstructionIndex = 0;
        this.errors = [];
    }

    /**
     * Disassemble kickstart initialization routine using existing CPU logic
     */
    async disassembleKickstartInit() {
        console.log('🔍 [DISASM] Starting kickstart initialization disassembly...');
        
        // Get ROM reset vectors
        const resetVectors = this.memory.romResetVectors;
        if (!resetVectors) {
            throw new Error('ROM reset vectors not available - load ROM first');
        }

        // Handle both string and number formats for programCounter
        let startPC;
        if (typeof resetVectors.programCounter === 'string') {
            // If it's a hex string like "0xF800D2"
            startPC = parseInt(resetVectors.programCounter, 16);
        } else {
            // If it's already a number (decimal), use it directly
            startPC = resetVectors.programCounter;
        }
        
        console.log(`🔍 [DISASM] Reset vectors:`, resetVectors);
        console.log(`🔍 [DISASM] Parsed startPC: 0x${startPC.toString(16)} (from ${resetVectors.programCounter})`);
        
        console.log(`🎯 [DISASM] Disassembling from PC: 0x${startPC.toString(16)}`);
        
        // Save current CPU state
        const savedState = this.saveCPUState();
        
        try {
            // Set up CPU for disassembly (don't actually execute)
            this.setupCPUForDisassembly(startPC);
            
            // Disassemble until we hit termination conditions
            let currentPC = startPC;
            console.log(`🔍 [DISASM] Starting disassembly loop at PC: 0x${currentPC.toString(16)}`);
            let instructionCount = 0;
            const maxInstructions = 1000; // Safety limit
            
            while (instructionCount < maxInstructions) {
                const instruction = this.disassembleInstructionAtPC(currentPC);
                
                if (!instruction) {
                    console.log('⚠️ [DISASM] Failed to disassemble instruction, creating fallback and continuing');
                    // Create a fallback instruction instead of stopping
                    const opcode = this.memory.readWord(currentPC);
                    const fallbackInstruction = {
                        address: currentPC,
                        opcode: opcode,
                        bytes: [opcode >> 8, opcode & 0xFF],
                        mnemonic: `DC.W $${opcode.toString(16).padStart(4, '0').toUpperCase()}`,
                        operands: '',
                        fullInstruction: `DC.W $${opcode.toString(16).padStart(4, '0').toUpperCase()}`,
                        size: 2,
                        description: 'Unknown instruction - raw data',
                        index: instructionCount,
                        cycles: 4
                    };
                    this.initializationSequence.push(fallbackInstruction);
                    currentPC += 2; // Assume 2-byte instruction
                    instructionCount++;
                    continue;
                }
                
                // Check for invalid instruction size (would cause infinite loop)
                if (instruction.size <= 0) {
                    console.log(`❌ [DISASM] Invalid instruction size ${instruction.size}, forcing to 2 bytes`);
                    instruction.size = 2;
                }
                
                this.initializationSequence.push({
                    address: currentPC,
                    opcode: instruction.opcode,
                    bytes: instruction.bytes,
                    mnemonic: instruction.asm || instruction.instruction,
                    operands: instruction.operands || '',
                    fullInstruction: instruction.asm || instruction.instruction,
                    size: instruction.size,
                    description: instruction.description || 'No description',
                    index: instructionCount,
                    cycles: instruction.cycles || 4
                });
                
                // Check for end conditions (temporarily disabled for debugging)
                if (instructionCount >= 50) { // Stop after 50 instructions for testing
                    console.log(`🏁 [DISASM] Stopping after ${instructionCount} instructions for debugging`);
                    break;
                }
                
                // if (this.isEndOfInitialization(instruction, currentPC)) {
                //     console.log(`🏁 [DISASM] End of initialization detected at PC: 0x${currentPC.toString(16)}`);
                //     break;
                // }
                
                console.log(`🔍 [DISASM] Moving PC from 0x${currentPC.toString(16)} to 0x${(currentPC + instruction.size).toString(16)} (size: ${instruction.size})`);
                currentPC += instruction.size;
                instructionCount++;
                console.log(`🔍 [DISASM] Instruction ${instructionCount} completed, next PC: 0x${currentPC.toString(16)}`);
            }
            
        } finally {
            // Restore CPU state
            this.restoreCPUState(savedState);
        }
        
        console.log(`✅ [DISASM] Disassembled ${this.initializationSequence.length} instructions`);
        this.logDisassemblyToConsole();
        
        return {
            sequence: this.initializationSequence,
            startAddress: startPC,
            totalInstructions: this.initializationSequence.length,
            checksum: this.calculateSequenceChecksum()
        };
    }

    /**
     * Leverage CPU's existing instruction decoding without execution
     */
    disassembleInstructionAtPC(address) {
        try {
            const opcode = this.memory.readWord(address);
            console.log(`🔍 [DISASM] Disassembling at 0x${address.toString(16)}: opcode 0x${opcode.toString(16)}`);
            
            // Save current CPU PC
            const savedPC = this.cpu.registers.pc;
            
            // Temporarily set CPU PC to the address we want to disassemble
            this.cpu.registers.pc = address;
            
            // Use CPU's existing peekNextInstruction or decodeInstructionName
            const cpuDecoded = this.cpu.peekNextInstruction ? 
                this.cpu.peekNextInstruction() : 
                this.cpu.decodeInstructionName(opcode);
            
            // Restore CPU PC
            this.cpu.registers.pc = savedPC;
            
            console.log(`🔍 [DISASM] CPU decoded:`, cpuDecoded);
            
            // Calculate instruction size by analyzing opcode patterns
            const size = this.calculateInstructionSize(opcode, address);
            console.log(`🔍 [DISASM] Calculated size: ${size} bytes`);
            
            // Get raw bytes for the instruction
            const bytes = this.getInstructionBytes(address, size);
            
            // Enhance with additional analysis
            const enhanced = this.enhanceInstructionInfo(opcode, address, cpuDecoded);
            
            const result = {
                opcode: opcode,
                bytes: bytes,
                instruction: enhanced.instruction,
                asm: enhanced.asm,
                description: enhanced.description,
                size: size,
                cycles: enhanced.cycles || 4,
                operands: enhanced.operands || ''
            };
            
            console.log(`🔍 [DISASM] Final instruction:`, result);
            
            return result;
            
        } catch (error) {
            console.error(`❌ [DISASM] Error disassembling at 0x${address.toString(16)}: ${error.message}`);
            return null;
        }
    }

    /**
     * Calculate instruction size by analyzing opcode patterns
     * This leverages 68k architecture knowledge without duplicating CPU logic
     */
    calculateInstructionSize(opcode, address) {
        // Check if CPU has a handler for this opcode
        const handler = this.cpu.opcodeTable.get(opcode);
        
        if (!handler) {
            return 2; // Unknown opcodes are 1 word
        }
        
        // Use CPU's built-in size calculation if available
        if (this.cpu.getInstructionSize) {
            return this.cpu.getInstructionSize(opcode);
        }
        
        // Fallback: analyze common patterns
        return this.analyzeInstructionSize(opcode, address);
    }

    /**
     * Analyze instruction size based on 68k addressing modes
     */
    analyzeInstructionSize(opcode, address) {
        const high4 = (opcode >> 12) & 0xF;
        
        // MOVE instructions - variable size based on addressing modes
        if (high4 >= 1 && high4 <= 3) {
            let size = 2; // Base instruction
            
            // Check source addressing mode
            const srcMode = (opcode >> 3) & 0x7;
            const srcReg = opcode & 0x7;
            size += this.getAddressingModeSize(srcMode, srcReg);
            
            // Check destination addressing mode  
            const dstMode = (opcode >> 6) & 0x7;
            const dstReg = (opcode >> 9) & 0x7;
            size += this.getAddressingModeSize(dstMode, dstReg);
            
            return size;
        }
        
        // LEA instructions
        if ((opcode & 0xF1C0) === 0x41C0) {
            const mode = (opcode >> 3) & 0x7;
            const reg = opcode & 0x7;
            return 2 + this.getAddressingModeSize(mode, reg);
        }
        
        // JSR instructions
        if ((opcode & 0xFFC0) === 0x4E80) {
            const mode = (opcode >> 3) & 0x7;
            const reg = opcode & 0x7;
            return 2 + this.getAddressingModeSize(mode, reg);
        }
        
        // JMP instructions
        if ((opcode & 0xFFC0) === 0x4EC0) {
            const mode = (opcode >> 3) & 0x7;
            const reg = opcode & 0x7;
            return 2 + this.getAddressingModeSize(mode, reg);
        }
        
        // Immediate data instructions
        if ((opcode & 0xFF00) === 0x0C00) { // CMPI
            const size = ((opcode >> 6) & 3);
            return size === 0 ? 4 : (size === 1 ? 4 : 6); // byte/word = 4, long = 6
        }
        
        // Branch instructions with displacement
        if ((opcode & 0xF000) === 0x6000) {
            const displacement = opcode & 0xFF;
            return displacement === 0 ? 4 : 2; // 0 = word displacement, else byte
        }
        
        // Default: most instructions are 2 bytes
        return 2;
    }

    /**
     * Get additional bytes required for addressing mode
     */
    getAddressingModeSize(mode, reg) {
        switch (mode) {
            case 0: // Dn
            case 1: // An  
            case 2: // (An)
            case 3: // (An)+
            case 4: // -(An)
                return 0;
            
            case 5: // d16(An)
                return 2;
            
            case 6: // d8(An,Xn)
                return 2;
            
            case 7: // Special modes
                switch (reg) {
                    case 0: return 2; // abs.W
                    case 1: return 4; // abs.L
                    case 2: return 2; // d16(PC)
                    case 3: return 2; // d8(PC,Xn)
                    case 4: return 2; // #immediate (word)
                    default: return 0;
                }
            
            default:
                return 0;
        }
    }

    /**
     * Enhance instruction info using CPU knowledge
     */
    enhanceInstructionInfo(opcode, address, cpuDecoded) {
        // Start with CPU's decoded information
        let enhanced = {
            instruction: cpuDecoded.name || cpuDecoded.instruction || `UNK_${opcode.toString(16)}`,
            asm: cpuDecoded.asm || cpuDecoded.name || cpuDecoded.instruction || `DC.W $${opcode.toString(16)}`,
            description: cpuDecoded.description || 'Unknown instruction',
            cycles: 4
        };
        
        // Add kickstart-specific context
        enhanced.description = this.addKickstartContext(opcode, address, enhanced.description);
        
        // Estimate cycles based on instruction type
        enhanced.cycles = this.estimateInstructionCycles(opcode);
        
        return enhanced;
    }

    /**
     * Add kickstart-specific context to descriptions
     */
    addKickstartContext(opcode, address, baseDescription) {
        // Identify common kickstart patterns
        if ((opcode & 0xFFC0) === 0x4E80) { // JSR
            return baseDescription + ' (Potential library call or subroutine)';
        }
        
        if ((opcode & 0xF1C0) === 0x41C0) { // LEA
            return baseDescription + ' (Load system address or pointer)';
        }
        
        if ((opcode & 0xF000) === 0x2000 || (opcode & 0xF000) === 0x3000) { // MOVE.L/MOVE.W
            return baseDescription + ' (System data movement)';
        }
        
        if (opcode === 0x4E75) { // RTS
            return baseDescription + ' (Return from system routine)';
        }
        
        return baseDescription;
    }

    /**
     * Estimate instruction cycles based on opcode patterns
     */
    estimateInstructionCycles(opcode) {
        const high4 = (opcode >> 12) & 0xF;
        
        // MOVE instructions
        if (high4 >= 1 && high4 <= 3) {
            return 8; // Typical MOVE cycles
        }
        
        // Branch/Jump instructions
        if ((opcode & 0xF000) === 0x6000 || (opcode & 0xFFC0) === 0x4EC0) {
            return 10; // Branch/jump overhead
        }
        
        // JSR
        if ((opcode & 0xFFC0) === 0x4E80) {
            return 18; // JSR with stack operations
        }
        
        // RTS
        if (opcode === 0x4E75) {
            return 16; // RTS with stack operations
        }
        
        // LEA
        if ((opcode & 0xF1C0) === 0x41C0) {
            return 8; // LEA address calculation
        }
        
        return 4; // Default cycles
    }

    /**
     * Save current CPU state for restoration after disassembly
     */
    saveCPUState() {
        return {
            pc: this.cpu.registers.pc,
            running: this.cpu.running,
            // Save any other relevant state
        };
    }

    /**
     * Setup CPU for disassembly mode
     */
    setupCPUForDisassembly(startPC) {
        // Don't change CPU state - we're just reading memory and using CPU logic
        // This is safe because we're not executing instructions
    }

    /**
     * Restore CPU state after disassembly
     */
    restoreCPUState(savedState) {
        this.cpu.registers.pc = savedState.pc;
        this.cpu.running = savedState.running;
    }

    /**
     * Get raw bytes for instruction display
     */
    getInstructionBytes(address, size) {
        const bytes = [];
        for (let i = 0; i < size; i++) {
            bytes.push(this.memory.readByte(address + i));
        }
        return bytes;
    }

    /**
     * Determine end conditions for kickstart initialization
     */
    isEndOfInitialization(instruction, address) {
        console.log(`🔍 [DISASM] Checking end conditions for: ${instruction.asm || instruction.instruction} at 0x${address.toString(16)}`);
        
        // More conservative end conditions - let it run longer to get more instructions
        
        // Only stop on explicit infinite loops or obvious completion patterns
        if (instruction.asm && instruction.asm.includes('BRA') && instruction.asm.includes('*-')) {
            console.log(`🏁 [DISASM] End condition: Infinite loop (BRA *) found`);
            return true;
        }
        
        // Stop if we've gone way beyond kickstart ROM space
        if (address > 0xFF0000) { // Much higher limit
            console.log(`🏁 [DISASM] End condition: Way beyond kickstart range (0x${address.toString(16)})`);
            return true;
        }
        
        // Stop if we encounter a HALT instruction
        if (instruction.asm && (instruction.asm.includes('HALT') || instruction.asm.includes('STOP'))) {
            console.log(`🏁 [DISASM] End condition: HALT/STOP instruction found`);
            return true;
        }
        
        console.log(`🔍 [DISASM] No end condition met, continuing...`);
        return false;
    }

    /**
     * Generate checksum for instruction sequence validation
     */
    calculateSequenceChecksum() {
        let checksum = 0;
        for (const instr of this.initializationSequence) {
            checksum ^= instr.opcode;
            checksum = (checksum << 1) | (checksum >> 31); // Rotate left
        }
        return checksum >>> 0; // Ensure unsigned 32-bit
    }

    /**
     * Log complete disassembly to console (leveraging CPU's formatting)
     */
    logDisassemblyToConsole() {
        console.log('\n🔍 === KICKSTART INITIALIZATION DISASSEMBLY ===');
        console.log('📋 Complete ASM code sequence (using CPU opcode parsing):');
        console.log('═'.repeat(80));
        
        this.initializationSequence.forEach((instr, index) => {
            const addrStr = `0x${instr.address.toString(16).toUpperCase().padStart(8, '0')}`;
            const bytesStr = instr.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
            const indexStr = `[${index.toString().padStart(3, '0')}]`;
            const cyclesStr = `(${instr.cycles}c)`;
            
            console.log(`${indexStr} ${addrStr}: ${bytesStr.padEnd(12)} ${instr.fullInstruction.padEnd(25)} ${cyclesStr.padEnd(6)} ; ${instr.description}`);
        });
        
        console.log('═'.repeat(80));
        console.log(`✅ Total: ${this.initializationSequence.length} instructions disassembled`);
        
        // Summary statistics
        const totalCycles = this.initializationSequence.reduce((sum, instr) => sum + instr.cycles, 0);
        console.log(`⏱️ Estimated cycles: ${totalCycles} (${(totalCycles / 14).toFixed(1)}ms at 14MHz)`);
    }

    /**
     * Validate current execution against disassembly checklist
     * This now leverages the CPU's own execution results
     */
    validateExecutionStep(currentPC, executedOpcode, cpuResult) {
        const expectedInstruction = this.initializationSequence[this.currentInstructionIndex];
        
        if (!expectedInstruction) {
            this.errors.push({
                type: 'SEQUENCE_OVERFLOW',
                message: `Execution beyond disassembled sequence at instruction ${this.currentInstructionIndex}`,
                currentPC: currentPC,
                executedOpcode: executedOpcode
            });
            return { valid: false, error: 'Execution beyond expected sequence' };
        }

        // Validate PC matches expected address
        if (currentPC !== expectedInstruction.address) {
            this.errors.push({
                type: 'PC_MISMATCH',
                message: `PC mismatch: expected 0x${expectedInstruction.address.toString(16)}, got 0x${currentPC.toString(16)}`,
                expected: expectedInstruction,
                actual: { pc: currentPC, opcode: executedOpcode }
            });
            return { valid: false, error: 'PC address mismatch' };
        }

        // Validate opcode matches expected instruction
        if (executedOpcode !== expectedInstruction.opcode) {
            this.errors.push({
                type: 'OPCODE_MISMATCH',
                message: `Opcode mismatch at 0x${currentPC.toString(16)}: expected 0x${expectedInstruction.opcode.toString(16)}, got 0x${executedOpcode.toString(16)}`,
                expected: expectedInstruction,
                actual: { pc: currentPC, opcode: executedOpcode }
            });
            return { valid: false, error: 'Opcode mismatch' };
        }

        // Additional validation: check if CPU's decoded instruction matches our disassembly
        if (cpuResult && cpuResult.asm && expectedInstruction.mnemonic) {
            const normalizedCPU = cpuResult.asm.replace(/\s+/g, ' ').trim();
            const normalizedExpected = expectedInstruction.mnemonic.replace(/\s+/g, ' ').trim();
            
            if (normalizedCPU !== normalizedExpected) {
                console.log(`⚠️ [VALIDATE] Instruction format mismatch (non-critical):`);
                console.log(`  Expected: ${normalizedExpected}`);
                console.log(`  CPU gave: ${normalizedCPU}`);
                // This is non-critical - continue execution
            }
        }

        // Validation passed
        console.log(`✅ [VALIDATE] Step ${this.currentInstructionIndex}: 0x${currentPC.toString(16)} → ${expectedInstruction.fullInstruction} (${expectedInstruction.cycles}c)`);
        this.currentInstructionIndex++;
        
        return { 
            valid: true, 
            instruction: expectedInstruction,
            progress: {
                current: this.currentInstructionIndex,
                total: this.initializationSequence.length,
                percentage: Math.round((this.currentInstructionIndex / this.initializationSequence.length) * 100)
            }
        };
    }

    /**
     * Reset validation state for new execution
     */
    resetValidation() {
        this.currentInstructionIndex = 0;
        this.errors = [];
        console.log('🔄 [VALIDATE] Validation state reset');
    }

    /**
     * Get current validation status
     */
    getValidationStatus() {
        return {
            currentIndex: this.currentInstructionIndex,
            totalInstructions: this.initializationSequence.length,
            errorsCount: this.errors.length,
            errors: this.errors,
            isComplete: this.currentInstructionIndex >= this.initializationSequence.length,
            progress: this.initializationSequence.length > 0 ? 
                Math.round((this.currentInstructionIndex / this.initializationSequence.length) * 100) : 0
        };
    }

    /**
     * Get disassembly for frontend display
     */
    getDisassemblyForFrontend() {
        return {
            instructions: this.initializationSequence.map(instr => ({
                index: instr.index,
                address: `0x${instr.address.toString(16).toUpperCase()}`,
                bytes: instr.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' '),
                instruction: instr.fullInstruction,
                description: instr.description,
                cycles: instr.cycles,
                executed: instr.index < this.currentInstructionIndex,
                current: instr.index === this.currentInstructionIndex
            })),
            progress: this.getValidationStatus()
        };
    }
}

module.exports = KickstartDisassembler;