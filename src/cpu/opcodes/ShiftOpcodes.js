// src/cpu/opcodes/ShiftOpcodes.js - Shift Operations

class ShiftOpcodes {
    constructor(cpu) {
        this.cpu = cpu;
    }

    setup(opcodeTable) {
        const cpu = this.cpu;
        console.log('🔧 [CPU] Setting up shift opcodes...');
        
        // LSL.W #count,Dn
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE148 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_lsl_w_i_d.call(cpu, count, reg);
            }
        }
        
        // LSR.W #count,Dn
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE048 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_lsr_w_i_d.call(cpu, count, reg);
            }
        }
        
        // ASL.W #count,Dn
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE180 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_asl_w_i_d.call(cpu, count, reg);
            }
        }
        
        // ASR.W #count,Dn
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE080 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_asr_w_i_d.call(cpu, count, reg);
            }
        }
        
        // LSL.B #count,Dn - Logical shift left byte
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE108 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_lsl_b_i_d.call(cpu, count, reg);
            }
        }

        // LSL.L #count,Dn - Logical shift left long
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE188 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_lsl_l_i_d.call(cpu, count, reg);
            }
        }

        // LSR.B #count,Dn - Logical shift right byte
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE008 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_lsr_b_i_d.call(cpu, count, reg);
            }
        }

        // LSR.L #count,Dn - Logical shift right long
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE088 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_lsr_l_i_d.call(cpu, count, reg);
            }
        }

        // ASL.B #count,Dn - Arithmetic shift left byte
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE100 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_asl_b_i_d.call(cpu, count, reg);
            }
        }

        // ASL.L #count,Dn - Arithmetic shift left long
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE1C0 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_asl_l_i_d.call(cpu, count, reg);
            }
        }

        // ASR.B #count,Dn - Arithmetic shift right byte
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE000 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_asr_b_i_d.call(cpu, count, reg);
            }
        }

        // ASR.L #count,Dn - Arithmetic shift right long
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE0C0 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_asr_l_i_d.call(cpu, count, reg);
            }
        }

        // ROL.W #count,Dn - Rotate left word
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE158 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_rol_w_i_d.call(cpu, count, reg);
            }
        }

        // ROL.L #count,Dn - Rotate left long
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE198 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_rol_l_i_d.call(cpu, count, reg);
            }
        }

        // ROR.W #count,Dn - Rotate right word
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE058 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_ror_w_i_d.call(cpu, count, reg);
            }
        }

        // ROR.L #count,Dn - Rotate right long
        for (let count = 1; count <= 8; count++) {
            for (let reg = 0; reg < 8; reg++) {
                const countField = (count === 8) ? 0 : count;
                const opcode = 0xE098 | (countField << 9) | reg;
                opcodeTable[opcode] = () => this.op_ror_l_i_d.call(cpu, count, reg);
            }
        }

        console.log('✅ [CPU] Shift opcodes setup complete');
    }
    
    // Shift opcode implementations
    op_lsl_w_i_d(count, reg) {
        let value = this.registers.d[reg] & 0xFFFF;
        let lastBit = 0;
        
        for (let i = 0; i < count; i++) {
            lastBit = (value & 0x8000) ? 1 : 0;
            value = (value << 1) & 0xFFFF;
        }
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | value;
        this.flag_c = this.flag_x = lastBit;
        this.setFlagsLogic16(value);
        this.cycles += 6 + (count * 2);
        return { name: `LSL.W #${count},D${reg}`, cycles: 6 + (count * 2) };
    }
    
    op_lsr_w_i_d(count, reg) {
        let value = this.registers.d[reg] & 0xFFFF;
        let lastBit = 0;
        
        for (let i = 0; i < count; i++) {
            lastBit = value & 1;
            value = value >>> 1;
        }
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | value;
        this.flag_c = this.flag_x = lastBit;
        this.setFlagsLogic16(value);
        this.cycles += 6 + (count * 2);
        return { name: `LSR.W #${count},D${reg}`, cycles: 6 + (count * 2) };
    }
    
    op_asl_w_i_d(count, reg) {
        let value = this.registers.d[reg] & 0xFFFF;
        let lastBit = 0;
        let overflow = 0;
        
        for (let i = 0; i < count; i++) {
            lastBit = (value & 0x8000) ? 1 : 0;
            const newBit = (value & 0x4000) ? 1 : 0;
            if (lastBit !== newBit) overflow = 1;
            value = (value << 1) & 0xFFFF;
        }
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | value;
        this.flag_c = this.flag_x = lastBit;
        this.flag_v = overflow;
        this.setFlags16(value);
        this.cycles += 6 + (count * 2);
        return { name: `ASL.W #${count},D${reg}`, cycles: 6 + (count * 2) };
    }
    
    op_asr_w_i_d(count, reg) {
        let value = this.registers.d[reg] & 0xFFFF;
        const signBit = value & 0x8000;
        let lastBit = 0;
        
        for (let i = 0; i < count; i++) {
            lastBit = value & 1;
            value = (value >>> 1) | signBit;
        }
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | value;
        this.flag_c = this.flag_x = lastBit;
        this.setFlags16(value);
        this.cycles += 6 + (count * 2);
        return { name: `ASR.W #${count},D${reg}`, cycles: 6 + (count * 2) };
    }

    // Additional shift implementations
    op_lsl_b_i_d(count, reg) {
        let value = this.registers.d[reg] & 0xFF;
        let lastBit = 0;
        
        for (let i = 0; i < count; i++) {
            lastBit = (value & 0x80) ? 1 : 0;
            value = (value << 1) & 0xFF;
        }
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFFFF00) | value;
        this.flag_c = this.flag_x = lastBit;
        this.setFlagsLogic8(value);
        this.cycles += 6 + (count * 2);
        return { name: `LSL.B #${count},D${reg}`, cycles: 6 + (count * 2) };
    }

    op_lsl_l_i_d(count, reg) {
        let value = this.registers.d[reg] >>> 0;
        let lastBit = 0;
        
        for (let i = 0; i < count; i++) {
            lastBit = (value & 0x80000000) ? 1 : 0;
            value = (value << 1) >>> 0;
        }
        
        this.registers.d[reg] = value;
        this.flag_c = this.flag_x = lastBit;
        this.setFlagsLogic32(value);
        this.cycles += 8 + (count * 2);
        return { name: `LSL.L #${count},D${reg}`, cycles: 8 + (count * 2) };
    }

    op_lsr_b_i_d(count, reg) {
        let value = this.registers.d[reg] & 0xFF;
        let lastBit = 0;
        
        for (let i = 0; i < count; i++) {
            lastBit = value & 1;
            value = value >>> 1;
        }
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFFFF00) | value;
        this.flag_c = this.flag_x = lastBit;
        this.setFlagsLogic8(value);
        this.cycles += 6 + (count * 2);
        return { name: `LSR.B #${count},D${reg}`, cycles: 6 + (count * 2) };
    }

    op_lsr_l_i_d(count, reg) {
        let value = this.registers.d[reg] >>> 0;
        let lastBit = 0;
        
        for (let i = 0; i < count; i++) {
            lastBit = value & 1;
            value = value >>> 1;
        }
        
        this.registers.d[reg] = value;
        this.flag_c = this.flag_x = lastBit;
        this.setFlagsLogic32(value);
        this.cycles += 8 + (count * 2);
        return { name: `LSR.L #${count},D${reg}`, cycles: 8 + (count * 2) };
    }

    op_asl_b_i_d(count, reg) {
        let value = this.registers.d[reg] & 0xFF;
        let lastBit = 0;
        let overflow = 0;
        
        for (let i = 0; i < count; i++) {
            lastBit = (value & 0x80) ? 1 : 0;
            const newBit = (value & 0x40) ? 1 : 0;
            if (lastBit !== newBit) overflow = 1;
            value = (value << 1) & 0xFF;
        }
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFFFF00) | value;
        this.flag_c = this.flag_x = lastBit;
        this.flag_v = overflow;
        this.setFlags8(value);
        this.cycles += 6 + (count * 2);
        return { name: `ASL.B #${count},D${reg}`, cycles: 6 + (count * 2) };
    }

    op_asl_l_i_d(count, reg) {
        let value = this.registers.d[reg] >>> 0;
        let lastBit = 0;
        let overflow = 0;
        
        for (let i = 0; i < count; i++) {
            lastBit = (value & 0x80000000) ? 1 : 0;
            const newBit = (value & 0x40000000) ? 1 : 0;
            if (lastBit !== newBit) overflow = 1;
            value = (value << 1) >>> 0;
        }
        
        this.registers.d[reg] = value;
        this.flag_c = this.flag_x = lastBit;
        this.flag_v = overflow;
        this.setFlags32(value);
        this.cycles += 8 + (count * 2);
        return { name: `ASL.L #${count},D${reg}`, cycles: 8 + (count * 2) };
    }

    op_asr_b_i_d(count, reg) {
        let value = this.registers.d[reg] & 0xFF;
        const signBit = value & 0x80;
        let lastBit = 0;
        
        for (let i = 0; i < count; i++) {
            lastBit = value & 1;
            value = (value >>> 1) | signBit;
        }
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFFFF00) | value;
        this.flag_c = this.flag_x = lastBit;
        this.setFlags8(value);
        this.cycles += 6 + (count * 2);
        return { name: `ASR.B #${count},D${reg}`, cycles: 6 + (count * 2) };
    }

    op_asr_l_i_d(count, reg) {
        let value = this.registers.d[reg] >>> 0;
        const signBit = value & 0x80000000;
        let lastBit = 0;
        
        for (let i = 0; i < count; i++) {
            lastBit = value & 1;
            value = (value >>> 1) | signBit;
        }
        
        this.registers.d[reg] = value >>> 0;
        this.flag_c = this.flag_x = lastBit;
        this.setFlags32(value);
        this.cycles += 8 + (count * 2);
        return { name: `ASR.L #${count},D${reg}`, cycles: 8 + (count * 2) };
    }

    // Rotate implementations
    op_rol_w_i_d(count, reg) {
        let value = this.registers.d[reg] & 0xFFFF;
        
        for (let i = 0; i < count; i++) {
            const msb = (value & 0x8000) ? 1 : 0;
            value = ((value << 1) | msb) & 0xFFFF;
        }
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | value;
        this.flag_c = (value & 1) ? 1 : 0;
        this.setFlagsLogic16(value);
        this.cycles += 6 + (count * 2);
        return { name: `ROL.W #${count},D${reg}`, cycles: 6 + (count * 2) };
    }

    op_rol_l_i_d(count, reg) {
        let value = this.registers.d[reg] >>> 0;
        
        for (let i = 0; i < count; i++) {
            const msb = (value & 0x80000000) ? 1 : 0;
            value = ((value << 1) | msb) >>> 0;
        }
        
        this.registers.d[reg] = value;
        this.flag_c = (value & 1) ? 1 : 0;
        this.setFlagsLogic32(value);
        this.cycles += 8 + (count * 2);
        return { name: `ROL.L #${count},D${reg}`, cycles: 8 + (count * 2) };
    }

    op_ror_w_i_d(count, reg) {
        let value = this.registers.d[reg] & 0xFFFF;
        
        for (let i = 0; i < count; i++) {
            const lsb = value & 1;
            value = (value >>> 1) | (lsb << 15);
        }
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | value;
        this.flag_c = (value & 0x8000) ? 1 : 0;
        this.setFlagsLogic16(value);
        this.cycles += 6 + (count * 2);
        return { name: `ROR.W #${count},D${reg}`, cycles: 6 + (count * 2) };
    }

    op_ror_l_i_d(count, reg) {
        let value = this.registers.d[reg] >>> 0;
        
        for (let i = 0; i < count; i++) {
            const lsb = value & 1;
            value = (value >>> 1) | (lsb << 31);
        }
        
        this.registers.d[reg] = value >>> 0;
        this.flag_c = (value & 0x80000000) ? 1 : 0;
        this.setFlagsLogic32(value);
        this.cycles += 8 + (count * 2);
        return { name: `ROR.L #${count},D${reg}`, cycles: 8 + (count * 2) };
    }
};

module.exports = ShiftOpcodes;