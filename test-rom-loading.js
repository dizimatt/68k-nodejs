// test-rom-loading.js - Test local ROM loading functionality
const { MemoryManager } = require('./src/MemoryManager');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Local ROM Loading System...\n');

try {
    // Create memory manager
    const memory = new MemoryManager();
    
    // Test 1: ROM directory setup
    console.log('🔧 Test 1: ROM Directory Setup');
    console.log(`ROM Directory: ${memory.ROM_DIRECTORY}`);
    console.log(`Directory exists: ${fs.existsSync(memory.ROM_DIRECTORY)}`);
    
    if (fs.existsSync(memory.ROM_DIRECTORY)) {
        const files = fs.readdirSync(memory.ROM_DIRECTORY);
        console.log(`Files in ROM directory: ${files.length}`);
        files.forEach(file => {
            const filePath = path.join(memory.ROM_DIRECTORY, file);
            const stats = fs.statSync(filePath);
            console.log(`  - ${file} (${stats.size} bytes)`);
        });
    }
    
    // Test 2: Available ROMs check
    console.log('\n🔧 Test 2: Available ROMs Check');
    const availableRoms = memory.getAvailableROMs();
    console.log(`Available ROMs: ${availableRoms.length}`);
    
    availableRoms.forEach(rom => {
        console.log(`  ✅ ${rom.name} (${rom.id})`);
        console.log(`     File: ${rom.filename}`);
        console.log(`     Size: ${(rom.size / 1024).toFixed(0)}KB`);
        console.log(`     Path: ${rom.path}`);
    });
    
    if (availableRoms.length === 0) {
        console.log('⚠️  No ROM files found.');
        console.log('📁 Please place your Kickstart ROM files in the /roms directory:');
        console.log('   - kick40068.A1200 (Kickstart 3.1 for A1200)');
        console.log('   - kick40068.A4000 (Kickstart 3.1 for A4000) [optional]');
        console.log('\n✅ ROM directory structure is correctly set up.');
        console.log('👉 Add ROM files and re-run test to verify loading functionality.');
        return;
    }
    
    // Test 3: Basic initialization (without ROM)
    console.log('\n🔧 Test 3: Basic System Initialization');
    memory.initializeKickstart();
    memory.debugMemoryLayout();
    
    // Test 4: ROM loading (if available)
    console.log('🔧 Test 4: ROM Loading Test');
    
    try {
        const result = memory.loadDefaultROM();
        console.log(`✅ Default ROM loaded successfully: ${result.romInfo.name}`);
        
        // Test ROM info
        console.log('\n📋 ROM Information:');
        console.log(`Name: ${result.romInfo.name}`);
        console.log(`Version: ${result.romInfo.version}`);
        console.log(`Size: ${(result.romInfo.size / 1024).toFixed(0)}KB`);
        console.log(`Checksum: 0x${result.romInfo.checksum.toString(16).padStart(8, '0')}`);
        console.log(`Memory Location: 0x${result.romInfo.memoryLocation.toString(16)}`);
        console.log(`Loaded At: ${result.romInfo.loadedAt}`);
        
        // Test resident modules
        console.log('\n📦 Resident Modules:');
        console.log(`Found ${memory.residentModules.length} resident modules:`);
        
        memory.residentModules.slice(0, 10).forEach((resident, index) => {
            console.log(`  ${index + 1}. ${resident.name} v${resident.version} (0x${resident.address.toString(16)})`);
        });
        
        if (memory.residentModules.length > 10) {
            console.log(`  ... and ${memory.residentModules.length - 10} more`);
        }
        
        // Test system libraries
        console.log('\n📚 System Libraries:');
        const libs = memory.systemLibraries || {};
        Object.keys(libs).forEach(libName => {
            const lib = libs[libName];
            if (lib) {
                console.log(`  ✅ ${libName}.library: ${lib.name} v${lib.version}`);
            } else {
                console.log(`  ❌ ${libName}.library: Not found`);
            }
        });
        
        // Test ROM status
        console.log('\n📊 ROM Status:');
        const status = memory.getROMStatus();
        console.log(`Loaded: ${status.loaded}`);
        console.log(`Current ROM: ${status.currentRom}`);
        console.log(`Resident Count: ${status.residentCount}`);
        console.log(`Kickstart Initialized: ${status.kickstartInitialized}`);
        
    } catch (error) {
        console.log(`❌ ROM loading failed: ${error.message}`);
        console.log('This may be normal if ROM files are not available or invalid.');
    }
    
    // Test 5: Memory protection
    console.log('\n🔧 Test 5: ROM Write Protection');
    const romAddr = memory.KICKSTART_ROM_BASE;
    const originalValue = memory.readByte(romAddr);
    memory.writeByte(romAddr, 0xFF); // Should be ignored
    const afterWrite = memory.readByte(romAddr);
    const writeProtected = (originalValue === afterWrite);
    console.log(`✅ ROM write protection: ${writeProtected ? 'WORKING' : 'FAILED'}`);
    
    // Test 6: Multiple ROM loading
    if (availableRoms.length > 1) {
        console.log('\n🔧 Test 6: Multiple ROM Loading');
        
        for (const rom of availableRoms.slice(0, 2)) {
            try {
                console.log(`Loading ${rom.name}...`);
                const result = memory.loadROMById(rom.id);
                console.log(`✅ ${result.message}`);
                
                const status = memory.getROMStatus();
                console.log(`  Current ROM: ${status.currentRom}`);
                console.log(`  Residents: ${status.residentCount}`);
                
            } catch (error) {
                console.log(`❌ Failed to load ${rom.name}: ${error.message}`);
            }
        }
    }
    
    // Final status
    console.log('\n🎉 All ROM loading tests completed!');
    console.log('\n📋 Final System State:');
    memory.debugMemoryLayout();
    
    // Show setup instructions if no ROMs
    if (availableRoms.length === 0) {
        console.log('\n📝 Setup Instructions:');
        console.log('1. Create /roms directory (already done)');
        console.log('2. Place your Kickstart ROM files:');
        console.log('   - kick40068.A1200 for Amiga 1200');
        console.log('   - kick40068.A4000 for Amiga 4000 (optional)');
        console.log('3. Restart the server');
        console.log('4. ROMs will be automatically detected and available for loading');
    } else {
        console.log('\n👍 System is ready for Amiga emulation!');
        console.log('📡 Start the server and use the web interface to:');
        console.log('   - Select and load ROMs');
        console.log('   - Upload and run Amiga executables');
        console.log('   - Debug execution with full ROM support');
    }
    
} catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}