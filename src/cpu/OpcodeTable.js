// src/cpu/OpcodeTable.js - Opcode Table Setup and Routing


// New extended opcode modules (non-conflicting)
const SystemOpcodes = require('./opcodes/SystemOpcodes');
const ShiftOpcodes = require('./opcodes/ShiftOpcodes');
const LogicalOpcodes = require('./opcodes/LogicalOpcodes');
const MoveOpcodes = require('./opcodes/MoveOpcodes');
const BranchOpcodes = require('./opcodes/BranchOpcodes');
const BasicOpcodes  = require('./opcodes/BasicOpcodes');
const ArithmeticOpcodes = require('./opcodes/ArithmeticOpcodes');
const CriticalOpcodes = require('./opcodes/CriticalOpcodes');
const HighPriorityOpcodes = require('./opcodes/HighPriorityOpcodes');
const MediumPriorityOpcodes = require('./opcodes/MediumPriorityOpcodes');
const LowPriorityOpcodes = require('./opcodes/LowPriorityOpcodes');
const Mc68020ExtendedOpcodes = require('./opcodes/Mc68020ExtendedOpcodes');
const ExtendedImmediateOpcodes = require('./opcodes/ExtendedImmediateOpcodes');
const ExtendedAddressingOpcodes = require('./opcodes/ExtendedAddressingOpcodes');
const ExtendedBitOpcodes = require('./opcodes/ExtendedBitOpcodes');

class OpcodeTable {
    constructor(cpu) {
        this.cpu = cpu;
        this.table = new Array(65536);
        this.initialize();
    }

    initialize() {
        // Initialize all opcodes to illegal instruction
        for (let i = 0; i < 65536; i++) {
            this.table[i] = null;
        }
        
        console.log('🔧 [CPU] Setting up opcode table...');
 

        // Initialize all opcode modules
        const modules = [
            new SystemOpcodes(this.cpu),
            new ShiftOpcodes(this.cpu),
            new LogicalOpcodes(this.cpu),
            new MoveOpcodes(this.cpu),
            new BranchOpcodes(this.cpu),
            new BasicOpcodes(this.cpu),
            new ArithmeticOpcodes(this.cpu),
            new CriticalOpcodes(this.cpu),
            new HighPriorityOpcodes(this.cpu),
            new MediumPriorityOpcodes(this.cpu),
            new LowPriorityOpcodes(this.cpu),
            new Mc68020ExtendedOpcodes(this.cpu),
            new ExtendedImmediateOpcodes(this.cpu),
            new ExtendedAddressingOpcodes(this.cpu),
            new ExtendedBitOpcodes(this.cpu)
        ];

        // Setup each module
        // Setup opcode categories

        modules.forEach(module => {
            module.setup(this.table);
        });

        // Count implemented opcodes
        let implementedCount = 0;
        for (let i = 0; i < 65536; i++) {
            if (this.table[i] !== null ) {
                implementedCount++;
            }
        }
    
        console.log(`✅ [CPU] Opcode table setup complete: ${implementedCount} opcodes implemented`);
        console.log(`✅ EXTENDED Opcode table initialized with ${modules.length} modules`);
    }

    get(opcode) {
        return this.table[opcode];
    }

    set(opcode, handler) {
        this.table[opcode] = handler;
    }

    getStats() {
        let implemented = 0;
        let illegal = 0;
        
        for (let i = 0; i < 65536; i++) {
            if (this.table[i] !== this.cpu.op_illegal) {
                implemented++;
            } else {
                illegal++;
            }
        }
        
        return {
            implemented,
            illegal,
            total: 65536,
            coverage: (implemented / 65536 * 100).toFixed(2) + '%'
        };
    }
}

module.exports = OpcodeTable;