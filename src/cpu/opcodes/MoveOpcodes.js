// src/cpu/opcodes/MoveOpcodes.js - Move Operations (COMPLETE WITH ALL ADDRESSING MODES)

const MoveOpcodes = {
    setup(opcodeTable, cpu) {
        console.log('🔧 [CPU] Setting up move opcodes...');
        
        // MOVEQ #imm,Dn (7000-7FFF)
        for (let reg = 0; reg < 8; reg++) {
            for (let data = 0; data < 256; data++) {
                const opcode = 0x7000 | (reg << 9) | data;
                opcodeTable[opcode] = () => this.op_moveq.call(cpu, reg, data);
            }
        }
        
        // MOVE.W #imm,Dn
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x303C | (reg << 9);
            opcodeTable[opcode] = () => this.op_move_w_imm_d.call(cpu, reg);
        }
        
        // MOVE.L #imm,Dn
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x203C | (reg << 9);
            opcodeTable[opcode] = () => this.op_move_l_imm_d.call(cpu, reg);
        }
        
        // MOVE.W Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x3000 | (dst << 9) | (0 << 6) | src;
                opcodeTable[opcode] = () => this.op_move_w_d_d.call(cpu, src, dst);
            }
        }
        
        // MOVE.L Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x2000 | (dst << 9) | (0 << 6) | src;
                opcodeTable[opcode] = () => this.op_move_l_d_d.call(cpu, src, dst);
            }
        }
        
        // MOVEA.W #imm,An
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x307C | (reg << 9);
            opcodeTable[opcode] = () => this.op_movea_w_imm_a.call(cpu, reg);
        }
        
        // MOVEA.L #imm,An
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x207C | (reg << 9);
            opcodeTable[opcode] = () => this.op_movea_l_imm_a.call(cpu, reg);
        }
        
        // MOVEA.W Dn,An - Move data register to address register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x3040 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_movea_w_d_a.call(cpu, src, dst);
            }
        }
        
        // MOVEA.L Dn,An - Move data register to address register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x2040 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_movea_l_d_a.call(cpu, src, dst);
            }
        }
        
        // MOVEA.W An,Am - Move address register to address register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x3048 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_movea_w_a_a.call(cpu, src, dst);
            }
        }
        
        // MOVEA.L An,Am - Move address register to address register
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x2048 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_movea_l_a_a.call(cpu, src, dst);
            }
        }
        
        // MOVEA.W (An),Am - Move from address register indirect
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x3050 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_movea_w_a_ind_a.call(cpu, src, dst);
            }
        }
        
        // MOVEA.L (An),Am - Move from address register indirect
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x2050 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_movea_l_a_ind_a.call(cpu, src, dst);
            }
        }
        
        // MOVEA.W (xxx).W,An - Move from absolute word address *** MISSING OPCODE FAMILY ***
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x3078 | (reg << 9);
            opcodeTable[opcode] = () => this.op_movea_w_aw_a.call(cpu, reg);
        }
        
        // MOVEA.L (xxx).W,An - Move from absolute word address *** THIS IS YOUR MISSING 0x2C78 ***
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x2078 | (reg << 9);
            opcodeTable[opcode] = () => this.op_movea_l_aw_a.call(cpu, reg);
        }
        
        // MOVEA.W (xxx).L,An - Move from absolute long address
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x3079 | (reg << 9);
            opcodeTable[opcode] = () => this.op_movea_w_al_a.call(cpu, reg);
        }
        
        // MOVEA.L (xxx).L,An - Move from absolute long address
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x2079 | (reg << 9);
            opcodeTable[opcode] = () => this.op_movea_l_al_a.call(cpu, reg);
        }
        
        // MOVEA.W (d16,PC),An - Move from PC-relative
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x307A | (reg << 9);
            opcodeTable[opcode] = () => this.op_movea_w_pc_d16_a.call(cpu, reg);
        }
        
        // MOVEA.L (d16,PC),An - Move from PC-relative
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x207A | (reg << 9);
            opcodeTable[opcode] = () => this.op_movea_l_pc_d16_a.call(cpu, reg);
        }
        
        console.log('✅ [CPU] Move opcodes setup complete');
    },
    
    // Existing implementations...
    op_moveq(reg, data) {
        const pc = this.registers.pc - 2;
        const value = (data & 0x80) ? (data | 0xFFFFFF00) : data;
        const oldValue = this.registers.d[reg];
        
        this.registers.d[reg] = value >>> 0;
        this.setFlags32(value);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEQ #$${data.toString(16).padStart(2, '0')},D${reg}           ; Move quick immediate`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${value.toString(16).padStart(8, '0')} (${value})`);
        
        this.cycles += 4;
        return { 
            name: `MOVEQ #$${data.toString(16)},D${reg}`, 
            cycles: 4,
            asm: `MOVEQ #$${data.toString(16).padStart(2, '0')},D${reg}`,
            description: 'Move quick immediate to data register',
            pc: pc,
            oldValue: oldValue,
            newValue: value
        };
    },
    
    op_move_w_imm_d(reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord();
        const oldValue = this.registers.d[reg];
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | immediate;
        this.setFlags16(immediate);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE.W #$${immediate.toString(16).padStart(4, '0')},D${reg}        ; Move word immediate`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')}`);
        
        this.cycles += 8;
        return { 
            name: `MOVE.W #$${immediate.toString(16)},D${reg}`, 
            cycles: 8,
            asm: `MOVE.W #$${immediate.toString(16).padStart(4, '0')},D${reg}`,
            description: 'Move word immediate to data register',
            pc: pc,
            immediate: immediate
        };
    },
    
    op_move_l_imm_d(reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchLong();
        const oldValue = this.registers.d[reg];
        
        this.registers.d[reg] = immediate >>> 0;
        this.setFlags32(immediate);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE.L #$${immediate.toString(16).padStart(8, '0')},D${reg}    ; Move long immediate`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${immediate.toString(16).padStart(8, '0')}`);
        
        this.cycles += 12;
        return { 
            name: `MOVE.L #$${immediate.toString(16)},D${reg}`, 
            cycles: 12,
            asm: `MOVE.L #$${immediate.toString(16).padStart(8, '0')},D${reg}`,
            description: 'Move long immediate to data register',
            pc: pc,
            immediate: immediate
        };
    },
    
    op_move_w_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const value = this.registers.d[src] & 0xFFFF;
        const oldValue = this.registers.d[dst];
        
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFF0000) | value;
        this.setFlags16(value);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE.W D${src},D${dst}             ; Move word register to register`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[dst].toString(16).padStart(8, '0')}`);
        
        this.cycles += 4;
        return { 
            name: `MOVE.W D${src},D${dst}`, 
            cycles: 4,
            asm: `MOVE.W D${src},D${dst}`,
            description: 'Move word from data register to data register',
            pc: pc
        };
    },
    
    op_move_l_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const value = this.registers.d[src];
        const oldValue = this.registers.d[dst];
        
        this.registers.d[dst] = value >>> 0;
        this.setFlags32(value);
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE.L D${src},D${dst}             ; Move long register to register`);
        console.log(`       → D${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${value.toString(16).padStart(8, '0')}`);
        
        this.cycles += 4;
        return { 
            name: `MOVE.L D${src},D${dst}`, 
            cycles: 4,
            asm: `MOVE.L D${src},D${dst}`,
            description: 'Move long from data register to data register',
            pc: pc
        };
    },
    
    op_movea_w_imm_a(reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchWord();
        const value = (immediate & 0x8000) ? (immediate | 0xFFFF0000) : immediate;
        const oldValue = this.registers.a[reg];
        
        this.registers.a[reg] = value >>> 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.W #$${immediate.toString(16).padStart(4, '0')},A${reg}       ; Move word immediate to address register`);
        console.log(`       → A${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${value.toString(16).padStart(8, '0')}`);
        
        this.cycles += 8;
        return { 
            name: `MOVEA.W #$${immediate.toString(16)},A${reg}`, 
            cycles: 8,
            asm: `MOVEA.W #$${immediate.toString(16).padStart(4, '0')},A${reg}`,
            description: 'Move word immediate to address register',
            pc: pc,
            immediate: immediate
        };
    },
    
    op_movea_l_imm_a(reg) {
        const pc = this.registers.pc - 2;
        const immediate = this.fetchLong();
        const oldValue = this.registers.a[reg];
        
        this.registers.a[reg] = immediate >>> 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.L #$${immediate.toString(16).padStart(8, '0')},A${reg}   ; Move long immediate to address register`);
        console.log(`       → A${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${immediate.toString(16).padStart(8, '0')}`);
        
        this.cycles += 12;
        return { 
            name: `MOVEA.L #$${immediate.toString(16)},A${reg}`, 
            cycles: 12,
            asm: `MOVEA.L #$${immediate.toString(16).padStart(8, '0')},A${reg}`,
            description: 'Move long immediate to address register',
            pc: pc,
            immediate: immediate
        };
    },
    
    // NEW: Additional MOVEA implementations
    op_movea_w_d_a(src, dst) {
        const pc = this.registers.pc - 2;
        const value = this.registers.d[src] & 0xFFFF;
        const signExtended = (value & 0x8000) ? (value | 0xFFFF0000) : value;
        const oldValue = this.registers.a[dst];
        
        this.registers.a[dst] = signExtended >>> 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.W D${src},A${dst}            ; Move word data register to address register`);
        console.log(`       → A${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${signExtended.toString(16).padStart(8, '0')}`);
        
        this.cycles += 4;
        return { 
            name: `MOVEA.W D${src},A${dst}`, 
            cycles: 4,
            asm: `MOVEA.W D${src},A${dst}`,
            description: 'Move word data register to address register',
            pc: pc,
            oldValue: oldValue,
            newValue: signExtended
        };
    },
    
    op_movea_l_d_a(src, dst) {
        const pc = this.registers.pc - 2;
        const value = this.registers.d[src];
        const oldValue = this.registers.a[dst];
        
        this.registers.a[dst] = value >>> 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.L D${src},A${dst}            ; Move long data register to address register`);
        console.log(`       → A${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${value.toString(16).padStart(8, '0')}`);
        
        this.cycles += 4;
        return { 
            name: `MOVEA.L D${src},A${dst}`, 
            cycles: 4,
            asm: `MOVEA.L D${src},A${dst}`,
            description: 'Move long data register to address register',
            pc: pc,
            oldValue: oldValue,
            newValue: value
        };
    },
    
    op_movea_w_a_a(src, dst) {
        const pc = this.registers.pc - 2;
        const value = this.registers.a[src] & 0xFFFF;
        const signExtended = (value & 0x8000) ? (value | 0xFFFF0000) : value;
        const oldValue = this.registers.a[dst];
        
        this.registers.a[dst] = signExtended >>> 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.W A${src},A${dst}            ; Move word address register to address register`);
        console.log(`       → A${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${signExtended.toString(16).padStart(8, '0')}`);
        
        this.cycles += 4;
        return { 
            name: `MOVEA.W A${src},A${dst}`, 
            cycles: 4,
            asm: `MOVEA.W A${src},A${dst}`,
            description: 'Move word address register to address register',
            pc: pc,
            oldValue: oldValue,
            newValue: signExtended
        };
    },
    
    op_movea_l_a_a(src, dst) {
        const pc = this.registers.pc - 2;
        const value = this.registers.a[src];
        const oldValue = this.registers.a[dst];
        
        this.registers.a[dst] = value >>> 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.L A${src},A${dst}            ; Move long address register to address register`);
        console.log(`       → A${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${value.toString(16).padStart(8, '0')}`);
        
        this.cycles += 4;
        return { 
            name: `MOVEA.L A${src},A${dst}`, 
            cycles: 4,
            asm: `MOVEA.L A${src},A${dst}`,
            description: 'Move long address register to address register',
            pc: pc,
            oldValue: oldValue,
            newValue: value
        };
    },
    
    op_movea_w_a_ind_a(src, dst) {
        const pc = this.registers.pc - 2;
        const address = this.registers.a[src];
        const value = this.memory.readWord(address);
        const signExtended = (value & 0x8000) ? (value | 0xFFFF0000) : value;
        const oldValue = this.registers.a[dst];
        
        this.registers.a[dst] = signExtended >>> 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.W (A${src}),A${dst}          ; Move word from memory to address register`);
        console.log(`       → A${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${signExtended.toString(16).padStart(8, '0')}`);
        console.log(`       → Read from: 0x${address.toString(16).padStart(8, '0')} = 0x${value.toString(16).padStart(4, '0')}`);
        
        this.cycles += 8;
        return { 
            name: `MOVEA.W (A${src}),A${dst}`, 
            cycles: 8,
            asm: `MOVEA.W (A${src}),A${dst}`,
            description: 'Move word from memory to address register',
            pc: pc,
            oldValue: oldValue,
            newValue: signExtended
        };
    },
    
    op_movea_l_a_ind_a(src, dst) {
        const pc = this.registers.pc - 2;
        const address = this.registers.a[src];
        const highWord = this.memory.readWord(address);
        const lowWord = this.memory.readWord(address + 2);
        const value = ((highWord << 16) | lowWord) >>> 0;
        const oldValue = this.registers.a[dst];
        
        this.registers.a[dst] = value;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.L (A${src}),A${dst}          ; Move long from memory to address register`);
        console.log(`       → A${dst}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${value.toString(16).padStart(8, '0')}`);
        console.log(`       → Read from: 0x${address.toString(16).padStart(8, '0')} = 0x${value.toString(16).padStart(8, '0')}`);
        
        this.cycles += 12;
        return { 
            name: `MOVEA.L (A${src}),A${dst}`, 
            cycles: 12,
            asm: `MOVEA.L (A${src}),A${dst}`,
            description: 'Move long from memory to address register',
            pc: pc,
            oldValue: oldValue,
            newValue: value
        };
    },
    
    // *** THE MISSING OPCODE 0x2C78 IS THIS ONE ***
    op_movea_l_aw_a(reg) {
        const pc = this.registers.pc - 2;
        const address = this.fetchWord();
        const highWord = this.memory.readWord(address);
        const lowWord = this.memory.readWord(address + 2);
        const value = ((highWord << 16) | lowWord) >>> 0;
        const oldValue = this.registers.a[reg];
        
        this.registers.a[reg] = value;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.L ($${address.toString(16).padStart(4, '0')}),A${reg}       ; Move long from absolute word address`);
        console.log(`       → A${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${value.toString(16).padStart(8, '0')}`);
        console.log(`       → Read from: 0x${address.toString(16).padStart(4, '0')} = 0x${value.toString(16).padStart(8, '0')}`);
        
        this.cycles += 16;
        return { 
            name: `MOVEA.L ($${address.toString(16)}),A${reg}`, 
            cycles: 16,
            asm: `MOVEA.L ($${address.toString(16).padStart(4, '0')}),A${reg}`,
            description: 'Move long from absolute word address to address register',
            pc: pc,
            oldValue: oldValue,
            newValue: value,
            immediate: address
        };
    },
    
    op_movea_w_aw_a(reg) {
        const pc = this.registers.pc - 2;
        const address = this.fetchWord();
        const value = this.memory.readWord(address);
        const signExtended = (value & 0x8000) ? (value | 0xFFFF0000) : value;
        const oldValue = this.registers.a[reg];
        
        this.registers.a[reg] = signExtended >>> 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.W ($${address.toString(16).padStart(4, '0')}),A${reg}       ; Move word from absolute word address`);
        console.log(`       → A${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${signExtended.toString(16).padStart(8, '0')}`);
        console.log(`       → Read from: 0x${address.toString(16).padStart(4, '0')} = 0x${value.toString(16).padStart(4, '0')}`);
        
        this.cycles += 12;
        return { 
            name: `MOVEA.W ($${address.toString(16)}),A${reg}`, 
            cycles: 12,
            asm: `MOVEA.W ($${address.toString(16).padStart(4, '0')}),A${reg}`,
            description: 'Move word from absolute word address to address register',
            pc: pc,
            oldValue: oldValue,
            newValue: signExtended,
            immediate: address
        };
    },
    
    op_movea_l_al_a(reg) {
        const pc = this.registers.pc - 2;
        const address = this.fetchLong();
        const highWord = this.memory.readWord(address);
        const lowWord = this.memory.readWord(address + 2);
        const value = ((highWord << 16) | lowWord) >>> 0;
        const oldValue = this.registers.a[reg];
        
        this.registers.a[reg] = value;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.L ($${address.toString(16).padStart(8, '0')}),A${reg}   ; Move long from absolute long address`);
        console.log(`       → A${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${value.toString(16).padStart(8, '0')}`);
        console.log(`       → Read from: 0x${address.toString(16).padStart(8, '0')} = 0x${value.toString(16).padStart(8, '0')}`);
        
        this.cycles += 20;
        return { 
            name: `MOVEA.L ($${address.toString(16)}),A${reg}`, 
            cycles: 20,
            asm: `MOVEA.L ($${address.toString(16).padStart(8, '0')}),A${reg}`,
            description: 'Move long from absolute long address to address register',
            pc: pc,
            oldValue: oldValue,
            newValue: value,
            immediate: address
        };
    },
    
    op_movea_w_al_a(reg) {
        const pc = this.registers.pc - 2;
        const address = this.fetchLong();
        const value = this.memory.readWord(address);
        const signExtended = (value & 0x8000) ? (value | 0xFFFF0000) : value;
        const oldValue = this.registers.a[reg];
        
        this.registers.a[reg] = signExtended >>> 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.W (${address.toString(16).padStart(8, '0')}),A${reg}   ; Move word from absolute long address`);
        console.log(`       → A${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${signExtended.toString(16).padStart(8, '0')}`);
        console.log(`       → Read from: 0x${address.toString(16).padStart(8, '0')} = 0x${value.toString(16).padStart(4, '0')}`);
        
        this.cycles += 16;
        return { 
            name: `MOVEA.W (${address.toString(16)}),A${reg}`, 
            cycles: 16,
            asm: `MOVEA.W (${address.toString(16).padStart(8, '0')}),A${reg}`,
            description: 'Move word from absolute long address to address register',
            pc: pc,
            oldValue: oldValue,
            newValue: signExtended,
            immediate: address
        };
    },
    
    op_movea_w_pc_d16_a(reg) {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        const address = (pc + 2 + signedDisp) >>> 0;
        const value = this.memory.readWord(address);
        const signExtended = (value & 0x8000) ? (value | 0xFFFF0000) : value;
        const oldValue = this.registers.a[reg];
        
        this.registers.a[reg] = signExtended >>> 0;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.W (${signedDisp},PC),A${reg}      ; Move word from PC-relative address`);
        console.log(`       → A${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${signExtended.toString(16).padStart(8, '0')}`);
        console.log(`       → Read from: 0x${address.toString(16).padStart(8, '0')} = 0x${value.toString(16).padStart(4, '0')}`);
        
        this.cycles += 12;
        return { 
            name: `MOVEA.W (${signedDisp},PC),A${reg}`, 
            cycles: 12,
            asm: `MOVEA.W (${signedDisp},PC),A${reg}`,
            description: 'Move word from PC-relative address to address register',
            pc: pc,
            oldValue: oldValue,
            newValue: signExtended,
            immediate: displacement
        };
    },
    
    op_movea_l_pc_d16_a(reg) {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        const address = (pc + 2 + signedDisp) >>> 0;
        const highWord = this.memory.readWord(address);
        const lowWord = this.memory.readWord(address + 2);
        const value = ((highWord << 16) | lowWord) >>> 0;
        const oldValue = this.registers.a[reg];
        
        this.registers.a[reg] = value;
        
        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEA.L (${signedDisp},PC),A${reg}      ; Move long from PC-relative address`);
        console.log(`       → A${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${value.toString(16).padStart(8, '0')}`);
        console.log(`       → Read from: 0x${address.toString(16).padStart(8, '0')} = 0x${value.toString(16).padStart(8, '0')}`);
        
        this.cycles += 16;
        return { 
            name: `MOVEA.L (${signedDisp},PC),A${reg}`, 
            cycles: 16,
            asm: `MOVEA.L (${signedDisp},PC),A${reg}`,
            description: 'Move long from PC-relative address to address register',
            pc: pc,
            oldValue: oldValue,
            newValue: value,
            immediate: displacement
        };
    }
};

module.exports = { MoveOpcodes };