// test-new-opcodes.js - Test script for new extended opcodes

const { MusashiInspiredCPU } = require('./src/MusashiInspiredCPU');
const { MemoryManager } = require('./src/MemoryManager');

async function testNewOpcodes() {
    console.log('🧪 Testing new extended opcodes...\n');
    
    // Create CPU and memory
    const memory = new MemoryManager();
    const cpu = new MusashiInspiredCPU(memory);
    
    // Initialize CPU
    cpu.reset();
    
    // Test program with new opcodes
    const testProgram = [
        // Test ExtendedArithmeticOpcodes
        0xD040, 0x0000,  // ADD.W D0,D0 (test existing)
        0xD080, 0x0001,  // ADD.L D0,D1 (test existing)
        0xD108, 0x0002,  // ADD.B D0,D2 (new)
        0xD148, 0x0003,  // ADD.B D0,D3 (new)
        
        // Test ExtendedLogicalOpcodes
        0xC040, 0x0004,  // AND.W D0,D4 (new)
        0xC080, 0x0005,  // AND.L D0,D5 (new)
        0xC108, 0x0006,  // AND.B D0,D6 (new)
        
        // Test ExtendedShiftOpcodes
        0xE108, 0x0007,  // LSL.B #1,D7 (new)
        0xE188, 0x0000,  // LSL.L #1,D0 (new)
        
        // Test ExtendedBranchOpcodes
        0x6000, 0x0004,  // BRA.W +4 (new)
        0x6100, 0x0002,  // BSR.W +2 (new)
        
        // Test ExtendedSystemOpcodes
        0x4E50, 0x0000,  // LINK.W A0,#0 (new)
        0x4E58, 0x0000,  // UNLK A0 (new)
        
        0x4E75,          // RTS
    ];
    
    // Load test program
    let pc = 0x1000;
    for (const word of testProgram) {
        memory.writeWord(pc, word);
        pc += 2;
    }
    
    // Set initial register values
    cpu.registers.d[0] = 0x12345678;
    cpu.registers.d[1] = 0x87654321;
    cpu.registers.d[2] = 0x000000FF;
    cpu.registers.d[3] = 0x000000AA;
    cpu.registers.d[4] = 0xFFFFFFFF;
    cpu.registers.d[5] = 0x55555555;
    cpu.registers.d[6] = 0xAAAAAAAA;
    cpu.registers.d[7] = 0x11111111;
    
    cpu.registers.a[0] = 0x2000;
    cpu.registers.pc = 0x1000;
    
    console.log('Initial registers:');
    for (let i = 0; i < 8; i++) {
        console.log(`D${i}: 0x${cpu.registers.d[i].toString(16).padStart(8, '0')}`);
    }
    
    console.log('\nExecuting test program...\n');
    
    // Execute instructions
    let cycles = 0;
    let instructions = 0;
    
    try {
        while (cpu.running && instructions < 20) {
            const result = cpu.step();
            cycles += result.cycles;
            instructions++;
            
            if (result.name) {
                console.log(`Executed: ${result.name} (${result.cycles} cycles)`);
            }
            
            if (result.finished) {
                console.log('Program finished');
                break;
            }
        }
        
        console.log('\nFinal registers:');
        for (let i = 0; i < 8; i++) {
            console.log(`D${i}: 0x${cpu.registers.d[i].toString(16).padStart(8, '0')}`);
        }
        
        console.log(`\nTotal cycles: ${cycles}`);
        console.log(`Instructions executed: ${instructions}`);
        
    } catch (error) {
        console.error('Error during execution:', error);
        console.error('PC:', cpu.registers.pc.toString(16));
        console.error('Current instruction:', memory.readWord(cpu.registers.pc - 2).toString(16));
    }
}

// Run the test
if (require.main === module) {
    testNewOpcodes().catch(console.error);
}

module.exports = { testNewOpcodes };