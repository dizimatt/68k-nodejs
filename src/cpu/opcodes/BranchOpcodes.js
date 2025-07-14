// src/cpu/opcodes/BranchOpcodes.js - Branch Operations

const BranchOpcodes = {
    setup(opcodeTable, cpu) {
        console.log('🔧 [CPU] Setting up branch opcodes...');
        
        // Branch instructions (6000-6FFF)
        for (let condition = 0; condition < 16; condition++) {
            for (let displacement = 0; displacement < 256; displacement++) {
                const opcode = 0x6000 | (condition << 8) | displacement;
                opcodeTable[opcode] = () => this.op_bcc_8.call(cpu, condition, displacement);
            }
        }
        
        // BSR - Branch to Subroutine (special case of condition 1)
        for (let displacement = 0; displacement < 256; displacement++) {
            const opcode = 0x6100 | displacement;
            opcodeTable[opcode] = () => this.op_bsr_8.call(cpu, displacement);
        }
        
        // JMP absolute.L (4EF9)
        opcodeTable[0x4EF9] = () => this.op_jmp_absolute_l.call(cpu);
        
        // DBcc instructions (51C8-51CF for DBF/DBRA, etc.)
        for (let condition = 0; condition < 16; condition++) {
            for (let reg = 0; reg < 8; reg++) {
                const opcode = 0x50C8 | (condition << 8) | reg;
                opcodeTable[opcode] = () => this.op_dbcc.call(cpu, condition, reg);
            }
        }
        
        console.log('✅ [CPU] Branch opcodes setup complete (including JMP and DBcc)');
    },
    
    // Branch opcode implementations
    op_bcc_8(condition, displacement) {
        let offset = displacement;
        if (offset === 0) {
            offset = this.fetchWord();
            if (offset & 0x8000) offset |= 0xFFFF0000;
        } else {
            if (offset & 0x80) offset |= 0xFFFFFF00;
        }
        
        const conditionMet = this.testCondition(condition);
        
        if (conditionMet) {
            this.registers.pc = (this.registers.pc + offset) >>> 0;
            this.cycles += 10;
        } else {
            this.cycles += 8;
        }
        
        return { 
            name: `B${this.getConditionName(condition)} $${offset.toString(16)}`, 
            cycles: conditionMet ? 10 : 8,
            taken: conditionMet 
        };
    },
    
    op_bsr_8(displacement) {
        let offset = displacement;
        if (offset === 0) {
            offset = this.fetchWord();
            if (offset & 0x8000) offset |= 0xFFFF0000;
        } else {
            if (offset & 0x80) offset |= 0xFFFFFF00;
        }
        
        // Push return address
        this.pushLong(this.registers.pc);
        
        // Branch to target
        this.registers.pc = (this.registers.pc + offset) >>> 0;
        this.cycles += 18;
        
        return { 
            name: `BSR $${offset.toString(16)}`, 
            cycles: 18
        };
    },
    
    op_jmp_absolute_l() {
        // JMP absolute.L - Jump to absolute long address
        // Opcode: 4EF9 - followed by 32-bit absolute address
        
        // Fetch the 32-bit target address
        const targetAddress = this.fetchLong();
        
        // Jump to the target address
        this.registers.pc = targetAddress;
        this.cycles += 12; // JMP absolute.L takes 12 cycles
        
        return {
            name: `JMP $${targetAddress.toString(16).padStart(8, '0')}`,
            cycles: 12,
            target: targetAddress
        };
    },
    
    // DBcc - Decrement and Branch on Condition
    op_dbcc(condition, reg) {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        
        // Check condition first (if condition is true, don't loop)
        const conditionMet = this.testCondition(condition);
        
        if (!conditionMet) {
            // Condition false, decrement register and check for loop
            const oldValue = this.registers.d[reg] & 0xFFFF;
            const newValue = ((oldValue - 1) & 0xFFFF);
            this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | newValue;
            
            if (newValue !== 0xFFFF) {
                // Not -1, branch back
                this.registers.pc = (this.registers.pc + signedDisp) >>> 0;
                this.cycles += 12;
                
                console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DB${this.getConditionName(condition)} D${reg},*${signedDisp >= 0 ? '+' : ''}${signedDisp}    ; Branch taken (D${reg}=${newValue})`);
                
                return {
                    name: `DB${this.getConditionName(condition)} D${reg},*${signedDisp >= 0 ? '+' : ''}${signedDisp}`,
                    cycles: 12,
                    asm: `DB${this.getConditionName(condition)} D${reg},*${signedDisp >= 0 ? '+' : ''}${signedDisp}`,
                    description: 'Decrement and branch on condition - branch taken',
                    pc: pc,
                    oldValue: oldValue,
                    newValue: newValue,
                    displacement: signedDisp,
                    taken: true
                };
            } else {
                // Register is -1, exit loop
                this.cycles += 14;
                
                console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DB${this.getConditionName(condition)} D${reg},*${signedDisp >= 0 ? '+' : ''}${signedDisp}    ; Loop exit (D${reg}=65535)`);
                
                return {
                    name: `DB${this.getConditionName(condition)} D${reg},*${signedDisp >= 0 ? '+' : ''}${signedDisp}`,
                    cycles: 14,
                    asm: `DB${this.getConditionName(condition)} D${reg},*${signedDisp >= 0 ? '+' : ''}${signedDisp}`,
                    description: 'Decrement and branch on condition - loop exit',
                    pc: pc,
                    oldValue: oldValue,
                    newValue: newValue,
                    displacement: signedDisp,
                    taken: false
                };
            }
        } else {
            // Condition true, exit without decrementing
            this.cycles += 12;
            
            console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: DB${this.getConditionName(condition)} D${reg},*${signedDisp >= 0 ? '+' : ''}${signedDisp}    ; Condition true, no decrement`);
            
            return {
                name: `DB${this.getConditionName(condition)} D${reg},*${signedDisp >= 0 ? '+' : ''}${signedDisp}`,
                cycles: 12,
                asm: `DB${this.getConditionName(condition)} D${reg},*${signedDisp >= 0 ? '+' : ''}${signedDisp}`,
                description: 'Decrement and branch on condition - condition met',
                pc: pc,
                displacement: signedDisp,
                taken: false
            };
        }
    }
};

module.exports = { BranchOpcodes };