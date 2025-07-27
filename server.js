const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { AmigaInterpreter } = require('./src/AmigaInterpreter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Allow all files for now - we'll validate Amiga format later
        cb(null, true);
    }
});

// *** FIX: Initialize interpreter at startup ***
console.log('🚀 [SERVER] Initializing Amiga interpreter...');
let interpreter = new AmigaInterpreter();
console.log('✅ [SERVER] Interpreter initialized - ROM endpoints ready');


// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('executable'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`Received file: ${req.file.originalname}, size: ${req.file.buffer.length} bytes`);

        // Reset existing interpreter (preserves ROM if loaded)
        interpreter.reset();
        
        // Load and validate the executable
        const result = interpreter.loadExecutable(req.file.buffer);
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({ 
            success: true, 
            message: 'Executable loaded successfully',
            info: result.info
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process executable: ' + error.message });
    }
});

app.post('/run', (req, res) => {
    try {
        if (!interpreter) {
            return res.status(400).json({ error: 'No executable loaded' });
        }

        // Start execution
        const result = interpreter.run();
        
        res.json({
            success: true,
            message: 'Execution started',
            state: result
        });

    } catch (error) {
        console.error('Execution error:', error);
        res.status(500).json({ error: 'Execution failed: ' + error.message });
    }
});

app.get('/step', (req, res) => {
    try {
        if (!interpreter) {
            return res.status(400).json({ error: 'No executable loaded' });
        }

        const result = interpreter.step();
        
        res.json({
            success: true,
            cpu: {
                pc: result.cpu.pc,
                registers: result.cpu.registers,
                flags: result.cpu.flags,
                stats: result.cpu.stats,
                finished: result.cpu.finished,
                error: result.cpu.error,
                running: result.cpu.running,
                instruction: result.cpu.instruction,
                cycles: result.cpu.cycles,
                // Enhanced debug information
                asm: result.cpu.asm,
                description: result.cpu.description,
                oldValue: result.cpu.oldValue,
                newValue: result.cpu.newValue,
                target: result.cpu.target,
                immediate: result.cpu.immediate,
                // Next instruction preview
                nextInstruction: result.cpu.nextInstruction
            },
            memory: result.memory,
            display: result.display,
            message: result.message
        });

    } catch (error) {
        console.error('Step error:', error);
        res.status(500).json({ error: 'Step failed: ' + error.message });
    }
});

// *** NEW: Get current CPU state ***
app.get('/cpu/state', (req, res) => {
    try {
        if (!interpreter || !interpreter.cpu) {
            return res.status(400).json({ error: 'CPU not initialized' });
        }

        const stats = interpreter.cpu.getStatistics();
        const registers = interpreter.cpu.getRegisters();

        res.json({
            success: true,
            totalInstructions: stats.totalInstructions || 0,
            totalCycles: stats.totalCycles || 0,
            implementedOpcodes: stats.implementedOpcodes || 0,
            implementedPercent: stats.implementedPercent || "0.00",
            cpuType: stats.cpuType || "Unknown",
            registers: registers,
            running: interpreter.cpu.isRunning(),
            initialized: interpreter.cpu.isInitialized()
        });

    } catch (error) {
        console.error('CPU state error:', error);
        res.status(500).json({ error: 'Failed to get CPU state: ' + error.message });
    }
});

