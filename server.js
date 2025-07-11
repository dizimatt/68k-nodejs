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

// Global interpreter instance
let interpreter = null;

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

app.listen(PORT, () => {
    console.log(`Amiga Executable Runner server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to upload and run Amiga executables`);
});
