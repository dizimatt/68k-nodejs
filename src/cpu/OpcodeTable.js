// src/cpu/OpcodeTable.js - Opcode Table Setup and Routing

const { BasicOpcodes } = require('./opcodes/BasicOpcodes');
const { MoveOpcodes } = require('./opcodes/MoveOpcodes');
const { ArithmeticOpcodes } = require('./opcodes/ArithmeticOpcodes');
const { LogicalOpcodes } = require('./opcodes/LogicalOpcodes');
const { ShiftOpcodes } = require('./opcodes/ShiftOpcodes');
const { BranchOpcodes } = require('./opcodes/BranchOpcodes');
const { SystemOpcodes } = require('./opcodes/SystemOpcodes');

function setupOpcodeTable(cpu) {
    // Create lookup table for all 65536 possible opcodes
    const opcodeTable = new Array(65536);
    
    // Fill with null (unknown opcode) first
    for (let i = 0; i < 65536; i++) {
        opcodeTable[i] = null;
    }
    
    console.log('🔧 [CPU] Setting up opcode table...');
    
    // Setup opcode categories
    BasicOpcodes.setup(opcodeTable, cpu);
    MoveOpcodes.setup(opcodeTable, cpu);
    ArithmeticOpcodes.setup(opcodeTable, cpu);
    LogicalOpcodes.setup(opcodeTable, cpu);
    ShiftOpcodes.setup(opcodeTable, cpu);
    BranchOpcodes.setup(opcodeTable, cpu);
    SystemOpcodes.setup(opcodeTable, cpu);
    
    // Count implemented opcodes
    let implementedCount = 0;
    for (let i = 0; i < 65536; i++) {
        if (opcodeTable[i] !== null) {
            implementedCount++;
        }
    }
    
    console.log(`✅ [CPU] Opcode table setup complete: ${implementedCount} opcodes implemented`);
    
    return opcodeTable;
}

module.exports = { setupOpcodeTable };