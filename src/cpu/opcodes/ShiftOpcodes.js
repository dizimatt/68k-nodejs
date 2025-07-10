// src/cpu/opcodes/ShiftOpcodes.js - Shift Operations

const ShiftOpcodes = {
    setup(opcodeTable, cpu) {
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
        
        console.log('✅ [CPU] Shift opcodes setup complete');
    },
    
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
    },
    
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
    },
    
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
    },
    
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
};

module.exports = { ShiftOpcodes };