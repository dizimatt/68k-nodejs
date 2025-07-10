// src/cpu/opcodes/MoveOpcodes.js - Move Operations (FIXED)

const MoveOpcodes = {
    setup(opcodeTable, cpu) {
        console.log('🔧 [CPU] Setting up move opcodes...');
        
        // MOVEQ #imm,Dn (7000-7FFF) - This was correct
        for (let reg = 0; reg < 8; reg++) {
            for (let data = 0; data < 256; data++) {
                const opcode = 0x7000 | (reg << 9) | data;
                opcodeTable[opcode] = () => this.op_moveq.call(cpu, reg, data);
            }
        }
        
        // MOVE.W #imm,Dn - FIXED: Correct opcode pattern
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x303C | (reg << 9);  // FIXED: 303C + (reg << 9)
            opcodeTable[opcode] = () => this.op_move_w_imm_d.call(cpu, reg);
        }
        
        // MOVE.L #imm,Dn - FIXED: Correct opcode pattern  
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x203C | (reg << 9);  // FIXED: 203C + (reg << 9)
            opcodeTable[opcode] = () => this.op_move_l_imm_d.call(cpu, reg);
        }
        
        // MOVE.W Dn,Dm - FIXED: Correct bit layout
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                // FIXED: MOVE uses different bit encoding than simple pattern
                // Pattern: 00SSSDDD DDSSSSSS where SSS=size, DDD=dest, SSSSSS=source
                const opcode = 0x3000 | (dst << 9) | (0 << 6) | src;  // 0 = Dn addressing mode
                opcodeTable[opcode] = () => this.op_move_w_d_d.call(cpu, src, dst);
            }
        }
        
        // MOVE.L Dn,Dm - FIXED: Add long word register-to-register moves
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x2000 | (dst << 9) | (0 << 6) | src;  // 0 = Dn addressing mode
                opcodeTable[opcode] = () => this.op_move_l_d_d.call(cpu, src, dst);
            }
        }
        
        // MOVEA.W #imm,An - FIXED: Add address register immediate moves
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x307C | (reg << 9);  // MOVEA.W #imm,An
            opcodeTable[opcode] = () => this.op_movea_w_imm_a.call(cpu, reg);
        }
        
        // MOVEA.L #imm,An - FIXED: Add address register immediate moves
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x207C | (reg << 9);  // MOVEA.L #imm,An
            opcodeTable[opcode] = () => this.op_movea_l_imm_a.call(cpu, reg);
        }
        
        console.log('✅ [CPU] Move opcodes setup complete');
    },
    
    // Move opcode implementations
    op_moveq(reg, data) {
        // MOVEQ sign-extends 8-bit immediate to 32-bit
        const value = (data & 0x80) ? (data | 0xFFFFFF00) : data;
        this.registers.d[reg] = value >>> 0;
        this.setFlags32(value);
        this.cycles += 4;
        return { name: `MOVEQ #$${data.toString(16)},D${reg}`, cycles: 4 };
    },
    
    op_move_w_imm_d(reg) {
        const immediate = this.fetchWord();
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | immediate;
        this.setFlags16(immediate);
        this.cycles += 8;
        return { name: `MOVE.W #$${immediate.toString(16)},D${reg}`, cycles: 8 };
    },
    
    op_move_l_imm_d(reg) {
        const immediate = this.fetchLong();
        this.registers.d[reg] = immediate >>> 0;
        this.setFlags32(immediate);
        this.cycles += 12;
        return { name: `MOVE.L #$${immediate.toString(16)},D${reg}`, cycles: 12 };
    },
    
    op_move_w_d_d(src, dst) {
        const value = this.registers.d[src] & 0xFFFF;
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFF0000) | value;
        this.setFlags16(value);
        this.cycles += 4;
        return { name: `MOVE.W D${src},D${dst}`, cycles: 4 };
    },
    
    // FIXED: Add missing MOVE.L Dn,Dm implementation
    op_move_l_d_d(src, dst) {
        const value = this.registers.d[src];
        this.registers.d[dst] = value >>> 0;
        this.setFlags32(value);
        this.cycles += 4;
        return { name: `MOVE.L D${src},D${dst}`, cycles: 4 };
    },
    
    // FIXED: Add MOVEA implementations for address registers
    op_movea_w_imm_a(reg) {
        const immediate = this.fetchWord();
        // MOVEA.W sign-extends to 32-bit
        const value = (immediate & 0x8000) ? (immediate | 0xFFFF0000) : immediate;
        this.registers.a[reg] = value >>> 0;
        // MOVEA does not affect flags
        this.cycles += 8;
        return { name: `MOVEA.W #$${immediate.toString(16)},A${reg}`, cycles: 8 };
    },
    
    op_movea_l_imm_a(reg) {
        const immediate = this.fetchLong();
        this.registers.a[reg] = immediate >>> 0;
        // MOVEA does not affect flags
        this.cycles += 12;
        return { name: `MOVEA.L #$${immediate.toString(16)},A${reg}`, cycles: 12 };
    }
};

module.exports = { MoveOpcodes };