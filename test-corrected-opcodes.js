/**
 * Test script for corrected extended opcodes
 * Tests the new non-conflicting opcode implementations
 */

const MusashiInspiredCPU = require('./src/MusashiInspiredCPU');
const MemoryManager = require('./src/MemoryManager');

async function testCorrectedOpcodes() {
    console.log('🧪 Testing Corrected Extended Opcodes...\n');

    const memory = new MemoryManager();
    const cpu = new MusashiInspiredCPU(memory);

    // Initialize CPU
    await cpu.initialize();
    
    // Test stats
    const stats = cpu.opcodeTable.getStats();
    console.log(`📊 Opcode Statistics:`);
    console.log(`   Implemented: ${stats.implemented}`);
    console.log(`   Illegal: ${stats.illegal}`);
    console.log(`   Coverage: ${stats.coverage}`);
    console.log();

    // Test specific opcode ranges for new implementations
    const testRanges = [
        // Extended Immediate Opcodes (0x0000-0x0FFF)
        { range: 'Immediate Operations', start: 0x0000, end: 0x0FFF, expected: 'ORI.B/ORI.W/ORI.L/ANDI/SUBI/ADDI/EORI' },
        
        // Extended Addressing Opcodes (0x1000-0x3FFF)
        { range: 'Addressing Modes', start: 0x1000, end: 0x3FFF, expected: 'MOVE EA,EA variants' },
        
        // Extended Bit Opcodes (0x0800-0x08FF, 0x0100-0x01FF)
        { range: 'Bit Operations', start: 0x0800, end: 0x08FF, expected: 'BTST/BCHG/BCLR/BSET immediate' },
        { range: 'Bit Operations Reg', start: 0x0100, end: 0x01FF, expected: 'BTST/BCHG/BCLR/BSET register' },
        
        // Scc and DBcc (0x50C0-0x50FF)
        { range: 'Condition Codes', start: 0x50C0, end: 0x50FF, expected: 'Scc/DBcc operations' }
    ];

    let totalTests = 0;
    let passedTests = 0;

    for (const testRange of testRanges) {
        console.log(`🔍 Testing ${testRange.range} (${testRange.start.toString(16)}-${testRange.end.toString(16)})`);
        
        let rangeTests = 0;
        let rangePassed = 0;
        
        for (let opcode = testRange.start; opcode <= testRange.end && opcode < 65536; opcode++) {
            const handler = cpu.opcodeTable.get(opcode);
            if (handler !== cpu.op_illegal) {
                rangePassed++;
            }
            rangeTests++;
        }
        
        console.log(`   ${rangePassed}/${rangeTests} opcodes implemented`);
        totalTests += rangeTests;
        passedTests += rangePassed;
    }

    console.log(`\n✅ Test Results:`);
    console.log(`   Total opcodes checked: ${totalTests}`);
    console.log(`   Implemented opcodes: ${passedTests}`);
    console.log(`   Implementation rate: ${(passedTests/totalTests*100).toFixed(2)}%`);

    // Test specific new opcodes
    console.log('\n🔬 Testing Specific New Opcodes:');
    
    const specificTests = [
        { opcode: 0x0200, name: 'ANDI.B #imm,EA', description: 'AND immediate byte to memory' },
        { opcode: 0x0600, name: 'ADDI.B #imm,EA', description: 'ADD immediate byte to memory' },
        { opcode: 0x0800, name: 'BTST.B #imm,EA', description: 'Test bit with immediate' },
        { opcode: 0x1000, name: 'MOVE.B EA,EA', description: 'Memory to memory byte transfer' },
        { opcode: 0x50C0, name: 'ST EA', description: 'Set byte if true' }
    ];

    for (const test of specificTests) {
        const handler = cpu.opcodeTable.get(test.opcode);
        const status = handler !== cpu.op_illegal ? '✅' : '❌';
        console.log(`   ${status} 0x${test.opcode.toString(16).padStart(4, '0')}: ${test.name} - ${test.description}`);
    }

    console.log('\n🎯 Corrected Extended Opcodes Test Complete!');
}

// Run the test
if (require.main === module) {
    testCorrectedOpcodes().catch(console.error);
}

module.exports = testCorrectedOpcodes;