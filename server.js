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

        // Create new interpreter instance
        interpreter = new AmigaInterpreter();
        
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
                immediate: result.cpu.immediate
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
        console.log(`🚀 [SERVER] Loading ROM: ${romId}`);

        const result = interpreter.memory.loadROMById(romId);

        res.json({
            success: true,
            message: result.message,
            romId: result.romId,
            romInfo: result.romInfo
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

        console.log('🚀 [SERVER] Loading default ROM...');

        const result = interpreter.memory.loadDefaultROM();

        res.json({
            success: true,
            message: result.message,
            romId: result.romId,
            romInfo: result.romInfo
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


app.listen(PORT, () => {
    console.log(`Amiga Executable Runner server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to upload and run Amiga executables`);
});
