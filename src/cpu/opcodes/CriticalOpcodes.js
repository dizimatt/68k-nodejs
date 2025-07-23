// src/cpu/opcodes/CriticalOpcodes.js - Critical Instructions for Program Execution

class CriticalOpcodes {
    constructor(cpu) {
        this.cpu = cpu;
    }

    setup(opcodeTable) {
        const cpu = this.cpu;
        console.log('🔧 [CPU] Setting up critical opcodes...');

        // MOVEM.W (regs),-(An) - Move multiple registers to predecrement
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x48A0 | reg;
            opcodeTable[opcode] = () => this.op_movem_w_regs_predec.call(cpu, reg);
        }

        // MOVEM.L (regs),-(An) - Move multiple registers to predecrement
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x48E0 | reg;
            opcodeTable[opcode] = () => this.op_movem_l_regs_predec.call(cpu, reg);
        }

        // MOVEM.W (An)+,(regs) - Move multiple registers from postincrement
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4C98 | reg;
            opcodeTable[opcode] = () => this.op_movem_w_postinc_regs.call(cpu, reg);
        }

        // MOVEM.L (An)+,(regs) - Move multiple registers from postincrement
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4CD8 | reg;
            opcodeTable[opcode] = () => this.op_movem_l_postinc_regs.call(cpu, reg);
        }

        // LINK An,#displacement - Link and allocate stack frame
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4E50 | reg;
            opcodeTable[opcode] = () => this.op_link.call(cpu, reg);
        }

        // UNLK An - Unlink stack frame
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4E58 | reg;
            opcodeTable[opcode] = () => this.op_unlk.call(cpu, reg);
        }

        // Scc instructions - Set conditionally (16 conditions)
        const conditions = [
            'T',  'F',  'HI', 'LS', 'CC', 'CS', 'NE', 'EQ',
            'VC', 'VS', 'PL', 'MI', 'GE', 'LT', 'GT', 'LE'
        ];

        for (let cc = 0; cc < 16; cc++) {
            // Scc Dn - Set data register conditionally
            for (let reg = 0; reg < 8; reg++) {
                const opcode = 0x50C0 | (cc << 8) | reg;
                opcodeTable[opcode] = () => this.op_scc_d.call(cpu, cc, reg, conditions[cc]);
            }

            // Scc (An) - Set memory conditionally
            for (let reg = 0; reg < 8; reg++) {
                const opcode = 0x50D0 | (cc << 8) | reg;
                opcodeTable[opcode] = () => this.op_scc_an.call(cpu, cc, reg, conditions[cc]);
            }
        }

        console.log('✅ [CPU] Critical opcodes setup complete');
    }

    // MOVEM implementations
    op_movem_w_regs_predec(reg) {
        const pc = this.registers.pc - 2;
        const regMask = this.fetchWord();
        let address = this.registers.a[reg];
        let registerList = [];

        // For predecrement, process registers in reverse order (A7->A0, D7->D0)
        for (let i = 15; i >= 0; i--) {
            if (regMask & (1 << i)) {
                address -= 2;
                const isAddr = i >= 8;
                const regNum = isAddr ? (15 - i) : (7 - i);
                const value = isAddr ? 
                    (this.registers.a[regNum] & 0xFFFF) : 
                    (this.registers.d[regNum] & 0xFFFF);
                
                this.memory.writeWord(address, value);
                registerList.push(isAddr ? `A${regNum}` : `D${regNum}`);
            }
        }

        this.registers.a[reg] = address >>> 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEM.W {${registerList.join(',')}},-(A${reg}) ; Move multiple word registers to predecrement`);
        console.log(`       → Saved ${registerList.length} registers, A${reg} = 0x${address.toString(16).padStart(8, '0')}`);

        this.cycles += 8 + (registerList.length * 4);
        return {
            name: `MOVEM.W {${registerList.join(',')}},-(A${reg})`,
            cycles: 8 + (registerList.length * 4),
            asm: `MOVEM.W {${registerList.join(',')}},-(A${reg})`,
            description: 'Move multiple word registers to predecrement',
            pc: pc,
            regMask: regMask,
            registerCount: registerList.length,
            newValue: address
        };
    }

    op_movem_l_regs_predec(reg) {
        const pc = this.registers.pc - 2;
        const regMask = this.fetchWord();
        let address = this.registers.a[reg];
        let registerList = [];

        // For predecrement, process registers in reverse order (A7->A0, D7->D0)
        for (let i = 15; i >= 0; i--) {
            if (regMask & (1 << i)) {
                address -= 4;
                const isAddr = i >= 8;
                const regNum = isAddr ? (15 - i) : (7 - i);
                const value = isAddr ? this.registers.a[regNum] : this.registers.d[regNum];
                
                this.memory.writeLong(address, value);
                registerList.push(isAddr ? `A${regNum}` : `D${regNum}`);
            }
        }

        this.registers.a[reg] = address >>> 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEM.L {${registerList.join(',')}},-(A${reg}) ; Move multiple long registers to predecrement`);
        console.log(`       → Saved ${registerList.length} registers, A${reg} = 0x${address.toString(16).padStart(8, '0')}`);

        this.cycles += 8 + (registerList.length * 8);
        return {
            name: `MOVEM.L {${registerList.join(',')}},-(A${reg})`,
            cycles: 8 + (registerList.length * 8),
            asm: `MOVEM.L {${registerList.join(',')}},-(A${reg})`,
            description: 'Move multiple long registers to predecrement',
            pc: pc,
            regMask: regMask,
            registerCount: registerList.length,
            newValue: address
        };
    }

    op_movem_w_postinc_regs(reg) {
        const pc = this.registers.pc - 2;
        const regMask = this.fetchWord();
        let address = this.registers.a[reg];
        let registerList = [];

        // For postincrement, process in normal order (D0->D7, A0->A7)
        for (let i = 0; i < 16; i++) {
            if (regMask & (1 << i)) {
                const isAddr = i >= 8;
                const regNum = isAddr ? (i - 8) : i;
                const value = this.memory.readWord(address);
                
                if (isAddr) {
                    // Sign extend word to long for address registers
                    this.registers.a[regNum] = (value & 0x8000) ? (value | 0xFFFF0000) : value;
                } else {
                    this.registers.d[regNum] = (this.registers.d[regNum] & 0xFFFF0000) | value;
                }
                
                address += 2;
                registerList.push(isAddr ? `A${regNum}` : `D${regNum}`);
            }
        }

        this.registers.a[reg] = address >>> 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEM.W (A${reg})+,{${registerList.join(',')}} ; Move multiple word registers from postincrement`);
        console.log(`       → Loaded ${registerList.length} registers, A${reg} = 0x${address.toString(16).padStart(8, '0')}`);

        this.cycles += 12 + (registerList.length * 4);
        return {
            name: `MOVEM.W (A${reg})+,{${registerList.join(',')}}`,
            cycles: 12 + (registerList.length * 4),
            asm: `MOVEM.W (A${reg})+,{${registerList.join(',')}}`,
            description: 'Move multiple word registers from postincrement',
            pc: pc,
            regMask: regMask,
            registerCount: registerList.length,
            newValue: address
        };
    }

    op_movem_l_postinc_regs(reg) {
        const pc = this.registers.pc - 2;
        const regMask = this.fetchWord();
        let address = this.registers.a[reg];
        let registerList = [];

        // For postincrement, process in normal order (D0->D7, A0->A7)
        for (let i = 0; i < 16; i++) {
            if (regMask & (1 << i)) {
                const isAddr = i >= 8;
                const regNum = isAddr ? (i - 8) : i;
                const value = this.memory.readLong(address);
                
                if (isAddr) {
                    this.registers.a[regNum] = value >>> 0;
                } else {
                    this.registers.d[regNum] = value >>> 0;
                }
                
                address += 4;
                registerList.push(isAddr ? `A${regNum}` : `D${regNum}`);
            }
        }

        this.registers.a[reg] = address >>> 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEM.L (A${reg})+,{${registerList.join(',')}} ; Move multiple long registers from postincrement`);
        console.log(`       → Loaded ${registerList.length} registers, A${reg} = 0x${address.toString(16).padStart(8, '0')}`);

        this.cycles += 12 + (registerList.length * 8);
        return {
            name: `MOVEM.L (A${reg})+,{${registerList.join(',')}}`,
            cycles: 12 + (registerList.length * 8),
            asm: `MOVEM.L (A${reg})+,{${registerList.join(',')}}`,
            description: 'Move multiple long registers from postincrement',
            pc: pc,
            regMask: regMask,
            registerCount: registerList.length,
            newValue: address
        };
    }

    // LINK/UNLK implementations
    op_link(reg) {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        const oldA7 = this.registers.a[7];
        const oldValue = this.registers.a[reg];

        // Push address register onto stack
        this.pushLong(this.registers.a[reg]);
        
        // Copy stack pointer to address register
        this.registers.a[reg] = this.registers.a[7];
        
        // Add displacement to stack pointer
        this.registers.a[7] = (this.registers.a[7] + signedDisp) >>> 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: LINK A${reg},#${signedDisp}           ; Link and allocate stack frame`);
        console.log(`       → Pushed A${reg}(0x${oldValue.toString(16).padStart(8, '0')}), A${reg} = SP(0x${this.registers.a[reg].toString(16).padStart(8, '0')}), SP += ${signedDisp} = 0x${this.registers.a[7].toString(16).padStart(8, '0')}`);

        this.cycles += 16;
        return {
            name: `LINK A${reg},#${signedDisp}`,
            cycles: 16,
            asm: `LINK A${reg},#${signedDisp}`,
            description: 'Link and allocate stack frame',
            pc: pc,
            immediate: displacement,
            oldValue: oldValue,
            newValue: this.registers.a[reg],
            stackChange: signedDisp
        };
    }

    op_unlk(reg) {
        const pc = this.registers.pc - 2;
        const oldA7 = this.registers.a[7];
        const oldValue = this.registers.a[reg];

        // Copy address register to stack pointer
        this.registers.a[7] = this.registers.a[reg];
        
        // Pop address register from stack
        this.registers.a[reg] = this.pullLong();

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: UNLK A${reg}                ; Unlink stack frame`);
        console.log(`       → SP = A${reg}(0x${oldValue.toString(16).padStart(8, '0')}), A${reg} = popped(0x${this.registers.a[reg].toString(16).padStart(8, '0')})`);

        this.cycles += 12;
        return {
            name: `UNLK A${reg}`,
            cycles: 12,
            asm: `UNLK A${reg}`,
            description: 'Unlink stack frame',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.a[reg]
        };
    }

    // Scc implementations - Set on Condition
    op_scc_d(condition, reg, condName) {
        const pc = this.registers.pc - 2;
        const conditionMet = this.testCondition(condition);
        const setValue = conditionMet ? 0xFF : 0x00;
        const oldValue = this.registers.d[reg];

        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFFFF00) | setValue;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: S${condName} D${reg}                  ; Set ${condName} condition on data register`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (${condName}=${conditionMet ? 'TRUE' : 'FALSE'})`);

        this.cycles += conditionMet ? 6 : 4;
        return {
            name: `S${condName} D${reg}`,
            cycles: conditionMet ? 6 : 4,
            asm: `S${condName} D${reg}`,
            description: `Set ${condName} condition on data register`,
            pc: pc,
            condition: condName,
            conditionMet: conditionMet,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    op_scc_an(condition, reg, condName) {
        const pc = this.registers.pc - 2;
        const conditionMet = this.testCondition(condition);
        const setValue = conditionMet ? 0xFF : 0x00;
        const address = this.registers.a[reg];

        this.memory.writeByte(address, setValue);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: S${condName} (A${reg})               ; Set ${condName} condition in memory`);
        console.log(`       → (A${reg})@0x${address.toString(16)} = ${setValue.toString(16).padStart(2, '0')} (${condName}=${conditionMet ? 'TRUE' : 'FALSE'})`);

        this.cycles += conditionMet ? 12 : 8;
        return {
            name: `S${condName} (A${reg})`,
            cycles: conditionMet ? 12 : 8,
            asm: `S${condName} (A${reg})`,
            description: `Set ${condName} condition in memory`,
            pc: pc,
            condition: condName,
            conditionMet: conditionMet,
            address: address
        };
    }

    // Helper method to test conditions
    testCondition(condition) {
        switch (condition) {
            case 0:  return true;                           // T  - True
            case 1:  return false;                          // F  - False
            case 2:  return !this.flag_c && !this.flag_z;  // HI - High
            case 3:  return this.flag_c || this.flag_z;    // LS - Low or Same
            case 4:  return !this.flag_c;                  // CC - Carry Clear
            case 5:  return this.flag_c;                   // CS - Carry Set
            case 6:  return !this.flag_z;                  // NE - Not Equal
            case 7:  return this.flag_z;                   // EQ - Equal
            case 8:  return !this.flag_v;                  // VC - Overflow Clear
            case 9:  return this.flag_v;                   // VS - Overflow Set
            case 10: return !this.flag_n;                  // PL - Plus
            case 11: return this.flag_n;                   // MI - Minus
            case 12: return this.flag_n === this.flag_v;   // GE - Greater or Equal
            case 13: return this.flag_n !== this.flag_v;   // LT - Less Than
            case 14: return !this.flag_z && (this.flag_n === this.flag_v); // GT - Greater Than
            case 15: return this.flag_z || (this.flag_n !== this.flag_v);  // LE - Less or Equal
            default: return false;
        }
    }
}

module.exports = CriticalOpcodes;