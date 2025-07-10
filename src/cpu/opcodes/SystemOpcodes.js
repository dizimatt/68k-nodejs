// src/cpu/opcodes/SystemOpcodes.js - System Operations (ENHANCED WITH LEA VARIANTS)

const SystemOpcodes = {
    setup(opcodeTable, cpu) {
        console.log('🔧 [CPU] Setting up system opcodes...');
        
        // JSR (An) - Jump to Subroutine
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4E90 | reg;
            opcodeTable[opcode] = () => this.op_jsr_a.call(cpu, reg);
        }
        
        // JSR absolute.W
        opcodeTable[0x4EB8] = () => this.op_jsr_aw.call(cpu);
        
        // JSR absolute.L
        opcodeTable[0x4EB9] = () => this.op_jsr_al.call(cpu);
        
        // LEA (An),Am - Load Effective Address (register indirect)
        for (let srcReg = 0; srcReg < 8; srcReg++) {
            for (let dstReg = 0; dstReg < 8; dstReg++) {
                const opcode = 0x41D0 | (dstReg << 9) | srcReg;
                opcodeTable[opcode] = () => this.op_lea_a_a.call(cpu, srcReg, dstReg);
            }
        }
        
        // LEA (d16,An),Am - Load Effective Address with displacement
        for (let srcReg = 0; srcReg < 8; srcReg++) {
            for (let dstReg = 0; dstReg < 8; dstReg++) {
                const opcode = 0x41E8 | (dstReg << 9) | srcReg;
                opcodeTable[opcode] = () => this.op_lea_d16_a_a.call(cpu, srcReg, dstReg);
            }
        }
        
        // LEA (d16,PC),An - Load Effective Address PC-relative *** THIS IS YOUR MISSING OPCODE ***
        for (let dstReg = 0; dstReg < 8; dstReg++) {
            const opcode = 0x41FA | (dstReg << 9);
            opcodeTable[opcode] = () => this.op_lea_d16_pc_a.call(cpu, dstReg);
        }
        
        // LEA (d8,An,Xn),Am - Load Effective Address with index
        for (let srcReg = 0; srcReg < 8; srcReg++) {
            for (let dstReg = 0; dstReg < 8; dstReg++) {
                const opcode = 0x41F0 | (dstReg << 9) | srcReg;
                opcodeTable[opcode] = () => this.op_lea_d8_a_x_a.call(cpu, srcReg, dstReg);
            }
        }
        
        // LEA (d8,PC,Xn),An - Load Effective Address PC-relative with index
        for (let dstReg = 0; dstReg < 8; dstReg++) {
            const opcode = 0x41FB | (dstReg << 9);
            opcodeTable[opcode] = () => this.op_lea_d8_pc_x_a.call(cpu, dstReg);
        }
        
        // LEA (xxx).W,An - Load Effective Address absolute word
        for (let dstReg = 0; dstReg < 8; dstReg++) {
            const opcode = 0x41F8 | (dstReg << 9);
            opcodeTable[opcode] = () => this.op_lea_aw_a.call(cpu, dstReg);
        }
        
        // LEA (xxx).L,An - Load Effective Address absolute long
        for (let dstReg = 0; dstReg < 8; dstReg++) {
            const opcode = 0x41F9 | (dstReg << 9);
            opcodeTable[opcode] = () => this.op_lea_al_a.call(cpu, dstReg);
        }
        
        // PEA (An) - Push Effective Address
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4850 | reg;
            opcodeTable[opcode] = () => this.op_pea_a.call(cpu, reg);
        }
        
        // PEA (d16,PC) - Push Effective Address PC-relative
        opcodeTable[0x487A] = () => this.op_pea_d16_pc.call(cpu);
        
        // TRAP #vector
        for (let vector = 0; vector < 16; vector++) {
            const opcode = 0x4E40 | vector;
            opcodeTable[opcode] = () => this.op_trap.call(cpu, vector);
        }
        
        console.log('✅ [CPU] System opcodes setup complete');
    },
    
    // System opcode implementations
    op_jsr_a(reg) {
        const pc = this.registers.pc - 2;
        const target = this.registers.a[reg];
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: JSR (A${reg})               ; Jump to subroutine via address register`);
        console.log(`       → Target: 0x${target.toString(16).padStart(8, '0')}`);
        
        this.pushLong(this.registers.pc);
        this.registers.pc = target >>> 0;
        this.cycles += 16;
        return { 
            name: `JSR (A${reg})`, 
            cycles: 16,
            asm: `JSR (A${reg})`,
            description: 'Jump to subroutine via address register',
            pc: pc,
            target: target
        };
    },
    
    op_jsr_aw() {
        const pc = this.registers.pc - 2;
        const target = this.fetchWord();
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: JSR $${target.toString(16).padStart(4, '0')}               ; Jump to subroutine absolute word`);
        console.log(`       → Target: 0x${target.toString(16).padStart(4, '0')}`);
        
        this.pushLong(this.registers.pc);
        this.registers.pc = target >>> 0;
        this.cycles += 18;
        return { 
            name: `JSR $${target.toString(16)}`, 
            cycles: 18,
            asm: `JSR $${target.toString(16).padStart(4, '0')}`,
            description: 'Jump to subroutine absolute word',
            pc: pc,
            target: target
        };
    },
    
    op_jsr_al() {
        const pc = this.registers.pc - 2;
        const target = this.fetchLong();
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: JSR $${target.toString(16).padStart(8, '0')}           ; Jump to subroutine absolute long`);
        console.log(`       → Target: 0x${target.toString(16).padStart(8, '0')}`);
        
        this.pushLong(this.registers.pc);
        this.registers.pc = target >>> 0;
        this.cycles += 20;
        return { 
            name: `JSR $${target.toString(16)}`, 
            cycles: 20,
            asm: `JSR $${target.toString(16).padStart(8, '0')}`,
            description: 'Jump to subroutine absolute long',
            pc: pc,
            target: target
        };
    },
    
    op_lea_a_a(srcReg, dstReg) {
        const pc = this.registers.pc - 2;
        const address = this.registers.a[srcReg];
        const oldValue = this.registers.a[dstReg];
        
        this.registers.a[dstReg] = address;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: LEA (A${srcReg}),A${dstReg}            ; Load effective address`);
        console.log(`       → A${dstReg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${address.toString(16).padStart(8, '0')}`);
        
        this.cycles += 4;
        return { 
            name: `LEA (A${srcReg}),A${dstReg}`, 
            cycles: 4,
            asm: `LEA (A${srcReg}),A${dstReg}`,
            description: 'Load effective address from address register',
            pc: pc,
            oldValue: oldValue,
            newValue: address
        };
    },
    
    op_lea_d16_a_a(srcReg, dstReg) {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        const address = (this.registers.a[srcReg] + signedDisp) >>> 0;
        const oldValue = this.registers.a[dstReg];
        
        this.registers.a[dstReg] = address;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: LEA (${signedDisp},A${srcReg}),A${dstReg}        ; Load effective address with displacement`);
        console.log(`       → A${dstReg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${address.toString(16).padStart(8, '0')}`);
        
        this.cycles += 8;
        return { 
            name: `LEA (${signedDisp},A${srcReg}),A${dstReg}`, 
            cycles: 8,
            asm: `LEA (${signedDisp},A${srcReg}),A${dstReg}`,
            description: 'Load effective address with displacement',
            pc: pc,
            oldValue: oldValue,
            newValue: address
        };
    },
    
    // *** THE MISSING OPCODE 0x43FA ***
    op_lea_d16_pc_a(dstReg) {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        const address = (pc + 2 + signedDisp) >>> 0;  // PC + 2 + displacement
        const oldValue = this.registers.a[dstReg];
        
        this.registers.a[dstReg] = address;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: LEA (${signedDisp},PC),A${dstReg}        ; Load effective address PC-relative`);
        console.log(`       → A${dstReg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${address.toString(16).padStart(8, '0')}`);
        console.log(`       → Calculated: PC(0x${pc.toString(16)}) + 2 + ${signedDisp} = 0x${address.toString(16)}`);
        
        this.cycles += 8;
        return { 
            name: `LEA (${signedDisp},PC),A${dstReg}`, 
            cycles: 8,
            asm: `LEA (${signedDisp},PC),A${dstReg}`,
            description: 'Load effective address PC-relative',
            pc: pc,
            oldValue: oldValue,
            newValue: address,
            immediate: displacement
        };
    },
    
    op_lea_d8_a_x_a(srcReg, dstReg) {
        const pc = this.registers.pc - 2;
        const extension = this.fetchWord();
        const displacement = (extension & 0x80) ? (extension | 0xFFFFFF00) : (extension & 0xFF);
        const indexReg = (extension >> 12) & 7;
        const indexType = (extension >> 11) & 1; // 0=data, 1=address
        const indexSize = (extension >> 11) & 1; // 0=word, 1=long
        
        let indexValue = indexType ? this.registers.a[indexReg] : this.registers.d[indexReg];
        if (!indexSize) indexValue = (indexValue & 0x8000) ? (indexValue | 0xFFFF0000) : (indexValue & 0xFFFF);
        
        const address = (this.registers.a[srcReg] + displacement + indexValue) >>> 0;
        const oldValue = this.registers.a[dstReg];
        
        this.registers.a[dstReg] = address;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: LEA (${displacement},A${srcReg},${indexType ? 'A' : 'D'}${indexReg}),A${dstReg}  ; Load effective address with index`);
        console.log(`       → A${dstReg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${address.toString(16).padStart(8, '0')}`);
        
        this.cycles += 12;
        return { 
            name: `LEA (${displacement},A${srcReg},${indexType ? 'A' : 'D'}${indexReg}),A${dstReg}`, 
            cycles: 12,
            asm: `LEA (${displacement},A${srcReg},${indexType ? 'A' : 'D'}${indexReg}),A${dstReg}`,
            description: 'Load effective address with index',
            pc: pc,
            oldValue: oldValue,
            newValue: address
        };
    },
    
    op_lea_d8_pc_x_a(dstReg) {
        const pc = this.registers.pc - 2;
        const extension = this.fetchWord();
        const displacement = (extension & 0x80) ? (extension | 0xFFFFFF00) : (extension & 0xFF);
        const indexReg = (extension >> 12) & 7;
        const indexType = (extension >> 11) & 1;
        const indexSize = (extension >> 11) & 1;
        
        let indexValue = indexType ? this.registers.a[indexReg] : this.registers.d[indexReg];
        if (!indexSize) indexValue = (indexValue & 0x8000) ? (indexValue | 0xFFFF0000) : (indexValue & 0xFFFF);
        
        const address = (pc + 2 + displacement + indexValue) >>> 0;
        const oldValue = this.registers.a[dstReg];
        
        this.registers.a[dstReg] = address;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: LEA (${displacement},PC,${indexType ? 'A' : 'D'}${indexReg}),A${dstReg} ; Load effective address PC-relative with index`);
        console.log(`       → A${dstReg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${address.toString(16).padStart(8, '0')}`);
        
        this.cycles += 12;
        return { 
            name: `LEA (${displacement},PC,${indexType ? 'A' : 'D'}${indexReg}),A${dstReg}`, 
            cycles: 12,
            asm: `LEA (${displacement},PC,${indexType ? 'A' : 'D'}${indexReg}),A${dstReg}`,
            description: 'Load effective address PC-relative with index',
            pc: pc,
            oldValue: oldValue,
            newValue: address
        };
    },
    
    op_lea_aw_a(dstReg) {
        const pc = this.registers.pc - 2;
        const address = this.fetchWord();
        const oldValue = this.registers.a[dstReg];
        
        this.registers.a[dstReg] = address;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: LEA $${address.toString(16).padStart(4, '0')},A${dstReg}           ; Load effective address absolute word`);
        console.log(`       → A${dstReg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${address.toString(16).padStart(8, '0')}`);
        
        this.cycles += 8;
        return { 
            name: `LEA $${address.toString(16)},A${dstReg}`, 
            cycles: 8,
            asm: `LEA $${address.toString(16).padStart(4, '0')},A${dstReg}`,
            description: 'Load effective address absolute word',
            pc: pc,
            oldValue: oldValue,
            newValue: address
        };
    },
    
    op_lea_al_a(dstReg) {
        const pc = this.registers.pc - 2;
        const address = this.fetchLong();
        const oldValue = this.registers.a[dstReg];
        
        this.registers.a[dstReg] = address;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: LEA $${address.toString(16).padStart(8, '0')},A${dstReg}       ; Load effective address absolute long`);
        console.log(`       → A${dstReg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${address.toString(16).padStart(8, '0')}`);
        
        this.cycles += 12;
        return { 
            name: `LEA $${address.toString(16)},A${dstReg}`, 
            cycles: 12,
            asm: `LEA $${address.toString(16).padStart(8, '0')},A${dstReg}`,
            description: 'Load effective address absolute long',
            pc: pc,
            oldValue: oldValue,
            newValue: address
        };
    },
    
    op_pea_a(reg) {
        const pc = this.registers.pc - 2;
        const address = this.registers.a[reg];
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: PEA (A${reg})               ; Push effective address`);
        console.log(`       → Pushed: 0x${address.toString(16).padStart(8, '0')}`);
        
        this.pushLong(address);
        this.cycles += 12;
        return { 
            name: `PEA (A${reg})`, 
            cycles: 12,
            asm: `PEA (A${reg})`,
            description: 'Push effective address',
            pc: pc,
            target: address
        };
    },
    
    op_pea_d16_pc() {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        const address = (pc + 2 + signedDisp) >>> 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: PEA (${signedDisp},PC)          ; Push effective address PC-relative`);
        console.log(`       → Pushed: 0x${address.toString(16).padStart(8, '0')}`);
        
        this.pushLong(address);
        this.cycles += 16;
        return { 
            name: `PEA (${signedDisp},PC)`, 
            cycles: 16,
            asm: `PEA (${signedDisp},PC)`,
            description: 'Push effective address PC-relative',
            pc: pc,
            target: address
        };
    },
    
    op_trap(vector) {
        const pc = this.registers.pc - 2;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: TRAP #${vector}               ; System call trap`);
        console.log(`       → Vector: ${vector}`);
        
        // In a full implementation, this would vector to trap handlers
        // For now, we'll just log it and continue
        this.cycles += 34;
        return { 
            name: `TRAP #${vector}`, 
            cycles: 34,
            asm: `TRAP #${vector}`,
            description: 'System call trap',
            pc: pc,
            immediate: vector
        };
    }
};

module.exports = { SystemOpcodes };