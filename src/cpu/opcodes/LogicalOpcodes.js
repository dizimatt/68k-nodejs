// src/cpu/opcodes/LogicalOpcodes.js - Logical Operations

class LogicalOpcodes {
    constructor(cpu) {
        this.cpu = cpu;
    }

    setup(opcodeTable) {
        const cpu = this.cpu;
        console.log('🔧 [CPU] Setting up logical opcodes...');
        
        // AND.W Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xC000 | (dst << 9) | 0x40 | src;
                opcodeTable[opcode] = () => this.op_and_w_d_d.call(cpu, src, dst);
            }
        }
        
        // OR.W Dn,Dm  
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x8000 | (dst << 9) | 0x40 | src;
                opcodeTable[opcode] = () => this.op_or_w_d_d.call(cpu, src, dst);
            }
        }
        
        // EOR.W Dn,Dm
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0xB100 | (src << 9) | 0x40 | dst;
                opcodeTable[opcode] = () => this.op_eor_w_d_d.call(cpu, src, dst);
            }
        }
        
        // NOT.W Dn
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4640 | reg;
            opcodeTable[opcode] = () => this.op_not_w_d.call(cpu, reg);
        }
        
        // CLR.W Dn
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4240 | reg;
            opcodeTable[opcode] = () => this.op_clr_w_d.call(cpu, reg);
        }
        
        console.log('✅ [CPU] Logical opcodes setup complete');
    }
    
    // Logical opcode implementations
    op_and_w_d_d(src, dst) {
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = srcVal & dstVal;
        
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFF0000) | result;
        this.setFlagsLogic16(result);
        this.cycles += 4;
        return { name: `AND.W D${src},D${dst}`, cycles: 4 };
    }
    
    op_or_w_d_d(src, dst) {
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = srcVal | dstVal;
        
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFF0000) | result;
        this.setFlagsLogic16(result);
        this.cycles += 4;
        return { name: `OR.W D${src},D${dst}`, cycles: 4 };
    }
    
    op_eor_w_d_d(src, dst) {
        const srcVal = this.registers.d[src] & 0xFFFF;
        const dstVal = this.registers.d[dst] & 0xFFFF;
        const result = srcVal ^ dstVal;
        
        this.registers.d[dst] = (this.registers.d[dst] & 0xFFFF0000) | result;
        this.setFlagsLogic16(result);
        this.cycles += 4;
        return { name: `EOR.W D${src},D${dst}`, cycles: 4 };
    }
    
    op_not_w_d(reg) {
        const value = this.registers.d[reg] & 0xFFFF;
        const result = (~value) & 0xFFFF;
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | result;
        this.setFlagsLogic16(result);
        this.cycles += 4;
        return { name: `NOT.W D${reg}`, cycles: 4 };
    }
    
    op_clr_w_d(reg) {
        this.registers.d[reg] = this.registers.d[reg] & 0xFFFF0000;
        this.flag_z = 1;
        this.flag_n = 0;
        this.flag_c = 0;
        this.flag_v = 0;
        this.cycles += 4;
        return { name: `CLR.W D${reg}`, cycles: 4 };
    }
}

module.exports = LogicalOpcodes;