// test-enhanced-parsing.js - Test enhanced ROM parsing
const { MemoryManager } = require('./src/MemoryManager');

console.log('🧪 Testing Enhanced ROM Parsing...\n');

try {
    // Create memory manager
    const memory = new MemoryManager();
    
    // Check available ROMs
    const availableRoms = memory.getAvailableROMs();
    
    if (availableRoms.length === 0) {
        console.log('❌ No ROM files found. Please add ROM files to /roms directory first.');
        console.log('📁 Required: kick40068.A1200 (Kickstart 3.1 for A1200)');
        process.exit(0);
    }
    
    console.log(`✅ Found ${availableRoms.length} ROM(s), testing with: ${availableRoms[0].name}`);
    
    // Load ROM
    console.log('\n🚀 Loading ROM with enhanced parsing...');
    const result = memory.loadDefaultROM();
    console.log(`✅ ${result.message}`);
    
    // Test enhanced parsing results
    console.log('\n🔍 Enhanced Parsing Results:');
    
    // 1. Resident modules
    console.log(`\n📦 Resident Modules: ${memory.residentModules.length} found`);
    memory.residentModules.slice(0, 10).forEach((resident, index) => {
        const vectorInfo = resident.vectorTable ? ` (${resident.vectorTable.length} vectors)` : '';
        console.log(`   ${index + 1}. ${resident.name} v${resident.version}${vectorInfo}`);
        console.log(`      Type: ${resident.type}, Library: ${resident.isLibrary}, Priority: ${resident.priority}`);
        if (resident.idStr) {
            console.log(`      ID: ${resident.idStr.substring(0, 60)}${resident.idStr.length > 60 ? '...' : ''}`);
        }
    });
    
    if (memory.residentModules.length > 10) {
        console.log(`   ... and ${memory.residentModules.length - 10} more residents`);
    }
    
    // 2. Library vectors
    console.log(`\n📚 Library Vector Tables: ${memory.libraryVectors.size} found`);
    for (const [libName, vectors] of memory.libraryVectors) {
        console.log(`   ${libName}: ${vectors.length} vectors`);
        
        // Show first few important vectors
        vectors.slice(0, 5).forEach(vector => {
            console.log(`      - ${vector.name}: 0x${vector.address.toString(16)} (offset ${vector.offset})`);
        });
        
        if (vectors.length > 5) {
            console.log(`      ... and ${vectors.length - 5} more vectors`);
        }
    }
    
    // 3. System libraries analysis
    console.log('\n🏛️ System Libraries Analysis:');
    const sysLibs = memory.systemLibraries || {};
    Object.keys(sysLibs).forEach(libName => {
        const lib = sysLibs[libName];
        if (lib) {
            const vectorCount = lib.vectorTable ? lib.vectorTable.length : 0;
            const functionCount = lib.functionMap ? lib.functionMap.size : 0;
            console.log(`   ✅ ${libName}.library: v${lib.version}, ${vectorCount} vectors, ${functionCount} mapped functions`);
            
            // Show key functions for exec.library
            if (libName === 'exec' && lib.functionMap) {
                console.log('      Key Functions:');
                ['OpenLibrary', 'CloseLibrary', 'AllocMem', 'FreeMem'].forEach(funcName => {
                    const func = lib.functionMap.get(funcName);
                    if (func) {
                        console.log(`         ${funcName}: 0x${func.address.toString(16)} (offset ${func.offset})`);
                    } else {
                        console.log(`         ${funcName}: Not found`);
                    }
                });
            }
        } else {
            console.log(`   ❌ ${libName}.library: Not found`);
        }
    });
    
    // 4. exec.library special analysis
    if (memory.execFunctions) {
        console.log('\n⚡ Exec.library Function Addresses:');
        Object.keys(memory.execFunctions).forEach(funcKey => {
            const func = memory.execFunctions[funcKey];
            if (func) {
                console.log(`   ${funcKey}: 0x${func.address.toString(16)} (offset ${func.offset})`);
            } else {
                console.log(`   ${funcKey}: Not found`);
            }
        });
    }
    
    // 5. Test library function lookup
    console.log('\n🔍 Testing Library Function Lookup:');
    
    // Test with a known exec function address
    if (memory.execFunctions && memory.execFunctions.openLibrary) {
        const testAddr = memory.execFunctions.openLibrary.address;
        const funcInfo = memory.getLibraryFunctionInfo(testAddr);
        
        if (funcInfo) {
            console.log(`   ✅ Address 0x${testAddr.toString(16)} identified as:`);
            console.log(`      Library: ${funcInfo.library}`);
            console.log(`      Function: ${funcInfo.function}`);
            console.log(`      Offset: ${funcInfo.offset}`);
        } else {
            console.log(`   ❌ Failed to identify address 0x${testAddr.toString(16)}`);
        }
    }
    
    // 6. ROM structure validation
    console.log('\n✅ Enhanced Parsing Validation:');
    
    const validationResults = {
        residentsFound: memory.residentModules.length > 0,
        librariesFound: memory.residentModules.filter(r => r.isLibrary).length > 0,
        execLibraryFound: memory.systemLibraries?.exec !== null,
        vectorTablesFound: memory.libraryVectors.size > 0,
        execFunctionsMapped: memory.execFunctions !== undefined
    };
    
    Object.keys(validationResults).forEach(test => {
        const result = validationResults[test];
        console.log(`   ${result ? '✅' : '❌'} ${test}: ${result}`);
    });
    
    // 7. Show debug summary
    console.log('\n📊 Debug Summary:');
    memory.debugROMParsing();
    
    // 8. Success metrics
    const libraryCount = memory.residentModules.filter(r => r.isLibrary).length;
    const totalVectors = Array.from(memory.libraryVectors.values()).reduce((sum, vectors) => sum + vectors.length, 0);
    
    console.log('\n🎉 Enhanced ROM Parsing Complete!');
    console.log(`📊 Results: ${memory.residentModules.length} residents, ${libraryCount} libraries, ${totalVectors} total vectors`);
    
    if (memory.systemLibraries?.exec) {
        console.log('✅ Ready for next phase: Library Jump Table Injection');
    } else {
        console.log('⚠️  exec.library not found - manual analysis may be needed');
    }
    
} catch (error) {
    console.error('❌ Enhanced parsing test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}