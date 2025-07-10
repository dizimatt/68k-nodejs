// src/cpu/opcodes/MoveOpcodes.js - Move Operations (WITH DEBUG LOGGING)

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
        
        console.log('✅ [CPU] Move opcodes setup complete');
    },
    
    // Move opcode implementations
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
        // MOVEA does not affect flags
        
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
        // MOVEA does not affect flags
        
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
    }
};

module.exports = { MoveOpcodes };