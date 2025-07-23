// src/cpu/opcodes/MediumPriorityOpcodes.js - Medium Priority Instructions (MOVEP, CHK, System registers)

class MediumPriorityOpcodes {
    constructor(cpu) {
        this.cpu = cpu;
    }

    setup(opcodeTable) {
        const cpu = this.cpu;
        console.log('🔧 [CPU] Setting up medium priority opcodes...');

        // MOVEP.W (d16,An),Dn - Move peripheral word from memory to data
        for (let srcReg = 0; srcReg < 8; srcReg++) {
            for (let dstReg = 0; dstReg < 8; dstReg++) {
                const opcode = 0x0108 | (dstReg << 9) | srcReg;
                opcodeTable[opcode] = () => this.op_movep_w_d16_a_d.call(cpu, srcReg, dstReg);
            }
        }

        // MOVEP.L (d16,An),Dn - Move peripheral long from memory to data
        for (let srcReg = 0; srcReg < 8; srcReg++) {
            for (let dstReg = 0; dstReg < 8; dstReg++) {
                const opcode = 0x0148 | (dstReg << 9) | srcReg;
                opcodeTable[opcode] = () => this.op_movep_l_d16_a_d.call(cpu, srcReg, dstReg);
            }
        }

        // MOVEP.W Dn,(d16,An) - Move peripheral word from data to memory
        for (let srcReg = 0; srcReg < 8; srcReg++) {
            for (let dstReg = 0; dstReg < 8; dstReg++) {
                const opcode = 0x0188 | (srcReg << 9) | dstReg;
                opcodeTable[opcode] = () => this.op_movep_w_d_d16_a.call(cpu, srcReg, dstReg);
            }
        }

        // MOVEP.L Dn,(d16,An) - Move peripheral long from data to memory
        for (let srcReg = 0; srcReg < 8; srcReg++) {
            for (let dstReg = 0; dstReg < 8; dstReg++) {
                const opcode = 0x01C8 | (srcReg << 9) | dstReg;
                opcodeTable[opcode] = () => this.op_movep_l_d_d16_a.call(cpu, srcReg, dstReg);
            }
        }

        // CHK.W Dn,Dm - Check register against bounds (word)
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x4180 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_chk_w_d_d.call(cpu, src, dst);
            }
        }

        // CHK.W #imm,Dn - Check register against immediate bounds (word)
        for (let dst = 0; dst < 8; dst++) {
            const opcode = 0x41FC | (dst << 9);
            opcodeTable[opcode] = () => this.op_chk_w_imm_d.call(cpu, dst);
        }

        // CHK.W (An),Dn - Check register against memory bounds (word)
        for (let src = 0; src < 8; src++) {
            for (let dst = 0; dst < 8; dst++) {
                const opcode = 0x4190 | (dst << 9) | src;
                opcodeTable[opcode] = () => this.op_chk_w_an_d.call(cpu, src, dst);
            }
        }

        // MOVE from SR - Move from status register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x40C0 | reg;
            opcodeTable[opcode] = () => this.op_move_sr_d.call(cpu, reg);
        }

        // MOVE to SR - Move to status register (privileged)
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x46C0 | reg;
            opcodeTable[opcode] = () => this.op_move_d_sr.call(cpu, reg);
        }

        // MOVE from CCR - Move from condition code register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x42C0 | reg;
            opcodeTable[opcode] = () => this.op_move_ccr_d.call(cpu, reg);
        }

        // MOVE to CCR - Move to condition code register
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x44C0 | reg;
            opcodeTable[opcode] = () => this.op_move_d_ccr.call(cpu, reg);
        }

        // MOVE from USP - Move from user stack pointer (privileged)
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4E68 | reg;
            opcodeTable[opcode] = () => this.op_move_usp_a.call(cpu, reg);
        }

        // MOVE to USP - Move to user stack pointer (privileged)
        for (let reg = 0; reg < 8; reg++) {
            const opcode = 0x4E60 | reg;
            opcodeTable[opcode] = () => this.op_move_a_usp.call(cpu, reg);
        }

        // STOP #imm - Stop processor until interrupt (privileged)
        opcodeTable[0x4E72] = () => this.op_stop.call(cpu);

        // TRAPV - Trap on overflow
        opcodeTable[0x4E76] = () => this.op_trapv.call(cpu);

        // RTR - Return and restore condition codes
        opcodeTable[0x4E77] = () => this.op_rtr.call(cpu);

        // ILLEGAL - Illegal instruction
        opcodeTable[0x4AFC] = () => this.op_illegal.call(cpu);

        console.log('✅ [CPU] Medium priority opcodes setup complete');
    }

    // MOVEP implementations - Move Peripheral
    op_movep_w_d16_a_d(srcReg, dstReg) {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        const baseAddr = (this.registers.a[srcReg] + signedDisp) >>> 0;
        
        // Read bytes from alternate memory locations (peripheral device access)
        const highByte = this.memory.readByte(baseAddr);
        const lowByte = this.memory.readByte(baseAddr + 2);
        
        const result = (highByte << 8) | lowByte;
        const oldValue = this.registers.d[dstReg];
        
        this.registers.d[dstReg] = (this.registers.d[dstReg] & 0xFFFF0000) | result;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEP.W (${signedDisp},A${srcReg}),D${dstReg}   ; Move peripheral word from memory`);
        console.log(`       → D${dstReg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[dstReg].toString(16).padStart(8, '0')} (from 0x${baseAddr.toString(16)}+2)`);

        this.cycles += 16;
        return {
            name: `MOVEP.W (${signedDisp},A${srcReg}),D${dstReg}`,
            cycles: 16,
            asm: `MOVEP.W (${signedDisp},A${srcReg}),D${dstReg}`,
            description: 'Move peripheral word from memory to data register',
            pc: pc,
            displacement: displacement,
            oldValue: oldValue,
            newValue: this.registers.d[dstReg],
            address: baseAddr
        };
    }

    op_movep_l_d16_a_d(srcReg, dstReg) {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        const baseAddr = (this.registers.a[srcReg] + signedDisp) >>> 0;
        
        // Read bytes from alternate memory locations
        const byte3 = this.memory.readByte(baseAddr);
        const byte2 = this.memory.readByte(baseAddr + 2);
        const byte1 = this.memory.readByte(baseAddr + 4);
        const byte0 = this.memory.readByte(baseAddr + 6);
        
        const result = (byte3 << 24) | (byte2 << 16) | (byte1 << 8) | byte0;
        const oldValue = this.registers.d[dstReg];
        
        this.registers.d[dstReg] = result >>> 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEP.L (${signedDisp},A${srcReg}),D${dstReg}   ; Move peripheral long from memory`);
        console.log(`       → D${dstReg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${result.toString(16).padStart(8, '0')} (from 0x${baseAddr.toString(16)}+2+4+6)`);

        this.cycles += 24;
        return {
            name: `MOVEP.L (${signedDisp},A${srcReg}),D${dstReg}`,
            cycles: 24,
            asm: `MOVEP.L (${signedDisp},A${srcReg}),D${dstReg}`,
            description: 'Move peripheral long from memory to data register',
            pc: pc,
            displacement: displacement,
            oldValue: oldValue,
            newValue: result,
            address: baseAddr
        };
    }

    op_movep_w_d_d16_a(srcReg, dstReg) {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        const baseAddr = (this.registers.a[dstReg] + signedDisp) >>> 0;
        const value = this.registers.d[srcReg] & 0xFFFF;
        
        // Write bytes to alternate memory locations
        this.memory.writeByte(baseAddr, (value >> 8) & 0xFF);
        this.memory.writeByte(baseAddr + 2, value & 0xFF);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEP.W D${srcReg},(${signedDisp},A${dstReg})   ; Move peripheral word to memory`);
        console.log(`       → D${srcReg}(0x${value.toString(16).padStart(4, '0')}) → (0x${baseAddr.toString(16)}+2)`);

        this.cycles += 16;
        return {
            name: `MOVEP.W D${srcReg},(${signedDisp},A${dstReg})`,
            cycles: 16,
            asm: `MOVEP.W D${srcReg},(${signedDisp},A${dstReg})`,
            description: 'Move peripheral word from data register to memory',
            pc: pc,
            displacement: displacement,
            value: value,
            address: baseAddr
        };
    }

    op_movep_l_d_d16_a(srcReg, dstReg) {
        const pc = this.registers.pc - 2;
        const displacement = this.fetchWord();
        const signedDisp = (displacement & 0x8000) ? (displacement | 0xFFFF0000) : displacement;
        const baseAddr = (this.registers.a[dstReg] + signedDisp) >>> 0;
        const value = this.registers.d[srcReg] >>> 0;
        
        // Write bytes to alternate memory locations
        this.memory.writeByte(baseAddr, (value >> 24) & 0xFF);
        this.memory.writeByte(baseAddr + 2, (value >> 16) & 0xFF);
        this.memory.writeByte(baseAddr + 4, (value >> 8) & 0xFF);
        this.memory.writeByte(baseAddr + 6, value & 0xFF);

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVEP.L D${srcReg},(${signedDisp},A${dstReg})   ; Move peripheral long to memory`);
        console.log(`       → D${srcReg}(0x${value.toString(16).padStart(8, '0')}) → (0x${baseAddr.toString(16)}+2+4+6)`);

        this.cycles += 24;
        return {
            name: `MOVEP.L D${srcReg},(${signedDisp},A${dstReg})`,
            cycles: 24,
            asm: `MOVEP.L D${srcReg},(${signedDisp},A${dstReg})`,
            description: 'Move peripheral long from data register to memory',
            pc: pc,
            displacement: displacement,
            value: value,
            address: baseAddr
        };
    }

    // CHK implementations - Check Register Against Bounds
    op_chk_w_d_d(src, dst) {
        const pc = this.registers.pc - 2;
        const upperBound = this.registers.d[src] & 0xFFFF;
        const testValue = this.registers.d[dst] & 0xFFFF;
        const testSigned = (testValue & 0x8000) ? (testValue | 0xFFFF0000) : testValue;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: CHK.W D${src},D${dst}              ; Check register against bounds`);
        console.log(`       → Check: D${dst}(${testSigned}) against bounds 0 to ${upperBound}`);

        // Check if value is negative
        if (testSigned < 0) {
            this.flag_n = 1;
            console.log(`🔴 [EXEC]        CHK TRAP: Value ${testSigned} is negative!`);
            this.exception_chk();
            return {
                name: `CHK.W D${src},D${dst}`,
                cycles: 40,
                asm: `CHK.W D${src},D${dst}`,
                description: 'Check register against bounds (NEGATIVE)',
                pc: pc,
                exception: true
            };
        }

        // Check if value is greater than upper bound
        if (testValue > upperBound) {
            this.flag_n = 0;
            console.log(`🔴 [EXEC]        CHK TRAP: Value ${testValue} > upper bound ${upperBound}!`);
            this.exception_chk();
            return {
                name: `CHK.W D${src},D${dst}`,
                cycles: 40,
                asm: `CHK.W D${src},D${dst}`,
                description: 'Check register against bounds (OUT OF BOUNDS)', 
                pc: pc,
                exception: true
            };
        }

        // Value is within bounds
        console.log(`✅ [EXEC]        CHK OK: Value ${testValue} is within bounds`);
        this.cycles += 10;
        return {
            name: `CHK.W D${src},D${dst}`,
            cycles: 10,
            asm: `CHK.W D${src},D${dst}`,
            description: 'Check register against bounds (OK)',
            pc: pc
        };
    }

    op_chk_w_imm_d(dst) {
        const pc = this.registers.pc - 2;
        const upperBound = this.fetchWord();
        const testValue = this.registers.d[dst] & 0xFFFF;
        const testSigned = (testValue & 0x8000) ? (testValue | 0xFFFF0000) : testValue;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: CHK.W #$${upperBound.toString(16).padStart(4, '0')},D${dst}         ; Check register against immediate bounds`);
        console.log(`       → Check: D${dst}(${testSigned}) against bounds 0 to ${upperBound}`);

        if (testSigned < 0) {
            this.flag_n = 1;
            console.log(`🔴 [EXEC]        CHK TRAP: Value ${testSigned} is negative!`);
            this.exception_chk();
            return {
                name: `CHK.W #$${upperBound.toString(16).padStart(4, '0')},D${dst}`,
                cycles: 40,
                asm: `CHK.W #$${upperBound.toString(16).padStart(4, '0')},D${dst}`,
                description: 'Check register against immediate bounds (NEGATIVE)',
                pc: pc,
                immediate: upperBound,
                exception: true
            };
        }

        if (testValue > upperBound) {
            this.flag_n = 0;
            console.log(`🔴 [EXEC]        CHK TRAP: Value ${testValue} > upper bound ${upperBound}!`);
            this.exception_chk();
            return {
                name: `CHK.W #$${upperBound.toString(16).padStart(4, '0')},D${dst}`,
                cycles: 40,
                asm: `CHK.W #$${upperBound.toString(16).padStart(4, '0')},D${dst}`,
                description: 'Check register against immediate bounds (OUT OF BOUNDS)',
                pc: pc,
                immediate: upperBound,
                exception: true
            };
        }

        console.log(`✅ [EXEC]        CHK OK: Value ${testValue} is within bounds`);
        this.cycles += 14;
        return {
            name: `CHK.W #$${upperBound.toString(16).padStart(4, '0')},D${dst}`,
            cycles: 14,
            asm: `CHK.W #$${upperBound.toString(16).padStart(4, '0')},D${dst}`,
            description: 'Check register against immediate bounds (OK)',
            pc: pc,
            immediate: upperBound
        };
    }

    op_chk_w_an_d(src, dst) {
        const pc = this.registers.pc - 2;
        const address = this.registers.a[src];
        const upperBound = this.memory.readWord(address);
        const testValue = this.registers.d[dst] & 0xFFFF;
        const testSigned = (testValue & 0x8000) ? (testValue | 0xFFFF0000) : testValue;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: CHK.W (A${src}),D${dst}            ; Check register against memory bounds`);
        console.log(`       → Check: D${dst}(${testSigned}) against bounds 0 to ${upperBound} from (A${src})@0x${address.toString(16)}`);

        if (testSigned < 0) {
            this.flag_n = 1;
            console.log(`🔴 [EXEC]        CHK TRAP: Value ${testSigned} is negative!`);
            this.exception_chk();
            return {
                name: `CHK.W (A${src}),D${dst}`,
                cycles: 40,
                asm: `CHK.W (A${src}),D${dst}`,
                description: 'Check register against memory bounds (NEGATIVE)',
                pc: pc,
                address: address,
                exception: true
            };
        }

        if (testValue > upperBound) {
            this.flag_n = 0;
            console.log(`🔴 [EXEC]        CHK TRAP: Value ${testValue} > upper bound ${upperBound}!`);
            this.exception_chk();
            return {
                name: `CHK.W (A${src}),D${dst}`,
                cycles: 40,
                asm: `CHK.W (A${src}),D${dst}`,
                description: 'Check register against memory bounds (OUT OF BOUNDS)',
                pc: pc,
                address: address,
                exception: true
            };
        }

        console.log(`✅ [EXEC]        CHK OK: Value ${testValue} is within bounds`);
        this.cycles += 18;
        return {
            name: `CHK.W (A${src}),D${dst}`,
            cycles: 18,
            asm: `CHK.W (A${src}),D${dst}`,
            description: 'Check register against memory bounds (OK)',
            pc: pc,
            address: address
        };
    }

    // System register move implementations
    op_move_sr_d(reg) {
        const pc = this.registers.pc - 2;
        const oldValue = this.registers.d[reg];
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFF0000) | this.registers.sr;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE SR,D${reg}              ; Move from status register`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (SR=0x${this.registers.sr.toString(16).padStart(4, '0')})`);

        this.cycles += 6;
        return {
            name: `MOVE SR,D${reg}`,
            cycles: 6,
            asm: `MOVE SR,D${reg}`,
            description: 'Move from status register',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    op_move_d_sr(reg) {
        const pc = this.registers.pc - 2;
        
        if (!this.flag_s) {
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE D${reg},SR              ; PRIVILEGE VIOLATION!`);
            this.exception_privilege_violation();
            return {
                name: `MOVE D${reg},SR`,
                cycles: 4,
                asm: `MOVE D${reg},SR`,
                description: 'Move to status register (PRIVILEGE VIOLATION)',
                pc: pc,
                exception: true
            };
        }

        const newSR = this.registers.d[reg] & 0xFFFF;
        const oldSR = this.registers.sr;
        
        this.registers.sr = newSR;
        this.updateFlagsFromSR();

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE D${reg},SR              ; Move to status register`);
        console.log(`       → SR: 0x${oldSR.toString(16).padStart(4, '0')} → 0x${newSR.toString(16).padStart(4, '0')} (from D${reg})`);

        this.cycles += 12;
        return {
            name: `MOVE D${reg},SR`,
            cycles: 12,
            asm: `MOVE D${reg},SR`,
            description: 'Move to status register',
            pc: pc,
            oldValue: oldSR,
            newValue: newSR
        };
    }

    op_move_ccr_d(reg) {
        const pc = this.registers.pc - 2;
        const ccr = this.registers.sr & 0xFF;
        const oldValue = this.registers.d[reg];
        
        this.registers.d[reg] = (this.registers.d[reg] & 0xFFFFFF00) | ccr;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE CCR,D${reg}             ; Move from condition code register`);
        console.log(`       → D${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.d[reg].toString(16).padStart(8, '0')} (CCR=0x${ccr.toString(16).padStart(2, '0')})`);

        this.cycles += 6;
        return {
            name: `MOVE CCR,D${reg}`,
            cycles: 6,
            asm: `MOVE CCR,D${reg}`,
            description: 'Move from condition code register',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.d[reg]
        };
    }

    op_move_d_ccr(reg) {
        const pc = this.registers.pc - 2;
        const newCCR = this.registers.d[reg] & 0xFF;
        const oldSR = this.registers.sr;
        
        this.registers.sr = (this.registers.sr & 0xFF00) | newCCR;
        this.updateFlagsFromSR();

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE D${reg},CCR             ; Move to condition code register`);
        console.log(`       → CCR: 0x${(oldSR & 0xFF).toString(16).padStart(2, '0')} → 0x${newCCR.toString(16).padStart(2, '0')} (from D${reg})`);

        this.cycles += 12;
        return {
            name: `MOVE D${reg},CCR`,
            cycles: 12,
            asm: `MOVE D${reg},CCR`,
            description: 'Move to condition code register',
            pc: pc,
            oldValue: oldSR & 0xFF,
            newValue: newCCR
        };
    }

    op_move_usp_a(reg) {
        const pc = this.registers.pc - 2;
        
        if (!this.flag_s) {
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE USP,A${reg}            ; PRIVILEGE VIOLATION!`);
            this.exception_privilege_violation();
            return {
                name: `MOVE USP,A${reg}`,
                cycles: 4,
                asm: `MOVE USP,A${reg}`,
                description: 'Move from user stack pointer (PRIVILEGE VIOLATION)',
                pc: pc,
                exception: true
            };
        }

        const oldValue = this.registers.a[reg];
        this.registers.a[reg] = this.userStackPointer || 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE USP,A${reg}            ; Move from user stack pointer`);
        console.log(`       → A${reg}: 0x${oldValue.toString(16).padStart(8, '0')} → 0x${this.registers.a[reg].toString(16).padStart(8, '0')} (USP)`);

        this.cycles += 4;
        return {
            name: `MOVE USP,A${reg}`,
            cycles: 4,
            asm: `MOVE USP,A${reg}`,
            description: 'Move from user stack pointer',
            pc: pc,
            oldValue: oldValue,
            newValue: this.registers.a[reg]
        };
    }

    op_move_a_usp(reg) {
        const pc = this.registers.pc - 2;
        
        if (!this.flag_s) {
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE A${reg},USP            ; PRIVILEGE VIOLATION!`);
            this.exception_privilege_violation();
            return {
                name: `MOVE A${reg},USP`,
                cycles: 4,
                asm: `MOVE A${reg},USP`,
                description: 'Move to user stack pointer (PRIVILEGE VIOLATION)',
                pc: pc,
                exception: true
            };
        }

        const oldUSP = this.userStackPointer || 0;
        this.userStackPointer = this.registers.a[reg];

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: MOVE A${reg},USP            ; Move to user stack pointer`);
        console.log(`       → USP: 0x${oldUSP.toString(16).padStart(8, '0')} → 0x${this.userStackPointer.toString(16).padStart(8, '0')} (from A${reg})`);

        this.cycles += 4;
        return {
            name: `MOVE A${reg},USP`,
            cycles: 4,
            asm: `MOVE A${reg},USP`,
            description: 'Move to user stack pointer',
            pc: pc,
            oldValue: oldUSP,
            newValue: this.userStackPointer
        };
    }

    // System control implementations
    op_stop() {
        const pc = this.registers.pc - 2;
        
        if (!this.flag_s) {
            console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: STOP #data               ; PRIVILEGE VIOLATION!`);
            this.exception_privilege_violation();
            return {
                name: 'STOP #data',
                cycles: 4,
                asm: 'STOP #data',
                description: 'Stop processor until interrupt (PRIVILEGE VIOLATION)',
                pc: pc,
                exception: true
            };
        }

        const immediate = this.fetchWord();
        const oldSR = this.registers.sr;
        
        this.registers.sr = immediate;
        this.updateFlagsFromSR();
        this.stopped = true;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: STOP #$${immediate.toString(16).padStart(4, '0')}              ; Stop processor until interrupt`);
        console.log(`       → SR: 0x${oldSR.toString(16).padStart(4, '0')} → 0x${immediate.toString(16).padStart(4, '0')}, processor STOPPED`);

        this.cycles += 4;
        return {
            name: `STOP #$${immediate.toString(16).padStart(4, '0')}`,
            cycles: 4,
            asm: `STOP #$${immediate.toString(16).padStart(4, '0')}`,
            description: 'Stop processor until interrupt',
            pc: pc,
            immediate: immediate,
            stopped: true
        };
    }

    op_trapv() {
        const pc = this.registers.pc - 2;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: TRAPV                  ; Trap on overflow`);

        if (this.flag_v) {
            console.log(`🔴 [EXEC]        TRAPV: Overflow flag set, generating trap!`);
            this.exception_trapv();
            return {
                name: 'TRAPV',
                cycles: 34,
                asm: 'TRAPV',
                description: 'Trap on overflow (TRAP TAKEN)',
                pc: pc,
                exception: true
            };
        }

        console.log(`✅ [EXEC]        TRAPV: No overflow, continuing`);
        this.cycles += 4;
        return {
            name: 'TRAPV',
            cycles: 4,
            asm: 'TRAPV',
            description: 'Trap on overflow (NO TRAP)',
            pc: pc
        };
    }

    op_rtr() {
        const pc = this.registers.pc - 2;
        const oldSR = this.registers.sr;
        
        // Pull CCR from stack
        const newCCR = this.pullWord() & 0xFF;
        this.registers.sr = (this.registers.sr & 0xFF00) | newCCR;
        this.updateFlagsFromSR();
        
        // Pull return address from stack
        const returnAddr = this.pullLong();
        this.registers.pc = returnAddr >>> 0;

        console.log(`🟢 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: RTR                    ; Return and restore condition codes`);
        console.log(`       → CCR: 0x${(oldSR & 0xFF).toString(16).padStart(2, '0')} → 0x${newCCR.toString(16).padStart(2, '0')}, PC → 0x${returnAddr.toString(16).padStart(8, '0')}`);

        this.cycles += 20;
        return {
            name: 'RTR',
            cycles: 20,
            asm: 'RTR',
            description: 'Return and restore condition codes',
            pc: pc,
            target: returnAddr
        };
    }

    op_illegal() {
        const pc = this.registers.pc - 2;

        console.log(`🔴 [EXEC] 0x${pc.toString(16).padStart(8, '0')}: ILLEGAL                ; Illegal instruction trap`);
        
        this.exception_illegal_instruction();

        this.cycles += 34;
        return {
            name: 'ILLEGAL',
            cycles: 34,
            asm: 'ILLEGAL',
            description: 'Illegal instruction trap',
            pc: pc,
            exception: true
        };
    }
}

module.exports = MediumPriorityOpcodes;