app.get('/reset', (req, res) => {
    try {
        if (interpreter) {
            interpreter.reset();
        }
        res.json({ success: true, message: 'Interpreter reset' });
    } catch (error) {
        res.status(500).json({ error: 'Reset failed: ' + error.message });
    }
});
app.get('/stats', (req, res) => {
    try {
        if (!interpreter) {
            return res.status(400).json({ error: 'No executable loaded' });
        }

        const stats = interpreter.getDetailedStats();
        
        res.json({
            success: true,
            statistics: stats
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics: ' + error.message });
    }
});

// Add this endpoint to your server.js
app.get('/memory', (req, res) => {
    try {
        if (!interpreter || !interpreter.memory) {
            return res.status(400).json({ error: 'No executable loaded' });
        }

        let address = req.query.address || '0x0';
        let size = parseInt(req.query.size) || 256;
        
        if (typeof address === 'string') {
            address = parseInt(address.replace('0x', ''), 16);
        }
        
        size = Math.min(size, 1024); // Limit size
        
        const memoryData = [];
        for (let i = 0; i < size; i++) {
            const byte = interpreter.memory.readByte(address + i);
            memoryData.push(byte);
        }
        
        res.json({
            success: true,
            address: address,
            size: size,
            memory: memoryData
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to read memory: ' + error.message });
    }
});

// Debug endpoint to manually fix jump vector
app.post('/debug/fix-jump-vector', (req, res) => {
    try {
        const memory = interpreter.memory;
        const jumpVectorAddr = 0x1D8;  // OpenLibrary jump vector
        const targetAddr = 0x20000;    // RAM stub address
        
        // Write JMP 0x00020000 instruction
        memory.writeWord(jumpVectorAddr, 0x4EF9);        // JMP absolute.L
        memory.writeLong(jumpVectorAddr + 2, targetAddr); // Target 0x20000
        
        res.json({
            success: true,
            message: 'Jump vector manually fixed',
            jumpVector: jumpVectorAddr,
            target: targetAddr,
            instruction: `JMP $${targetAddr.toString(16).padStart(8, '0')}`
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fix jump vector: ' + error.message });
    }
});

// Debug endpoint to create OpenLibrary stub
app.post('/debug/create-stub', (req, res) => {
    try {
        const memory = interpreter.memory;
        memory.createOpenLibraryStub(0x20000);
        
        res.json({
            success: true,
            message: 'OpenLibrary stub created at 0x20000'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create stub: ' + error.message });
    }
});

// Debug endpoint to test single instruction disassembly
app.get('/debug/disasm/:address', (req, res) => {
    try {
        const address = parseInt(req.params.address, 16);
        
        if (!interpreter.kickstartDisassembler) {
            return res.status(400).json({
                success: false,
                error: 'Kickstart disassembler not initialized'
            });
        }
        
        // Test disassembly of single instruction
        const instruction = interpreter.kickstartDisassembler.disassembleInstructionAtPC(address);
        
        res.json({
            success: true,
            address: address,
            addressHex: `0x${address.toString(16)}`,
            instruction: instruction
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to disassemble instruction: ' + error.message });
    }
});

// Debug endpoint to inspect specific addresses
app.get('/debug/address/:address', (req, res) => {
    try {
        const address = parseInt(req.params.address, 16);
        const memory = interpreter.memory;
        
        // Read 16 bytes starting from address
        const data = [];
        for (let i = 0; i < 16; i++) {
            data.push(memory.readByte(address + i));
        }
        
        // Also check if this is a known jump vector
        const execBase = memory.execBaseAddr || 0;
        const isJumpVector = address >= execBase - 552 && address < execBase;
        
        res.json({
            success: true,
            address: address,
            addressHex: `0x${address.toString(16)}`,
            data: data,
            dataHex: data.map(b => `0x${b.toString(16).padStart(2, '0')}`),
            execBase: execBase,
            isJumpVector: isJumpVector,
            interpretation: interpretBytes(data)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to debug address: ' + error.message });
    }
});

function interpretBytes(data) {
    if (data.length >= 6) {
        const word1 = (data[0] << 8) | data[1];
        const long1 = (data[2] << 24) | (data[3] << 16) | (data[4] << 8) | data[5];
        
        if (word1 === 0x4EF9) {
            return `JMP $${long1.toString(16).padStart(8, '0')}`;
        } else if (word1 === 0x4E71 && ((data[2] << 8) | data[3]) === 0x4E75) {
            return "NOP; RTS (stub)";
        }
    }
    
    if (data.every(b => b === 0)) {
        return "Empty/uninitialized";
    }
    
    return "Unknown";
}

// kickstart rom functions...
// Add these endpoints to your server.js

// *** NEW: Get available ROMs ***
app.get('/roms/available', (req, res) => {
    try {
        if (!interpreter || !interpreter.memory) {
            return res.status(500).json({ error: 'Memory manager not initialized' });
        }

        const availableRoms = interpreter.memory.getAvailableROMs();
        const romStatus = interpreter.memory.getROMStatus();

        res.json({
            success: true,
            available: availableRoms,
            current: romStatus.currentRom,
            status: romStatus
        });

    } catch (error) {
        console.error('ROM list error:', error);
        res.status(500).json({ error: 'Failed to get ROM list: ' + error.message });
    }
});

// *** NEW: Load specific ROM ***
app.post('/roms/load/:romId', (req, res) => {
    try {
        if (!interpreter || !interpreter.memory) {
            return res.status(500).json({ error: 'Memory manager not initialized' });
        }

        const romId = req.params.romId;
        console.log(`🚀 [SERVER] Loading ROM with auto-initialization: ${romId}`);

        // Load ROM (this now auto-enables ROM-driven mode)
        const romResult = interpreter.memory.loadROMById(romId);
        
        // Automatically initialize CPU from ROM reset vectors
        const resetVectors = interpreter.initializeFromROM();

        res.json({
            success: true,
            message: `${romResult.message} and CPU auto-initialized`,
            romId: romId,
            romInfo: romResult.romInfo,
            resetVectors: {
                programCounter: `0x${resetVectors.programCounter.toString(16)}`,
                stackPointer: `0x${resetVectors.stackPointer.toString(16)}`
            },
            autoInitialized: true
        });

    } catch (error) {
        console.error('ROM load error:', error);
        res.status(500).json({ error: 'Failed to load ROM: ' + error.message });
    }
});

// *** NEW: Load default ROM ***
app.post('/roms/load-default', (req, res) => {
    try {
        if (!interpreter || !interpreter.memory) {
            return res.status(500).json({ error: 'Memory manager not initialized' });
        }

        console.log('🚀 [SERVER] Loading default ROM with auto-initialization...');

        // Load ROM (this now auto-enables ROM-driven mode)
        const romResult = interpreter.memory.loadDefaultROM();
        
        // Automatically initialize CPU from ROM reset vectors
        const resetVectors = interpreter.initializeFromROM();

        res.json({
            success: true,
            message: `${romResult.message} and CPU auto-initialized`,
            romId: romResult.romId,
            romInfo: romResult.romInfo,
            resetVectors: {
                programCounter: `0x${resetVectors.programCounter.toString(16)}`,
                stackPointer: `0x${resetVectors.stackPointer.toString(16)}`
            },
            autoInitialized: true
        });

    } catch (error) {
        console.error('Default ROM load error:', error);
        res.status(500).json({ error: 'Failed to load default ROM: ' + error.message });
    }
});

// *** NEW: Get ROM status and info ***
app.get('/roms/status', (req, res) => {
    try {
        if (!interpreter || !interpreter.memory) {
            return res.status(500).json({ error: 'Memory manager not initialized' });
        }

        const status = interpreter.memory.getROMStatus();

        res.json({
            success: true,
            status: status
        });

    } catch (error) {
        console.error('ROM status error:', error);
        res.status(500).json({ error: 'Failed to get ROM status: ' + error.message });
    }
});

// *** NEW: Enable authentic ROM-driven initialization mode ***
app.post('/roms/enable-rom-driven-mode', (req, res) => {
    try {
        if (!interpreter || !interpreter.memory) {
            return res.status(500).json({ error: 'Interpreter not initialized' });
        }

        const resetVectors = interpreter.enableROMDrivenMode();

        res.json({
            success: true,
            message: 'ROM-driven mode enabled successfully',
            resetVectors: {
                programCounter: `0x${resetVectors.programCounter.toString(16)}`,
                stackPointer: `0x${resetVectors.stackPointer.toString(16)}`
            }
        });

    } catch (error) {
        console.error('ROM-driven mode error:', error);
        res.status(500).json({ error: 'Failed to enable ROM-driven mode: ' + error.message });
    }
});

// *** NEW: Initialize CPU from ROM reset vectors ***
app.post('/cpu/initialize-from-rom', (req, res) => {
    try {
        if (!interpreter) {
            return res.status(500).json({ error: 'Interpreter not initialized' });
        }

        const resetVectors = interpreter.initializeFromROM();

        res.json({
            success: true,
            message: 'CPU initialized from ROM reset vectors',
            resetVectors: {
                programCounter: `0x${resetVectors.programCounter.toString(16)}`,
                stackPointer: `0x${resetVectors.stackPointer.toString(16)}`
            }
        });

    } catch (error) {
        console.error('ROM CPU initialization error:', error);
        res.status(500).json({ error: 'Failed to initialize CPU from ROM: ' + error.message });
    }
});

// *** ENHANCED: Updated test endpoint with ROM testing ***
app.get('/test-memory', (req, res) => {
    try {
        console.log('🧪 [SERVER] Testing MemoryManager with ROM loading...');
        
        // Create a test memory manager instance
        const { MemoryManager } = require('./src/MemoryManager');
        const testMemory = new MemoryManager();
        
        // Test ROM directory and available ROMs
        const availableRoms = testMemory.getAvailableROMs();
        
        // Test basic initialization
        testMemory.initializeKickstart();
        
        // Try to load default ROM if available
        let romTestResults = {
            romDirectoryExists: require('fs').existsSync(testMemory.ROM_DIRECTORY),
            availableRomsCount: availableRoms.length,
            availableRoms: availableRoms.map(rom => ({ id: rom.id, name: rom.name })),
            defaultRomLoaded: false,
            romLoadError: null
        };
        
        if (availableRoms.length > 0) {
            try {
                const romResult = testMemory.loadDefaultROM();
                romTestResults.defaultRomLoaded = true;
                romTestResults.loadedRom = {
                    id: romResult.romId,
                    name: romResult.romInfo.name,
                    checksum: romResult.romInfo.checksum.toString(16),
                    residentCount: testMemory.residentModules.length
                };
            } catch (error) {
                romTestResults.romLoadError = error.message;
            }
        }
        
        // Get test results
        const results = {
            success: true,
            layout: {
                chipRamSize: testMemory.chipRam.length,
                fastRamSize: testMemory.fastRam.length,
                romBase: testMemory.KICKSTART_ROM_BASE.toString(16),
                romSize: testMemory.KICKSTART_ROM_SIZE,
                execBase: testMemory.execBaseAddr ? testMemory.execBaseAddr.toString(16) : null
            },
            execBase: {
                address: testMemory.execBaseAddr,
                pointerAt4: testMemory.readLong(0x4),
                softVer: testMemory.readWord(testMemory.execBaseAddr + 36),
                initialized: testMemory.kickstartInitialized
            },
            memoryTests: {
                execBasePointerCorrect: testMemory.readLong(0x4) === testMemory.execBaseAddr,
                execBaseInChipRam: testMemory.execBaseAddr < testMemory.chipRam.length,
                romAreaProtected: true
            },
            romTests: romTestResults
        };
        
        // Test ROM write protection
        const testRomAddr = testMemory.KICKSTART_ROM_BASE;
        const originalValue = testMemory.readByte(testRomAddr);
        testMemory.writeByte(testRomAddr, 0xFF); // Should be ignored
        const afterWrite = testMemory.readByte(testRomAddr);
        results.memoryTests.romWriteProtected = (originalValue === afterWrite);
        
        console.log('✅ [SERVER] Memory and ROM tests completed');
        console.log('📋 [SERVER] Results:', results);
        
        res.json(results);
        
    } catch (error) {
        console.error('❌ [SERVER] Memory test failed:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Debug endpoint to test nextInstruction functionality
app.get('/debug/next-instruction', (req, res) => {
    try {
        if (!interpreter || !interpreter.cpu) {
            return res.json({ 
                error: 'CPU not initialized',
                hasInterpreter: !!interpreter,
                hasCpu: !!(interpreter && interpreter.cpu)
            });
        }
        
        const cpu = interpreter.cpu;
        const isRunning = cpu.isRunning();
        let nextInstruction = null;
        let error = null;
        
        try {
            if (isRunning) {
                nextInstruction = cpu.peekNextInstruction();
            }
        } catch (e) {
            error = e.message;
        }
        
        res.json({
            success: true,
            cpuIsRunning: isRunning,
            nextInstruction: nextInstruction,
            error: error,
            currentPC: cpu.getProgramCounter ? cpu.getProgramCounter() : 'N/A',
            hasMethod: typeof cpu.peekNextInstruction === 'function'
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Debug endpoint failed: ' + error.message 
        });
    }
});


// Debug endpoint to check library processing
app.get('/debug/libraries', (req, res) => {
    try {
        if (!interpreter || !interpreter.memory) {
            return res.status(500).json({ error: 'Memory manager not initialized' });
        }
        
        const memory = interpreter.memory;
        const libraries = [];
        
        // Check what libraries are in residentModules
        for (const resident of memory.residentModules) {
            if (resident.isLibrary) {
                // Get all vectors with their jump addresses
                const allVectors = resident.vectorTable ? resident.vectorTable.map(vector => ({
                    name: vector.name,
                    romAddress: `0x${vector.address.toString(16)}`,
                    jumpAddress: vector.jumpAddress ? `0x${vector.jumpAddress.toString(16)}` : null,
                    offset: vector.offset,
                    isROMCode: vector.isROMCode
                })) : [];
                
                libraries.push({
                    name: resident.name,
                    hasVectorTable: !!resident.vectorTable,
                    vectorCount: resident.vectorTable ? resident.vectorTable.length : 0,
                    vectors: allVectors
                });
            }
        }
        
        // Get actual library base addresses
        const baseAddresses = {};
        if (memory.libraryBases) {
            for (const [libName, libInfo] of memory.libraryBases) {
                baseAddresses[libName] = `0x${libInfo.baseAddress.toString(16)}`;
            }
        }
        
        res.json({
            success: true,
            libraryCount: libraries.length,
            libraries: libraries,
            libraryBases: memory.libraryBases ? Array.from(memory.libraryBases.keys()) : [],
            baseAddresses: baseAddresses
        });
        
    } catch (error) {
        console.error('Library debug error:', error);
        res.status(500).json({ error: 'Failed to debug libraries: ' + error.message });
    }
});

// Test endpoint to trigger ROM vector re-extraction
app.post('/test/reinit-vectors', (req, res) => {
    try {
        console.log('🔧 [TEST] Re-initializing library vectors...');
        
        if (!interpreter || !interpreter.memory) {
            return res.status(500).json({ error: 'Memory manager not initialized' });
        }
        
        // Force re-parse of library vectors for intuition
        const memory = interpreter.memory;
        
        // Find intuition.library in resident modules
        let intuitionResident = null;
        for (const resident of memory.residentModules) {
            if (resident.name && resident.name.toLowerCase().includes('intuition')) {
                intuitionResident = resident;
                break;
            }
        }
        
        if (!intuitionResident) {
            return res.status(404).json({ error: 'intuition.library not found in resident modules' });
        }
        
        console.log(`🔧 [TEST] Found intuition.library at 0x${intuitionResident.address.toString(16)}`);
        
        // Re-extract vectors using the new fallback logic
        const vectors = memory.extractIntuitionLibraryROMVectors(intuitionResident);
        
        // Update the resident module
        intuitionResident.vectorTable = vectors;
        
        res.json({
            success: true,
            message: 'Intuition vectors re-extracted',
            vectorCount: vectors.length,
            vectors: vectors.slice(0, 5).map(v => ({
                name: v.name,
                address: `0x${v.address.toString(16)}`,
                offset: v.offset,
                isROMCode: v.isROMCode
            }))
        });
        
    } catch (error) {
        console.error('Vector re-init error:', error);
        res.status(500).json({ error: 'Failed to re-initialize vectors: ' + error.message });
    }
});

// *** KICKSTART DISASSEMBLY ENDPOINTS ***

// Initialize kickstart disassembly after ROM loading
app.post('/kickstart/disassemble', async (req, res) => {
    try {
        console.log('🔍 [SERVER] Kickstart disassembly requested...');
        
        const result = await interpreter.initializeKickstartDisassembly();
        
        if (result.success) {
            res.json({
                success: true,
                message: `Kickstart disassembled: ${result.disassembly.totalInstructions} instructions`,
                disassembly: result.disassembly,
                frontend: result.frontendData
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        console.error('❌ [SERVER] Kickstart disassembly error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to disassemble kickstart: ' + error.message
        });
    }
});

// Enable validation mode for step-through execution
app.post('/kickstart/validation/enable', (req, res) => {
    try {
        const result = interpreter.enableValidationMode();
        res.json(result);
    } catch (error) {
        console.error('❌ [SERVER] Enable validation error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Disable validation mode
app.post('/kickstart/validation/disable', (req, res) => {
    try {
        const result = interpreter.disableValidationMode();
        res.json(result);
    } catch (error) {
        console.error('❌ [SERVER] Disable validation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Reset validation state
app.post('/kickstart/validation/reset', (req, res) => {
    try {
        const result = interpreter.resetKickstartValidation();
        res.json(result);
    } catch (error) {
        console.error('❌ [SERVER] Reset validation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get kickstart status and disassembly
app.get('/kickstart/status', (req, res) => {
    try {
        const status = interpreter.getKickstartStatus();
        res.json({
            success: true,
            status: status
        });
    } catch (error) {
        console.error('❌ [SERVER] Get kickstart status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Enhanced step endpoint with validation
app.post('/step-validated', async (req, res) => {
    try {
        console.log('👣 [SERVER] Validated step requested...');
        
        const result = await interpreter.stepWithValidation();
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ [SERVER] Validated step error:', error);
        res.status(500).json({
            success: false,
            error: 'Step validation failed: ' + error.message
        });
    }
});

// Enhanced run endpoint with validation
app.post('/run-validated', async (req, res) => {
    try {
        console.log('🏃 [SERVER] Validated run requested...');
        
        const result = await interpreter.runWithValidation();
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ [SERVER] Validated run error:', error);
        res.status(500).json({
            success: false,
            error: 'Run validation failed: ' + error.message
        });
    }
});

// Get disassembly for frontend display
app.get('/kickstart/disassembly', (req, res) => {
    try {
        if (!interpreter.kickstartDisassembler) {
            return res.status(400).json({
                success: false,
                error: 'Kickstart not disassembled yet - run /kickstart/disassemble first'
            });
        }
        
        const frontendData = interpreter.kickstartDisassembler.getDisassemblyForFrontend();
        
        res.json({
            success: true,
            disassembly: frontendData
        });
        
    } catch (error) {
        console.error('❌ [SERVER] Get disassembly error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Complete workflow endpoint: Load ROM + Disassemble + Enable Validation
app.post('/kickstart/initialize-complete', async (req, res) => {
    try {
        console.log('🚀 [SERVER] Complete kickstart initialization workflow...');
        
        // Step 1: Load ROM (if not already loaded)
        if (!interpreter.memory.romResetVectors) {
            console.log('📁 [SERVER] Loading default ROM first...');
            const romResult = interpreter.memory.loadDefaultROM();
            if (!romResult.success) {
                throw new Error('ROM loading failed: ' + romResult.error);
            }
        }
        
        // Step 2: Initialize CPU from ROM vectors
        if (!interpreter.memory.romDrivenMode) {
            console.log('🎯 [SERVER] Enabling ROM-driven mode...');
            const romModeResult = interpreter.memory.enableROMDrivenMode();
            if (!romModeResult.success) {
                throw new Error('ROM-driven mode failed: ' + romModeResult.error);
            }
            
            const cpuInitResult = interpreter.cpu.initializeFromROMVectors(interpreter.memory.romResetVectors);
            if (!cpuInitResult.success) {
                throw new Error('CPU initialization failed: ' + cpuInitResult.error);
            }
        }
        
        // Step 3: Disassemble kickstart initialization
        console.log('🔍 [SERVER] Disassembling kickstart...');
        const disasmResult = await interpreter.initializeKickstartDisassembly();
        if (!disasmResult.success) {
            throw new Error('Disassembly failed: ' + disasmResult.error);
        }
        
        // Step 4: Enable validation mode
        console.log('🔒 [SERVER] Enabling validation mode...');
        const validationResult = interpreter.enableValidationMode();
        if (!validationResult.success) {
            throw new Error('Validation mode failed: ' + validationResult.error);
        }
        
        // Return complete status
        res.json({
            success: true,
            message: 'Kickstart initialization complete - ready for validated execution',
            workflow: {
                romLoaded: true,
                cpuInitialized: true,
                disassembled: true,
                validationEnabled: true
            },
            disassembly: {
                totalInstructions: disasmResult.disassembly.totalInstructions,
                checksum: disasmResult.disassembly.checksum
            },
            resetVectors: interpreter.memory.romResetVectors,
            frontend: disasmResult.frontendData
        });
        
    } catch (error) {
        console.error('❌ [SERVER] Complete initialization error:', error);
        res.status(500).json({
            success: false,
            error: 'Complete initialization failed: ' + error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Amiga Executable Runner server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to upload and run Amiga executables`);
});
