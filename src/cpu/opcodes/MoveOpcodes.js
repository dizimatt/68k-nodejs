// src/cpu/opcodes/MoveOpcodes.js - Move Operations

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
            const opcode = 0x3000 | (reg << 9) | 0x3C;
            opcodeTable[opcode] = () => this.op_move_w_imm_d.call(cpu, reg);
        }
        
        // MOVE.L #imm,Dn
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x2000 | (reg << 9) | 0x3C;
            opcodeTable[opcode] = () => this.op_move_l_imm_d.call(cpu, reg);
        }
        
        // MOVE.W Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x3000 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_move_w_d_d.call(cpu, src, dst);
            }
        }
        
        console.log('✅ [CPU] Move opcodes setup complete');
    },
    
    // Move opcode implementations
    op_moveq(reg, data) {
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
    }
};

module.exports = { MoveOpcodes };