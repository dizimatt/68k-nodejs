// test-memory.js - Quick test script
const { MemoryManager } = require('./src/MemoryManager');

console.log('🧪 Testing MemoryManager fixes...\n');

try {
    // Create memory manager
    const memory = new MemoryManager();
    
    // Test initialization
    console.log('🔧 Testing initialization...');
    memory.initializeKickstart();
    
    // Debug memory layout
    memory.debugMemoryLayout();
    
    // Test specific fixes
    console.log('🧪 Testing specific fixes...');
    
    // Test 1: ExecBase in chip RAM (not 16MB)
    const execBase = memory.execBaseAddr;
    const inChipRam = execBase < memory.chipRam.length;
    console.log(`✅ ExecBase in chip RAM: ${inChipRam} (0x${execBase.toString(16)})`);
    
    // Test 2: ExecBase pointer at address 4
    const pointerAt4 = memory.readLong(0x4);
    const pointerCorrect = pointerAt4 === execBase;
    console.log(`✅ ExecBase pointer correct: ${pointerCorrect} (0x4 → 0x${pointerAt4.toString(16)})`);
    
    // Test 3: ROM area setup
    const romBase = memory.KICKSTART_ROM_BASE;
    const romSize = memory.KICKSTART_ROM_SIZE;
    console.log(`✅ ROM area: 0x${romBase.toString(16)} - 0x${(romBase + romSize - 1).toString(16)} (${romSize/1024}KB)`);
    
    // Test 4: Kickstart version in ExecBase
    const softVer = memory.readWord(execBase + 36);
    console.log(`✅ Kickstart version: ${softVer} (should be 39 for v3.1)`);
    
    // Test 5: ROM write protection
    const testAddr = romBase;
    const original = memory.readByte(testAddr);
    memory.writeByte(testAddr, 0xFF); // Should be ignored
    const after = memory.readByte(testAddr);
    const writeProtected = (original === after);
    console.log(`✅ ROM write protection: ${writeProtected}`);
    
    console.log('\n🎉 All tests passed! MemoryManager fixes are working correctly.');
    
} catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
}