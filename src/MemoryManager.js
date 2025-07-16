// Enhanced MemoryManager.js - CORRECTED for Step 1 Fixes
const fs = require('fs');
const path = require('path');

class MemoryManager {
    constructor() {
        this.chipRam = new Uint8Array(2 * 1024 * 1024); // 2MB chip RAM
        this.fastRam = new Uint8Array(8 * 1024 * 1024); // 8MB fast RAM
        this.customRegisters = new Uint16Array(0x200); // Custom chip registers
        this.hunks = [];
        
        // *** CORRECTED: Kickstart memory layout for A1200 ***
        this.KICKSTART_ROM_BASE = 0x00F80000;          // Correct A1200 ROM location
        this.KICKSTART_ROM_SIZE = 0x00080000;          // 512KB ROM
        this.kickstartRom = null;                      // Will hold ROM data
        this.kickstartInitialized = false;
        this.residentModules = [];                     // Found resident modules
        
        // *** CORRECTED: ExecBase will be determined dynamically ***
        this.execBaseAddr = null;                      // Will be set after proper initialization
        
        // *** REMOVED: Hardcoded library addresses ***
        // These will be determined from ROM scanning
        // this.EXEC_LIBRARY_BASE = ???;              // REMOVED - comes from ROM
        // this.DOS_LIBRARY_BASE = ???;               // REMOVED - comes from ROM
        // this.GRAPHICS_LIBRARY_BASE = ???;          // REMOVED - comes from ROM
        
        // *** CORRECTED: Library function offsets (verified against real Kickstart) ***
        this.EXEC_FUNCTIONS = {
            AllocMem: -198,      // -0xC6  (verified)
            FreeMem: -210,       // -0xD2  (verified)
            OpenLibrary: -552,   // -0x228 (verified - matches research)
            CloseLibrary: -414,  // -0x19E (verified)
            FindTask: -294,      // -0x126 (verified)
            Permit: -138,        // -0x8A  (verified)
            Forbid: -132,        // -0x84  (verified)
            MakeFunctions: -90,  // -0x5A  (needed by OpenLibrary)
        };
        
        // Stub management (for later ROM integration)
        this.nextStubAddress = 0x01010000;             // Our implementation area
        this.libraryStubs = new Map();                 // Track created stubs
        
        console.log('🏗️ [MEMORY] MemoryManager initialized - ready for Kickstart ROM loading');
        
        this.ROM_DIRECTORY = path.join(__dirname, '..', 'roms');     // /roms folder in project root
        this.AVAILABLE_ROMS = {
            'kickstart31_a1200': {
                filename: 'kick40068.A1200',
                name: 'Kickstart 3.1 (A1200)',
                version: 39,
                size: 524288,  // 512KB
                description: 'Standard Kickstart 3.1 for Amiga 1200',
                checksum: null  // Will be calculated on load
            },
            'kickstart31_a4000': {
                filename: 'kick40068.A4000',
                name: 'Kickstart 3.1 (A4000)', 
                version: 39,
                size: 524288,
                description: 'Kickstart 3.1 for Amiga 4000',
                checksum: null
            }
            // Future: Add more ROM options here
        };
        
        this.currentRomId = null;          // Currently loaded ROM ID
        this.currentRomInfo = null;        // Currently loaded ROM info
        
        console.log('🏗️ [MEMORY] MemoryManager initialized - local ROM loading enabled');
        this.checkROMDirectory();
    }
    
    // *** CORRECTED: Proper ExecBase location in chip RAM ***
    initializeExecBase() {
        console.log('🔧 [MEMORY] Initializing ExecBase in chip RAM...');
        
        // ExecBase should be in chip RAM, not at 16MB!
        // Use a safe location in chip RAM - 1KB offset
        this.execBaseAddr = 0x00000400;
        
        // Set the ExecBase pointer at the canonical address 4
        this.writeLong(0x00000004, this.execBaseAddr);
        
        // Initialize proper ExecBase structure
        this.setupCorrectExecBaseStructure();
        
        console.log(`📍 [MEMORY] ExecBase initialized at: 0x${this.execBaseAddr.toString(16).padStart(8, '0')}`);
        console.log(`📍 [MEMORY] ExecBase pointer at 0x4: 0x${this.readLong(0x4).toString(16).padStart(8, '0')}`);
    }
    
    // *** NEW: Correct ExecBase structure matching real Amiga layout ***
    setupCorrectExecBaseStructure() {
        console.log('🔧 [MEMORY] Setting up correct ExecBase structure...');
        
        const execBase = this.execBaseAddr;
        
        // === LN (List Node) structure - 14 bytes ===
        this.writeLong(execBase + 0, 0);        // ln_Succ (pointer to next)
        this.writeLong(execBase + 4, 0);        // ln_Pred (pointer to previous)
        this.writeByte(execBase + 8, 9);        // ln_Type (NT_LIBRARY = 9)
        this.writeByte(execBase + 9, 0);        // ln_Pri (priority)
        this.writeLong(execBase + 10, 0);       // ln_Name (pointer to name string)
        
        // === LIB (Library) structure - 20 bytes ===
        this.writeWord(execBase + 14, 0x0105);  // lib_Flags
        this.writeWord(execBase + 16, 0);       // lib_pad
        this.writeWord(execBase + 18, 552);     // lib_NegSize (size of negative area in bytes)
        this.writeWord(execBase + 20, 588);     // lib_PosSize (size of positive area in bytes)
        this.writeWord(execBase + 22, 39);      // lib_Version (Kickstart 3.1 = version 39)
        this.writeWord(execBase + 24, 1);       // lib_Revision
        this.writeLong(execBase + 26, 0);       // lib_IdString (pointer to ID string)
        this.writeLong(execBase + 30, 0);       // lib_Sum (checksum)
        this.writeWord(execBase + 34, 1);       // lib_OpenCnt (open count)
        
        // === ExecBase specific fields (starting at offset 36) ===
        this.writeWord(execBase + 36, 39);      // SoftVer (Kickstart release number - 39 = 3.1)
        this.writeWord(execBase + 38, 0);       // LowMemChkSum (checksum of trap vectors)
        this.writeLong(execBase + 40, 0);       // ChkBase (complement of ExecBase)
        this.writeLong(execBase + 44, 0);       // ColdCapture (coldstart capture vector)
        this.writeLong(execBase + 48, 0);       // CoolCapture (coolstart capture vector)
        this.writeLong(execBase + 52, 0);       // WarmCapture (warmstart capture vector)
        this.writeLong(execBase + 56, 0x00200000); // SysStkUpper (system stack upper bound)
        this.writeLong(execBase + 60, 0x001F0000); // SysStkLower (system stack lower bound)
        this.writeLong(execBase + 64, 0x00200000); // MaxLocMem (top of chip memory)
        this.writeLong(execBase + 68, 0);       // DebugEntry (debugger entry point)
        
        // Initialize system list headers (these are critical for proper operation)
        this.initializeSystemLists(execBase + 72);
        
        console.log('✅ [MEMORY] ExecBase structure initialized with correct Amiga layout');
    }
    
    // *** NEW: Initialize system list headers (required for proper operation) ***
    initializeSystemLists(listBase) {
        console.log('🔧 [MEMORY] Initializing system list headers...');
        
        // Each list header is LH_SIZE bytes (14 bytes for a standard list header)
        const LH_SIZE = 14;
        let offset = 0;
        
        // Initialize all the system lists that ExecBase maintains
        const systemLists = [
            'MemList',      // Memory list
            'ResourceList', // Resource list
            'DeviceList',   // Device list
            'IntrList',     // Interrupt list
            'LibList',      // Library list
            'PortList',     // Message port list
            'TaskReady',    // Ready tasks
            'TaskWait'      // Waiting tasks
        ];
        
        for (const listName of systemLists) {
            this.initializeListHeader(listBase + offset, listName);
            offset += LH_SIZE;
        }
        
        console.log(`✅ [MEMORY] Initialized ${systemLists.length} system list headers`);
    }
    
    // *** NEW: Initialize a single list header ***
    initializeListHeader(address, name) {
        // Standard Amiga list header structure
        this.writeLong(address + 0, 0);         // lh_Head (initially NULL)
        this.writeLong(address + 4, 0);         // lh_Tail (always NULL)
        this.writeLong(address + 8, address + 4); // lh_TailPred (points to lh_Tail)
        this.writeByte(address + 12, 0);        // lh_Type
        this.writeByte(address + 13, 0);        // lh_pad
        
        console.log(`📋 [MEMORY] Initialized ${name} list header at 0x${address.toString(16)}`);
    }
    
    // *** DISABLED: Fake Kickstart initialization ***
    // This is disabled until real ROM loading is implemented
    initializeKickstart() {
        console.log('⚠️ [KICKSTART] Fake Kickstart initialization DISABLED');
        console.log('⚠️ [KICKSTART] Real ROM loading required for proper operation');
        
        // Initialize basic ExecBase only
        this.initializeExecBase();
        
        // FORCE: Create simple OpenLibrary stub and vector
        // Simple stub: MOVE.L #$12000,D0; RTS (return intuition.library base)
        this.writeWord(0x20000, 0x203C);       // MOVE.L #immediate,D0
        this.writeLong(0x20002, 0x12000);      // Fake intuition.library base
        this.writeWord(0x20006, 0x4E75);       // RTS
        
        this.writeWord(this.execBaseAddr - 552, 0x4EF9);        // JMP absolute.L
        this.writeLong(this.execBaseAddr - 550, 0x20000);       // Point to our stub
        console.log(`🔧 [FORCE] OpenLibrary vector at 0x${(this.execBaseAddr - 552).toString(16)} → JMP 0x20000`);
        
        // Mark as "initialized" but without ROM functionality
        this.kickstartInitialized = true;
        
        return;
        
        // *** OLD CODE DISABLED ***
        /*
        if (this.kickstartInitialized) {
            console.log('⚠️ [KICKSTART] Already initialized');
            return;
        }
        
        console.log('🚀 [KICKSTART] Initializing ExecBase and library system...');
        
        // 1. Set ExecBase pointer at address 4
        this.writeLong(this.EXECBASE_PTR, this.EXECBASE_ADDR);
        // ... rest of old fake initialization ...
        */
    }
    
    // *** PLACEHOLDER: Future ROM loading method ***
    loadKickstart31ROM(romBuffer) {
        console.log('🚀 [KICKSTART] Loading Kickstart 3.1 ROM...');
        
        // Validate ROM size
        if (romBuffer.length !== this.KICKSTART_ROM_SIZE) {
            throw new Error(`Invalid ROM size: ${romBuffer.length}, expected ${this.KICKSTART_ROM_SIZE}`);
        }
        
        // Copy ROM to memory at correct location
        this.kickstartRom = new Uint8Array(romBuffer);
        this.writeBytes(this.KICKSTART_ROM_BASE, this.kickstartRom);
        
        console.log(`📁 [KICKSTART] ROM loaded at 0x${this.KICKSTART_ROM_BASE.toString(16)}`);
        
        // TODO: Parse ROM resident structures
        // TODO: Set up real library jump tables
        // TODO: Initialize real ExecBase from ROM
        
        this.kickstartInitialized = true;
        console.log('✅ [KICKSTART] ROM loaded successfully - ready for resident parsing');
    }
    
    // *** CORRECTED: Check if address is a library call ***
    isLibraryAddress(address) {
        // This will be updated when real ROM loading is implemented
        // For now, we can't determine library addresses without ROM
        return false;
    }
    
    getLibraryFunctionInfo(address) {
        // Check if address matches any known library function
        for (const [libName, vectors] of this.libraryVectors) {
            if (vectors) {
                for (const vector of vectors) {
                    if (vector.address === address || vector.jumpAddress === address) {
                        return {
                            library: libName,
                            function: vector.name,
                            address: vector.address,
                            offset: vector.offset,
                            isJumpTable: address === vector.jumpAddress
                        };
                    }
                }
            }
        }
        
        return null;
    }

    debugROMParsing() {
        console.log('\n📋 [ROM DEBUG] Parsing Results Summary:');
        console.log(`Total Residents: ${this.residentModules.length}`);
        console.log(`Libraries Found: ${this.residentModules.filter(r => r.isLibrary).length}`);
        console.log(`Vector Tables: ${this.libraryVectors.size}`);
        
        console.log('\n📦 [ROM DEBUG] Resident Modules:');
        this.residentModules.forEach((resident, index) => {
            const vectorCount = resident.vectorTable ? resident.vectorTable.length : 0;
            console.log(`  ${index + 1}. ${resident.name} v${resident.version} (${resident.isLibrary ? 'Library' : 'Module'}, ${vectorCount} vectors)`);
        });
        
        console.log('\n📚 [ROM DEBUG] Library Vectors:');
        for (const [libName, vectors] of this.libraryVectors) {
            console.log(`  ${libName}: ${vectors.length} vectors`);
            vectors.slice(0, 3).forEach(vector => {
                console.log(`    - ${vector.name}: 0x${vector.address.toString(16)}`);
            });
            if (vectors.length > 3) {
                console.log(`    ... and ${vectors.length - 3} more`);
            }
        }
    }

    // *** Existing memory methods (unchanged) ***
    loadHunks(hunks) {
        // Initialize basic ExecBase when first executable is loaded
        if (!this.kickstartInitialized) {
            console.log('⚠️ [EXEC] Kickstart not initialized - use ROM loading first');
            this.initializeKickstart();
        }
        
        // Ensure library stubs are properly initialized before executing imported executables
        if (!this.kickstartRom) {
            console.log('🔧 [MEMORY] No ROM detected - creating exec.library stubs for imported executable');
            this.createExecLibraryStubs();
        }
        
        this.hunks = hunks;
        
        // Copy hunk data to appropriate memory locations
        for (const hunk of hunks) {
            this.writeBytes(hunk.loadAddress, hunk.data);
        }
        
        console.log(`📁 [MEMORY] Loaded ${hunks.length} hunks into memory`);
    }
    
    readByte(address) {
        // Custom chip registers
        if (address >= 0xDFF000 && address < 0xDFF200) {
            const reg = (address - 0xDFF000) >> 1;
            return this.customRegisters[reg] & 0xFF;
        }
        
        // Chip RAM
        if (address < this.chipRam.length) {
            return this.chipRam[address];
        }
        
        // Fast RAM
        if (address >= 0x400000 && address < 0x400000 + this.fastRam.length) {
            return this.fastRam[address - 0x400000];
        }
        
        // *** CORRECTED: Kickstart ROM area ***
        if (address >= this.KICKSTART_ROM_BASE && address < this.KICKSTART_ROM_BASE + this.KICKSTART_ROM_SIZE) {
            if (this.kickstartRom) {
                return this.kickstartRom[address - this.KICKSTART_ROM_BASE];
            }
            return 0; // ROM not loaded yet
        }
        
        // *** REMOVED: Fake system memory area ***
        // Real ROM and system structures will be at proper locations
        
        return 0;
    }
    
    writeByte(address, value) {
        // Custom chip registers
        if (address >= 0xDFF000 && address < 0xDFF200) {
            const reg = (address - 0xDFF000) >> 1;
            this.customRegisters[reg] = (this.customRegisters[reg] & 0xFF00) | (value & 0xFF);
            return;
        }
        
        // Chip RAM
        if (address < this.chipRam.length) {
            this.chipRam[address] = value;
            return;
        }
        
        // Fast RAM
        if (address >= 0x400000 && address < 0x400000 + this.fastRam.length) {
            this.fastRam[address - 0x400000] = value;
            return;
        }
        
        // *** CORRECTED: ROM area (read-only check) ***
        if (address >= this.KICKSTART_ROM_BASE && address < this.KICKSTART_ROM_BASE + this.KICKSTART_ROM_SIZE) {
//            console.warn(`⚠️ [MEMORY] Attempt to write to ROM at 0x${address.toString(16)} - ignored`);
            return;
        }
        
        // *** REMOVED: Fake system memory writes ***
        console.warn(`⚠️ [MEMORY] Write to unmapped address 0x${address.toString(16)} - ignored`);
    }
    
    readWord(address) {
        return (this.readByte(address) << 8) | this.readByte(address + 1);
    }
    
    writeWord(address, value) {
        this.writeByte(address, (value >> 8) & 0xFF);
        this.writeByte(address + 1, value & 0xFF);
    }
    
    readLong(address) {
        return (this.readWord(address) << 16) | this.readWord(address + 2);
    }
    
    writeLong(address, value) {
        this.writeWord(address, (value >> 16) & 0xFFFF);
        this.writeWord(address + 2, value & 0xFFFF);
    }
    
    writeBytes(address, data) {
        for (let i = 0; i < data.length; i++) {
            this.writeByte(address + i, data[i]);
        }
    }
    
    writeString(address, str) {
        for (let i = 0; i < str.length; i++) {
            this.writeByte(address + i, str.charCodeAt(i));
        }
    }
    
    getChipRamSample() {
        // Return first 1024 bytes for debugging
        return Array.from(this.chipRam.slice(0, 1024));
    }
    
    getCustomRegisters() {
        return Array.from(this.customRegisters.slice(0, 32));
    }
    
    // *** CORRECTED: Reset working state but keep loaded hunks ***
    resetWorkingState() {
        console.log('🧹 [MEMORY] Resetting working state (preserving loaded hunks)...');
        
        // Clear all memory
        this.chipRam.fill(0);
        this.fastRam.fill(0);
        this.customRegisters.fill(0);
        
        // DON'T clear hunks array or ROM data
        // this.hunks = [];                    ← DON'T do this!
        // this.kickstartRom = null;           ← DON'T do this!
        // this.kickstartInitialized = false; ← DON'T do this!
        
        // Re-initialize system properly
        if (this.kickstartRom) {
            // ROM is loaded - do full ROM initialization
            console.log('🔧 [MEMORY] ROM detected - performing full ROM re-initialization...');
            this.parseKickstartROM();
            this.initializeExecBaseFromROM();
        } else if (this.hunks.length > 0) {
            // No ROM but hunks exist - basic initialization
            this.initializeKickstart();
            
            // Reload hunks if they exist
            if (this.hunks.length > 0) {
                console.log(`📁 [MEMORY] Reloading ${this.hunks.length} hunks...`);
                for (const hunk of this.hunks) {
                    this.writeBytes(hunk.loadAddress, hunk.data);
                }
            }
            
            // Restore ROM if it exists
            if (this.kickstartRom) {
                console.log(`📁 [MEMORY] Restoring ROM...`);
                this.writeBytes(this.KICKSTART_ROM_BASE, this.kickstartRom);
            }
        }
        
        console.log(`✅ [MEMORY] Working state reset, ${this.hunks.length} hunks preserved`);
    }
    
    // Complete reset (clears everything including loaded executable and ROM)
    reset() {
        console.log('🧹 [MEMORY] Complete reset - clearing all data including ROM...');
        
        this.chipRam.fill(0);
        this.fastRam.fill(0);
        this.customRegisters.fill(0);
        this.hunks = [];
        this.kickstartRom = null;
        this.kickstartInitialized = false;
        this.libraryStubs.clear();
        this.nextStubAddress = 0x01010000;
        this.execBaseAddr = null;
        this.residentModules = [];
        
        console.log('✅ [MEMORY] Complete reset finished');
    }
    
    // Check if executable is loaded
    hasExecutableLoaded() {
        return this.hunks.length > 0;
    }
    
    // Check if ROM is loaded
    hasROMLoaded() {
        return this.kickstartRom !== null;
    }
    
    // Get loaded executable info
    getLoadedExecutableInfo() {
        if (this.hunks.length === 0) {
            return { loaded: false };
        }
        
        return {
            loaded: true,
            hunkCount: this.hunks.length,
            totalSize: this.hunks.reduce((sum, hunk) => sum + hunk.data.length, 0),
            entryPoint: this.hunks[0]?.loadAddress || 0,
            kickstartInitialized: this.kickstartInitialized,
            romLoaded: this.hasROMLoaded(),
            execBase: this.execBaseAddr,
            hunks: this.hunks.map(hunk => ({
                type: hunk.type,
                address: hunk.loadAddress,
                size: hunk.data.length
            }))
        };
    }
    
    // *** NEW: Debug current memory layout ***
    debugMemoryLayout() {
        console.log('\n📋 [MEMORY] Current Memory Layout:');
        console.log(`Chip RAM:          0x00000000 - 0x${(this.chipRam.length - 1).toString(16).padStart(8, '0')} (${this.chipRam.length / 1024 / 1024}MB)`);
        console.log(`Fast RAM:          0x00400000 - 0x${(0x400000 + this.fastRam.length - 1).toString(16).padStart(8, '0')} (${this.fastRam.length / 1024 / 1024}MB)`);
        console.log(`Custom Registers:  0x00DFF000 - 0x00DFF1FF`);
        console.log(`Kickstart ROM:     0x${this.KICKSTART_ROM_BASE.toString(16).padStart(8, '0')} - 0x${(this.KICKSTART_ROM_BASE + this.KICKSTART_ROM_SIZE - 1).toString(16).padStart(8, '0')} (${this.KICKSTART_ROM_SIZE / 1024}KB)`);
        
        if (this.execBaseAddr) {
            console.log(`ExecBase:          0x${this.execBaseAddr.toString(16).padStart(8, '0')}`);
            console.log(`ExecBase pointer:  0x00000004 → 0x${this.readLong(0x4).toString(16).padStart(8, '0')}`);
        }
        
        console.log(`ROM Loaded:        ${this.hasROMLoaded()}`);
        if (this.currentRomInfo) {
            console.log(`Current ROM:       ${this.currentRomInfo.name}`);
            console.log(`ROM Checksum:      0x${this.currentRomInfo.checksum.toString(16).padStart(8, '0')}`);
            console.log(`Residents Found:   ${this.residentModules.length}`);
        }
        console.log(`Hunks Loaded:      ${this.hunks.length}`);
        console.log(`Kickstart Init:    ${this.kickstartInitialized}`);
        console.log('');
    }


    //KICKSTART ROM LOADING METHODS
    checkROMDirectory() {
        console.log('🔍 [ROM] Checking ROM directory...');
        
        // Create ROM directory if it doesn't exist
        if (!fs.existsSync(this.ROM_DIRECTORY)) {
            console.log('📁 [ROM] Creating ROM directory...');
            fs.mkdirSync(this.ROM_DIRECTORY, { recursive: true });
            
            // Create README file with instructions
            this.createROMReadme();
        }
        
        // Check which ROMs are available
        const availableRoms = [];
        for (const [romId, romInfo] of Object.entries(this.AVAILABLE_ROMS)) {
            const romPath = path.join(this.ROM_DIRECTORY, romInfo.filename);
            if (fs.existsSync(romPath)) {
                availableRoms.push({ id: romId, ...romInfo, path: romPath });
                console.log(`✅ [ROM] Found: ${romInfo.name} (${romInfo.filename})`);
            } else {
                console.log(`❌ [ROM] Missing: ${romInfo.name} (${romInfo.filename})`);
            }
        }
        
        console.log(`📋 [ROM] ${availableRoms.length}/${Object.keys(this.AVAILABLE_ROMS).length} ROMs available`);
        
        if (availableRoms.length === 0) {
            console.log('⚠️ [ROM] No ROM files found. Please place ROM files in the /roms directory.');
        }
        
        return availableRoms;
    }
    
    // *** NEW: Create README file with ROM instructions ***
    createROMReadme() {
        const readmeContent = `# Amiga Kickstart ROMs

Place your Amiga Kickstart ROM files in this directory.

## Required Files:

### Kickstart 3.1 for Amiga 1200:
- Filename: kick40068.A1200
- Size: 512KB (524,288 bytes)
- Description: Standard Kickstart 3.1 ROM for Amiga 1200

### Kickstart 3.1 for Amiga 4000 (optional):
- Filename: kick40068.A4000  
- Size: 512KB (524,288 bytes)
- Description: Kickstart 3.1 ROM for Amiga 4000

## Legal Notice:
You must own a legal license to use these ROM files.
ROM files are copyrighted by Amiga Technologies.

## File Format:
- ROM files should be raw binary dumps
- No special headers or compression
- Exact size must match specifications

## Verification:
The emulator will validate ROM files on load and report any issues.
`;

        const readmePath = path.join(this.ROM_DIRECTORY, 'README.md');
        fs.writeFileSync(readmePath, readmeContent);
        console.log('📄 [ROM] Created README.md with ROM instructions');
    }
    
    // *** NEW: Get list of available ROMs ***
    getAvailableROMs() {
        return this.checkROMDirectory();
    }
    
    // *** NEW: Load specific ROM by ID ***
    loadROMById(romId) {
        console.log(`🚀 [ROM] Loading ROM: ${romId}`);
        
        // Check if ROM ID exists
        if (!this.AVAILABLE_ROMS[romId]) {
            throw new Error(`Unknown ROM ID: ${romId}`);
        }
        
        const romInfo = this.AVAILABLE_ROMS[romId];
        const romPath = path.join(this.ROM_DIRECTORY, romInfo.filename);
        
        // Check if file exists
        if (!fs.existsSync(romPath)) {
            throw new Error(`ROM file not found: ${romInfo.filename}`);
        }
        
        // Load ROM file
        console.log(`📁 [ROM] Reading ROM file: ${romPath}`);
        const romBuffer = fs.readFileSync(romPath);
        
        // Validate ROM
        this.validateROM(romBuffer, romInfo);
        
        // Load ROM into memory
        this.loadKickstartROM(romBuffer, romId, romInfo);
        
        return {
            success: true,
            romId: romId,
            romInfo: this.currentRomInfo,
            message: `${romInfo.name} loaded successfully`
        };
    }
    
    // *** NEW: Load default ROM (first available) ***
    loadDefaultROM() {
        console.log('🚀 [ROM] Loading default ROM...');
        
        const availableRoms = this.getAvailableROMs();
        
        if (availableRoms.length === 0) {
            throw new Error('No ROM files available. Please place ROM files in /roms directory.');
        }
        
        // Default to A1200 ROM if available, otherwise first available
        let defaultRom = availableRoms.find(rom => rom.id === 'kickstart31_a1200');
        if (!defaultRom) {
            defaultRom = availableRoms[0];
        }
        
        console.log(`📋 [ROM] Using default ROM: ${defaultRom.name}`);
        return this.loadROMById(defaultRom.id);
    }
    
    // *** NEW: Validate ROM file ***
    validateROM(romBuffer, expectedInfo) {
        console.log('🔍 [ROM] Validating ROM file...');
        
        // Check file size
        if (romBuffer.length !== expectedInfo.size) {
            throw new Error(`Invalid ROM size: ${romBuffer.length}, expected ${expectedInfo.size}`);
        }
        
        // Calculate checksum
        let checksum = 0;
        for (let i = 0; i < romBuffer.length; i += 4) {
            if (i + 3 < romBuffer.length) {
                const longword = (romBuffer[i] << 24) | 
                               (romBuffer[i + 1] << 16) | 
                               (romBuffer[i + 2] << 8) | 
                               romBuffer[i + 3];
                checksum = (checksum + longword) >>> 0;
            }
        }
        
        console.log(`📊 [ROM] ROM checksum: 0x${checksum.toString(16).padStart(8, '0')}`);
        
        // Basic ROM structure validation
        this.validateROMStructure(romBuffer);
        
        console.log('✅ [ROM] ROM validation passed');
        return checksum;
    }
    
    // *** NEW: Validate ROM has correct structure ***
    validateROMStructure(romBuffer) {
        const view = new DataView(romBuffer.buffer);
        
        // Check for ROM reset vectors (should not be 0)
        const resetSSP = view.getUint32(0, false);    // Reset Stack Pointer
        const resetPC = view.getUint32(4, false);     // Reset Program Counter
        
        console.log(`📋 [ROM] Reset SSP: 0x${resetSSP.toString(16)}`);
        console.log(`📋 [ROM] Reset PC:  0x${resetPC.toString(16)}`);
        
        if (resetSSP === 0 || resetPC === 0) {
            throw new Error('Invalid ROM: Reset vectors are zero');
        }
        
        // Check if Reset PC points into ROM space
        if (resetPC < 0x00F80000 || resetPC > 0x00FFFFFF) {
            console.warn(`⚠️ [ROM] Reset PC outside ROM space: 0x${resetPC.toString(16)}`);
        }
        
        // Look for ROM tag patterns (resident modules start with 0x4AFC)
        let residentCount = 0;
        for (let i = 0; i < romBuffer.length - 2; i += 2) {
            const word = view.getUint16(i, false);
            if (word === 0x4AFC) {
                residentCount++;
                if (residentCount === 1) {
                    console.log(`📦 [ROM] First resident found at offset 0x${i.toString(16)}`);
                }
            }
        }
        
        console.log(`📦 [ROM] Found ${residentCount} potential resident modules`);
        
        if (residentCount === 0) {
            throw new Error('Invalid ROM: No resident modules found');
        }
        
        console.log('✅ [ROM] ROM structure validation passed');
    }
    
    // *** ENHANCED: Load Kickstart ROM with full info tracking ***
    loadKickstartROM(romBuffer, romId, romInfo) {
        console.log(`🔥 [KICKSTART] Loading ${romInfo.name}...`);
        
        // Copy ROM to memory at correct location
        this.kickstartRom = new Uint8Array(romBuffer);
        this.writeBytes(this.KICKSTART_ROM_BASE, this.kickstartRom);
        
        // Store ROM information
        this.currentRomId = romId;
        this.currentRomInfo = {
            ...romInfo,
            checksum: this.calculateROMChecksum(romBuffer),
            loadedAt: new Date().toISOString(),
            memoryLocation: this.KICKSTART_ROM_BASE
        };
        
        console.log(`📁 [KICKSTART] ROM loaded at 0x${this.KICKSTART_ROM_BASE.toString(16)}`);
        
        // Parse ROM resident structures
        this.parseKickstartROM();
        
        // Initialize proper ExecBase from ROM data
        this.initializeExecBaseFromROM();
        
        this.kickstartInitialized = true;
        console.log(`✅ [KICKSTART] ${romInfo.name} loaded and initialized successfully`);
        
        return this.currentRomInfo;
    }
    
    // *** NEW: Calculate ROM checksum ***
    calculateROMChecksum(romBuffer) {
        let checksum = 0;
        for (let i = 0; i < romBuffer.length; i += 4) {
            if (i + 3 < romBuffer.length) {
                const longword = (romBuffer[i] << 24) | 
                               (romBuffer[i + 1] << 16) | 
                               (romBuffer[i + 2] << 8) | 
                               romBuffer[i + 3];
                checksum = (checksum + longword) >>> 0;
            }
        }
        return checksum;
    }
    
    parseKickstartROM() {
        console.log('🔍 [KICKSTART] Parsing ROM resident structures...');
        
        // Scan for resident modules (0x4AFC markers)
        this.residentModules = [];
        this.libraryVectors = new Map(); // Store library vector tables
        
        // Scan ROM for resident structures
        for (let addr = 0; addr < this.KICKSTART_ROM_SIZE; addr += 2) {
            const word = this.readWord(this.KICKSTART_ROM_BASE + addr);
            if (word === 0x4AFC) {
                const residentAddr = this.KICKSTART_ROM_BASE + addr;
                console.log(`📦 [KICKSTART] Found resident at ROM+0x${addr.toString(16)} (0x${residentAddr.toString(16)})`);
                
                // Parse resident structure with full details
                const resident = this.parseResidentStructureComplete(residentAddr);
                if (resident) {
                    this.residentModules.push(resident);
                    
                    // If this is a library, parse its vector table
                    if (resident.isLibrary && resident.initPtr) {
                        this.parseLibraryVectors(resident);
                    }
                }
            }
        }
        
        console.log(`✅ [KICKSTART] Found ${this.residentModules.length} resident modules`);
        
        // Find and analyze system libraries
        this.analyzeSystemLibraries();
    }

    parseResidentStructureComplete(address) {
        try {
            const matchWord = this.readWord(address);              // Should be 0x4AFC
            const matchTag = this.readLong(address + 2);           // Pointer back to this structure
            const endSkip = this.readLong(address + 6);            // End of resident
            const flags = this.readByte(address + 10);             // Flags
            const version = this.readByte(address + 11);           // Version
            const type = this.readByte(address + 12);              // Node type
            const pri = this.readByte(address + 13);               // Priority
            const namePtr = this.readLong(address + 14);           // Name pointer
            const idString = this.readLong(address + 18);          // ID string pointer
            const initPtr = this.readLong(address + 22);           // Init pointer
            
            // Read name string
            let name = 'Unknown';
            if (this.isValidROMPointer(namePtr)) {
                name = this.readStringFromROM(namePtr);
            }
            
            // Read ID string
            let idStr = '';
            if (this.isValidROMPointer(idString)) {
                idStr = this.readStringFromROM(idString, 128);
            }
            
            // Determine if this is a library
            const isLibrary = (type === 9) || name.toLowerCase().includes('.library');
            
            console.log(`   📋 [RESIDENT] ${name} v${version}`);
            console.log(`       Type: ${type} (${isLibrary ? 'Library' : 'Other'}), Priority: ${pri}`);
            console.log(`       Flags: 0x${flags.toString(16)}, Init: 0x${initPtr.toString(16)}`);
            if (idStr) {
                console.log(`       ID: ${idStr}`);
            }
            
            return {
                address: address,
                matchWord: matchWord,
                matchTag: matchTag,
                endSkip: endSkip,
                flags: flags,
                version: version,
                type: type,
                priority: pri,
                namePtr: namePtr,
                name: name,
                idString: idString,
                idStr: idStr,
                initPtr: initPtr,
                isLibrary: isLibrary,
                libraryBase: null,      // Will be set when library is initialized
                vectorTable: null       // Will be populated for libraries
            };
            
        } catch (error) {
            console.warn(`⚠️ [RESIDENT] Failed to parse resident at 0x${address.toString(16)}: ${error.message}`);
            return null;
        }
    }
    
    isValidROMPointer(ptr) {
        return ptr >= this.KICKSTART_ROM_BASE && ptr < (this.KICKSTART_ROM_BASE + this.KICKSTART_ROM_SIZE);
    }

    // *** NEW: Parse library vector tables ***
    parseLibraryVectors(resident) {
        console.log(`🔧 [LIBRARY] Parsing vectors for ${resident.name}...`);
        
        try {
            // Library initialization typically contains vector table information
            // We need to simulate the library initialization to find the vectors
            
            if (!this.isValidROMPointer(resident.initPtr)) {
                console.warn(`⚠️ [LIBRARY] Invalid init pointer for ${resident.name}`);
                return;
            }
            
            // Read initialization code to find vector table
            const vectors = this.extractLibraryVectors(resident);
            
            if (vectors && vectors.length > 0) {
                resident.vectorTable = vectors;
                this.libraryVectors.set(resident.name, vectors);
                
                console.log(`✅ [LIBRARY] Found ${vectors.length} vectors for ${resident.name}`);
                
                // Show first few vectors for debugging
                vectors.slice(0, 5).forEach((vector, index) => {
                    console.log(`   Vector ${index + 1}: 0x${vector.address.toString(16)} (${vector.name || 'Unknown'})`);
                });
                
            } else {
                console.warn(`⚠️ [LIBRARY] No vectors found for ${resident.name}`);
            }
            
        } catch (error) {
            console.warn(`⚠️ [LIBRARY] Failed to parse vectors for ${resident.name}: ${error.message}`);
        }
    }

    // *** ENHANCED: Extract library vectors from ROM data ***
    extractLibraryVectors(resident) {
        console.log(`🔍 [VECTOR] Extracting vectors for ${resident.name}...`);
        
        const vectors = [];
        const initAddr = resident.initPtr;
        
        // Special handling for exec.library - it's built into the ROM differently
        if (resident.name.toLowerCase().includes('exec')) {
            return this.extractExecLibraryVectors();
        }
        
        // Special handling for intuition.library - create stub vectors for common functions
        if (resident.name.toLowerCase().includes('intuition')) {
            return this.createIntuitionLibraryStubVectors(resident);
        }
        
        // For other libraries, look for standard patterns
        const searchRange = 2048; // Increased search range
        
        console.log(`🔍 [VECTOR] Searching around init address 0x${initAddr.toString(16)}`);
        
        // Pattern 1: Look for jump table (series of JMP instructions)
        let jumpVectors = this.findJumpTable(initAddr, searchRange);
        if (jumpVectors.length > 0) {
            vectors.push(...jumpVectors);
            console.log(`✅ [VECTOR] Found ${jumpVectors.length} jump vectors`);
        }
        
        // Pattern 2: Look for function address tables
        if (vectors.length === 0) {
            let addressVectors = this.findFunctionAddressTable(resident);
            if (addressVectors.length > 0) {
                vectors.push(...addressVectors);
                console.log(`✅ [VECTOR] Found ${addressVectors.length} address table vectors`);
            }
        }
        
        // Pattern 3: Look for library initialization tables
        if (vectors.length === 0) {
            let initVectors = this.findLibraryInitTable(resident);
            if (initVectors.length > 0) {
                vectors.push(...initVectors);
                console.log(`✅ [VECTOR] Found ${initVectors.length} init table vectors`);
            }
        }
        
        if (vectors.length === 0) {
            console.warn(`⚠️ [VECTOR] No vectors found for ${resident.name}`);
        }
        
        return vectors;
    }

    // *** ENHANCED: Extract exec.library vectors and create stub implementations ***
    extractExecLibraryVectors() {
        console.log('🔧 [EXEC] Creating exec.library vectors with pure 68k opcode stubs...');
        
        const vectors = [];
        
        // Define exec functions with their stub implementations
        const execFunctions = [
            { name: 'OpenLibrary', stubAddr: 0xF80500 },
            { name: 'CloseLibrary', stubAddr: 0xF80600 },
            { name: 'AllocMem', stubAddr: 0xF80700 },
            { name: 'FreeMem', stubAddr: 0xF80800 },
            { name: 'FindTask', stubAddr: 0xF80900 },
            { name: 'Permit', stubAddr: 0xF80A00 },
            { name: 'Forbid', stubAddr: 0xF80B00 }
        ];
        
        // Create vectors pointing to our stub implementations
        execFunctions.forEach((func, index) => {
            vectors.push({
                address: func.stubAddr,
                jumpAddress: null,
                offset: this.getStandardExecOffset(func.name),
                name: func.name
            });
        });
        
        // Create the actual stub implementations
        this.createExecLibraryStubs();
        
        console.log(`✅ [EXEC] Created ${vectors.length} exec.library vectors with opcode stubs`);
        return vectors;
    }

    // *** NEW: Create stub vectors for intuition.library ***
    createIntuitionLibraryStubVectors(resident) {
        console.log(`🔧 [INTUITION] Creating stub vectors for intuition.library...`);
        
        const vectors = [];
        
        // Define common intuition.library functions with their standard LVO offsets
        const intuitionFunctions = [
            { name: 'OpenWindow', offset: -204, stubAddr: 0x30000 },
            { name: 'CloseWindow', offset: -72, stubAddr: 0x30100 },
            { name: 'WindowToFront', offset: -252, stubAddr: 0x30200 },
            { name: 'WindowToBack', offset: -258, stubAddr: 0x30300 },
            { name: 'RefreshWindowFrame', offset: -462, stubAddr: 0x30400 },
            { name: 'ActivateWindow', offset: -450, stubAddr: 0x30500 },
            { name: 'BeginRefresh', offset: -354, stubAddr: 0x30600 },
            { name: 'EndRefresh', offset: -360, stubAddr: 0x30700 },
            { name: 'SetWindowTitles', offset: -276, stubAddr: 0x30800 },
            { name: 'OpenScreen', offset: -198, stubAddr: 0x30900 },
            { name: 'CloseScreen', offset: -66, stubAddr: 0x30A00 }
        ];
        
        // Create vectors pointing to our stub implementations with CORRECT offsets
        intuitionFunctions.forEach((func, index) => {
            vectors.push({
                address: func.stubAddr,
                jumpAddress: null,
                offset: func.offset,  // Use the actual LVO offset, not sequential
                name: func.name,
                isStub: true
            });
        });
        
        // Create the actual stub implementations
        this.createIntuitionLibraryStubs(intuitionFunctions);
        
        console.log(`✅ [INTUITION] Created ${vectors.length} intuition.library stub vectors`);
        return vectors;
    }

    // *** NEW: Create actual stub implementations for intuition.library functions ***
    createIntuitionLibraryStubs(functions) {
        console.log(`🔧 [INTUITION] Creating stub implementations...`);
        
        functions.forEach(func => {
            switch (func.name) {
                case 'OpenWindow':
                    this.createOpenWindowStub(func.stubAddr);
                    break;
                case 'CloseWindow':
                    this.createCloseWindowStub(func.stubAddr);
                    break;
                default:
                    // Generic stub that returns NULL
                    this.createGenericLibraryStub(func.stubAddr, func.name);
                    break;
            }
        });
        
        console.log(`✅ [INTUITION] Created stub implementations for ${functions.length} functions`);
    }

    // *** NEW: OpenWindow stub implementation ***
    createOpenWindowStub(address) {
        console.log(`🔧 [STUB] Creating OpenWindow stub at 0x${address.toString(16)}`);
        
        let offset = 0;
        
        // OpenWindow(newWindow in A0) -> window pointer in D0
        // For now, return a fake window pointer
        
        // MOVE.L  #0x40000,D0    ; Return fake window pointer
        this.writeWord(address + offset, 0x203C); offset += 2;   // MOVE.L #imm,D0
        this.writeLong(address + offset, 0x40000); offset += 4;   // Fake window address
        
        // RTS
        this.writeWord(address + offset, 0x4E75); offset += 2;    // RTS
        
        console.log(`✅ [STUB] OpenWindow stub: ${offset} bytes - returns fake window at 0x40000`);
    }

    // *** NEW: CloseWindow stub implementation ***
    createCloseWindowStub(address) {
        console.log(`🔧 [STUB] Creating CloseWindow stub at 0x${address.toString(16)}`);
        
        let offset = 0;
        
        // CloseWindow(window in A0) -> void
        // Simple implementation: just return
        
        // MOVEQ   #0,D0          ; Return success
        this.writeWord(address + offset, 0x7000); offset += 2;   // MOVEQ #0,D0
        
        // RTS
        this.writeWord(address + offset, 0x4E75); offset += 2;   // RTS
        
        console.log(`✅ [STUB] CloseWindow stub: ${offset} bytes`);
    }

    // *** NEW: Generic library function stub ***
    createGenericLibraryStub(address, funcName) {
        console.log(`🔧 [STUB] Creating generic stub for ${funcName} at 0x${address.toString(16)}`);
        
        let offset = 0;
        
        // Generic stub: return NULL
        // MOVEQ   #0,D0          ; Return NULL
        this.writeWord(address + offset, 0x7000); offset += 2;   // MOVEQ #0,D0
        
        // RTS
        this.writeWord(address + offset, 0x4E75); offset += 2;   // RTS
        
        console.log(`✅ [STUB] ${funcName} stub: ${offset} bytes - returns NULL`);
    }

    // *** NEW: Create exec.library stubs when ROM vectors not available ***
    createExecLibraryStubs() {
        console.log('🔧 [EXEC] Creating exec.library stubs (ROM vectors not available)...');
        
        const execBase = this.execBaseAddr;
        let stubsCreated = 0;
        
        for (const [funcName, offset] of Object.entries(this.EXEC_FUNCTIONS)) {
            const jumpTableAddr = execBase + offset; // Note: offset is negative
            this.createStubVector(jumpTableAddr, `exec.${funcName}`);
            stubsCreated++;
        }
        
        console.log(`✅ [EXEC] Created ${stubsCreated} exec.library stubs`);
    }

    // *** FIXED: OpenLibrary implementation (pure 68k opcodes) ***
    createOpenLibraryStub(address) {
        console.log(`🔧 [STUB] Creating OpenLibrary stub at 0x${address.toString(16)}`);
        
        // OpenLibrary(libraryName in A1, version in D0) -> library base in D0
        let offset = 0;
        
        // SIMPLIFIED implementation: No register save/restore to avoid MOVEM
        // Just do safe character comparison and return appropriate library base
        
        // Load first character of library name
        // MOVE.B  (A1),D1          ; Load first character into D1
        this.writeWord(address + offset, 0x1219); offset += 2;  // MOVE.B (A1),D1
        
        // Check for 'i' (intuition.library)
        // CMP.B   #'i',D1          ; Compare with 'i'
        this.writeWord(address + offset, 0x0C01); offset += 2;  // CMP.B #imm,D1
        this.writeWord(address + offset, 0x0069); offset += 2;  // immediate 'i'
        
        // BEQ.S   return_intuition (skip to end of stub)
        this.writeWord(address + offset, 0x6720); offset += 2;  // BEQ.S +32 bytes (to return_intuition)
        
        // Check for 'd' (dos.library)
        // CMP.B   #'d',D1          ; Compare with 'd'
        this.writeWord(address + offset, 0x0C01); offset += 2;  // CMP.B #imm,D1
        this.writeWord(address + offset, 0x0064); offset += 2;  // immediate 'd'
        
        // BEQ.S   return_dos
        this.writeWord(address + offset, 0x6714); offset += 2;  // BEQ.S +20 bytes (to return_dos)
        
        // Check for 'g' (graphics.library)
        // CMP.B   #'g',D1          ; Compare with 'g'
        this.writeWord(address + offset, 0x0C01); offset += 2;  // CMP.B #imm,D1
        this.writeWord(address + offset, 0x0067); offset += 2;  // immediate 'g'
        
        // BEQ.S   return_graphics
        this.writeWord(address + offset, 0x6708); offset += 2;  // BEQ.S +8 bytes (to return_graphics)
        
        // Default: return 0 (library not found)
        // MOVEQ   #0,D0            ; Return 0 for unknown library
        this.writeWord(address + offset, 0x7000); offset += 2;  // MOVEQ #0,D0
        // RTS
        this.writeWord(address + offset, 0x4E75); offset += 2;  // RTS
        
        // return_graphics: (offset = 24)
        const graphicsBase = this.getLibraryBase('graphics.library') || 0x10000;
        // MOVE.L #graphics_base,D0
        this.writeWord(address + offset, 0x203C); offset += 2;  // MOVE.L #imm,D0
        this.writeLong(address + offset, graphicsBase); offset += 4;
        this.writeWord(address + offset, 0x4E75); offset += 2;  // RTS
        
        // return_dos: (offset = 32)
        const dosBase = this.getLibraryBase('dos.library') || 0x11000;
        // MOVE.L #dos_base,D0
        this.writeWord(address + offset, 0x203C); offset += 2;  // MOVE.L #imm,D0
        this.writeLong(address + offset, dosBase); offset += 4;
        this.writeWord(address + offset, 0x4E75); offset += 2;  // RTS
        
        // return_intuition: (offset = 40)
        // CRITICAL FIX: Always use the correct intuition.library base address
        const intuitionBase = 0x15000;  // Force correct base - matches library allocation
        // MOVE.L #intuition_base,D0
        this.writeWord(address + offset, 0x203C); offset += 2;  // MOVE.L #imm,D0
        this.writeLong(address + offset, intuitionBase); offset += 4;
        this.writeWord(address + offset, 0x4E75); offset += 2;  // RTS
        
        console.log(`✅ [STUB] OpenLibrary stub: ${offset} bytes of 68k opcodes with SAFE name parsing (no MOVEM)`);
        console.log(`📍 [STUB] Library bases: intuition=0x${intuitionBase.toString(16)}, dos=0x${dosBase.toString(16)}, graphics=0x${graphicsBase.toString(16)}`);
        console.log(`🎯 [STUB] Stub created at address 0x${address.toString(16)}`);
        console.log(`🔧 [BRANCH] Fixed branch offsets: intuition=+32, dos=+20, graphics=+8`);
    }

    // *** NEW: Get library base address by name ***
    getLibraryBase(libraryName) {
        if (this.libraryBases && this.libraryBases.has(libraryName)) {
            return this.libraryBases.get(libraryName).baseAddress;
        }
        return null;
    }

    // *** NEW: CloseLibrary implementation (pure 68k opcodes) ***
    createCloseLibraryStub(address) {
        console.log(`🔧 [STUB] Creating CloseLibrary stub at 0x${address.toString(16)}`);
        
        let offset = 0;
        
        // CloseLibrary(library base in A1) -> void
        // Simple implementation: just return
        
        // MOVEQ   #0,D0          ; Return success
        this.writeWord(address + offset, 0x7000); offset += 2;   // MOVEQ #0,D0
        
        // RTS
        this.writeWord(address + offset, 0x4E75); offset += 2;   // RTS
        
        console.log(`✅ [STUB] CloseLibrary stub: ${offset} bytes of 68k opcodes`);
    }

    // *** NEW: AllocMem implementation (pure 68k opcodes) ***
    createAllocMemStub(address) {
        console.log(`🔧 [STUB] Creating AllocMem stub at 0x${address.toString(16)}`);
        
        let offset = 0;
        
        // AllocMem(size in D0, flags in D1) -> memory pointer in D0
        // Simple implementation: return a fake memory address
        
        // MOVE.L  #0x50000,D0    ; Return fake memory address
        this.writeWord(address + offset, 0x203C); offset += 2;   // MOVE.L #imm,D0
        this.writeLong(address + offset, 0x50000); offset += 4;   // Fake address
        
        // RTS
        this.writeWord(address + offset, 0x4E75); offset += 2;    // RTS
        
        console.log(`✅ [STUB] AllocMem stub: ${offset} bytes of 68k opcodes`);
    }

    // *** NEW: FreeMem implementation (pure 68k opcodes) ***
    createFreeMemStub(address) {
        console.log(`🔧 [STUB] Creating FreeMem stub at 0x${address.toString(16)}`);
        
        let offset = 0;
        
        // FreeMem(memory in A1, size in D0) -> void
        // Simple implementation: just return
        
        // MOVEQ   #0,D0          ; Return success
        this.writeWord(address + offset, 0x7000); offset += 2;   // MOVEQ #0,D0
        
        // RTS
        this.writeWord(address + offset, 0x4E75); offset += 2;   // RTS
        
        console.log(`✅ [STUB] FreeMem stub: ${offset} bytes of 68k opcodes`);
    }

    // *** NEW: FindTask implementation (pure 68k opcodes) ***
    createFindTaskStub(address) {
        console.log(`🔧 [STUB] Creating FindTask stub at 0x${address.toString(16)}`);
        
        let offset = 0;
        
        // FindTask(task name in A1, or NULL for current) -> task pointer in D0
        // Simple implementation: return fake current task
        
        // MOVE.L  #0x1000,D0     ; Return fake task address
        this.writeWord(address + offset, 0x203C); offset += 2;   // MOVE.L #imm,D0
        this.writeLong(address + offset, 0x1000); offset += 4;    // Fake task
        
        // RTS
        this.writeWord(address + offset, 0x4E75); offset += 2;    // RTS
        
        console.log(`✅ [STUB] FindTask stub: ${offset} bytes of 68k opcodes`);
    }

    // *** NEW: Permit implementation (pure 68k opcodes) ***
    createPermitStub(address) {
        console.log(`🔧 [STUB] Creating Permit stub at 0x${address.toString(16)}`);
        
        let offset = 0;
        
        // Permit() -> void (re-enable task switching)
        // Simple implementation: just return
        
        // NOP                    ; Placeholder for permit functionality
        this.writeWord(address + offset, 0x4E71); offset += 2;   // NOP
        
        // RTS
        this.writeWord(address + offset, 0x4E75); offset += 2;   // RTS
        
        console.log(`✅ [STUB] Permit stub: ${offset} bytes of 68k opcodes`);
    }

    // *** NEW: Forbid implementation (pure 68k opcodes) ***
    createForbidStub(address) {
        console.log(`🔧 [STUB] Creating Forbid stub at 0x${address.toString(16)}`);
        
        let offset = 0;
        
        // Forbid() -> void (disable task switching)
        // Simple implementation: just return
        
        // NOP                    ; Placeholder for forbid functionality
        this.writeWord(address + offset, 0x4E71); offset += 2;   // NOP
        
        // RTS
        this.writeWord(address + offset, 0x4E75); offset += 2;   // RTS
        
        console.log(`✅ [STUB] Forbid stub: ${offset} bytes of 68k opcodes`);
    }
    
    // *** NEW: MakeFunctions implementation (pure 68k opcodes) ***
    createMakeFunctionsStub(address) {
        console.log(`🔧 [STUB] Creating MakeFunctions stub at 0x${address.toString(16)}`);
        
        let offset = 0;
        
        // MakeFunctions(target:A0, functionArray:A1, funcDispBase:A2) -> tableSize:D0
        // Creates jump table at target address (backwards)
        
        // MOVEQ #24,D0           ; Return table size = 4 functions * 6 bytes = 24
        this.writeWord(address + offset, 0x7018); offset += 2;   // MOVEQ #24,D0
        
        // RTS                    ; Return from subroutine
        this.writeWord(address + offset, 0x4E75); offset += 2;   // RTS
        
        console.log(`✅ [STUB] MakeFunctions stub created: ${offset} bytes`);
    }

    // *** NEW: Find jump table pattern ***
    findJumpTable(startAddr, searchRange) {
        const vectors = [];
        
        for (let addr = startAddr; addr < startAddr + searchRange && this.isValidROMPointer(addr); addr += 2) {
            const instruction = this.readWord(addr);
            
            // JMP absolute.L = 0x4EF9
            if (instruction === 0x4EF9) {
                const targetAddr = this.readLong(addr + 2);
                
                if (this.isValidROMPointer(targetAddr)) {
                    vectors.push({
                        address: targetAddr,
                        jumpAddress: addr,
                        offset: vectors.length * -6, // Standard negative offset
                        name: `Func${vectors.length}`
                    });
                    
                    // Look for consecutive jump instructions
                    let nextAddr = addr + 6;
                    while (this.isValidROMPointer(nextAddr) && this.readWord(nextAddr) === 0x4EF9) {
                        const nextTarget = this.readLong(nextAddr + 2);
                        if (this.isValidROMPointer(nextTarget)) {
                            vectors.push({
                                address: nextTarget,
                                jumpAddress: nextAddr,
                                offset: vectors.length * -6,
                                name: `Func${vectors.length}`
                            });
                            nextAddr += 6;
                        } else {
                            break;
                        }
                    }
                    
                    if (vectors.length > 0) {
                        break; // Found a jump table
                    }
                }
            }
        }
        
        return vectors;
    }

    // *** NEW: Find library initialization table ***
    findLibraryInitTable(resident) {
        const vectors = [];
        const initAddr = resident.initPtr;
        
        // Look for patterns common in Amiga library initialization
        // Many libraries have a structure like:
        // InitLib: 
        //   dc.l LibName
        //   dc.l LibId  
        //   dc.l LibBase
        //   dc.l FuncTable
        
        for (let addr = initAddr; addr < initAddr + 256 && this.isValidROMPointer(addr); addr += 4) {
            const ptr1 = this.readLong(addr);
            const ptr2 = this.readLong(addr + 4);
            const ptr3 = this.readLong(addr + 8);
            const ptr4 = this.readLong(addr + 12);
            
            // Check if this looks like a function table pointer
            if (this.isValidROMPointer(ptr4)) {
                // Check if ptr4 points to a table of ROM addresses
                let funcCount = 0;
                for (let i = 0; i < 50; i++) { // Check up to 50 functions
                    const funcAddr = this.readLong(ptr4 + (i * 4));
                    if (this.isValidROMPointer(funcAddr)) {
                        vectors.push({
                            address: funcAddr,
                            tableAddress: ptr4 + (i * 4),
                            offset: i * -6,
                            name: `Func${i}`
                        });
                        funcCount++;
                    } else {
                        break;
                    }
                }
                
                if (funcCount > 3) { // If we found a reasonable number of functions
                    console.log(`📋 [VECTOR] Found function table at 0x${ptr4.toString(16)} with ${funcCount} functions`);
                    break;
                }
            }
        }
        
        return vectors;
    }

    // *** NEW: Find function address tables ***
    findFunctionAddressTable(resident) {
        const vectors = [];
        const initAddr = resident.initPtr;
        
        // Look for patterns of consecutive function addresses
        for (let addr = initAddr; addr < initAddr + 512 && this.isValidROMPointer(addr); addr += 4) {
            const funcAddr = this.readLong(addr);
            
            // Check if this looks like a function address (in ROM space)
            if (this.isValidROMPointer(funcAddr)) {
                // Check if next few addresses are also valid (indicating a table)
                let tableSize = 1;
                for (let i = 1; i < 10; i++) {
                    const nextAddr = this.readLong(addr + (i * 4));
                    if (this.isValidROMPointer(nextAddr)) {
                        tableSize++;
                    } else {
                        break;
                    }
                }
                
                // If we found a table of at least 3 functions, use it
                if (tableSize >= 3) {
                    for (let i = 0; i < tableSize; i++) {
                        const funcPtr = this.readLong(addr + (i * 4));
                        vectors.push({
                            address: funcPtr,
                            tableAddress: addr + (i * 4),
                            offset: i * -6,
                            name: this.guessVectorName(resident.name, i)
                        });
                    }
                    break; // Found our table
                }
            }
        }
        
        return vectors;
    }

    // *** NEW: Guess vector names based on library and position ***
    guessVectorName(libraryName, vectorIndex) {
        const libName = libraryName.toLowerCase();
        
        if (libName.includes('exec')) {
            const execFunctions = [
                'Open', 'Close', 'Expunge', 'Reserved',
                'Supervisor', 'ExitIntr', 'Schedule', 'Reschedule',
                'Switch', 'Dispatch', 'Exception', 'InitCode',
                'InitStruct', 'MakeLibrary', 'MakeFunctions', 'FindResident',
                'InitResident', 'Alert', 'Debug', 'Disable',
                'Enable', 'Forbid', 'Permit', 'SetSR',
                'SuperState', 'UserState', 'SetIntVector', 'AddIntServer',
                'RemIntServer', 'Cause', 'Allocate', 'Deallocate',
                'AllocMem', 'AllocAbs', 'FreeMem', 'AvailMem',
                'AllocEntry', 'FreeEntry', 'Insert', 'Remove',
                'Enqueue', 'FindName', 'AddTask', 'RemTask',
                'FindTask', 'SetTaskPri', 'SetSignal', 'SetExcept',
                'Wait', 'Signal', 'AllocSignal', 'FreeSignal',
                'AllocTrap', 'FreeTrap', 'AddPort', 'RemPort',
                'PutMsg', 'GetMsg', 'ReplyMsg', 'WaitPort',
                'FindPort', 'AddLibrary', 'RemLibrary', 'OldOpenLibrary',
                'CloseLibrary', 'SetFunction', 'SumLibrary', 'AddDevice',
                'RemDevice', 'OpenDevice', 'CloseDevice', 'DoIO',
                'SendIO', 'CheckIO', 'WaitIO', 'AbortIO',
                'AddResource', 'RemResource', 'OpenResource', 'RawIOInit',
                'RawMayGetChar', 'RawPutChar', 'RawDoFmt', 'GetCC',
                'TypeOfMem', 'Procure', 'Vacate', 'OpenLibrary'
            ];
            
            return execFunctions[vectorIndex] || `ExecFunc${vectorIndex}`;
        }
        
        if (libName.includes('dos')) {
            const dosFunctions = [
                'Open', 'Close', 'Expunge', 'Reserved',
                'Read', 'Write', 'Input', 'Output',
                'Seek', 'DeleteFile', 'Rename', 'Lock',
                'UnLock', 'DupLock', 'Examine', 'ExNext',
                'Info', 'CreateDir', 'SetProtection', 'SetComment',
                'SetFileDate', 'SameLock', 'CurrentDir', 'CreateProc',
                'RunCommand', 'GetCurrentDirName', 'GetProgramName', 'SetProgramName',
                'GetPrompt', 'SetPrompt', 'FilePart', 'PathPart',
                'AddPart', 'RemPart', 'Execute', 'Exit'
            ];
            
            return dosFunctions[vectorIndex] || `DOSFunc${vectorIndex}`;
        }
        
        return `${libraryName}Func${vectorIndex}`;
    }

    // *** NEW: Analyze system libraries and their capabilities ***
    analyzeSystemLibraries() {
        console.log('🔍 [KICKSTART] Analyzing system libraries...');
        
        const libraries = {
            exec: null,
            dos: null,
            graphics: null,
            intuition: null
        };
        
        // Find each system library
        for (const resident of this.residentModules) {
            const name = resident.name.toLowerCase();
            
            if (name.includes('exec') && resident.isLibrary) {
                libraries.exec = resident;
                console.log(`📚 [KICKSTART] Found exec.library: ${resident.name} v${resident.version}`);
                
                // Special handling for exec.library - it's the core
                this.analyzeExecLibrary(resident);
                
            } else if (name.includes('dos') && resident.isLibrary) {
                libraries.dos = resident;
                console.log(`📚 [KICKSTART] Found dos.library: ${resident.name} v${resident.version}`);
                
            } else if (name.includes('graphics') && resident.isLibrary) {
                libraries.graphics = resident;
                console.log(`📚 [KICKSTART] Found graphics.library: ${resident.name} v${resident.version}`);
                
            } else if (name.includes('intuition') && resident.isLibrary) {
                libraries.intuition = resident;
                console.log(`📚 [KICKSTART] Found intuition.library: ${resident.name} v${resident.version}`);
            }
        }
        
        this.systemLibraries = libraries;
        
        // Show analysis summary
        console.log('\n📊 [KICKSTART] System Library Analysis:');
        Object.keys(libraries).forEach(libName => {
            const lib = libraries[libName];
            if (lib) {
                const vectorCount = lib.vectorTable ? lib.vectorTable.length : 0;
                console.log(`  ✅ ${libName}.library: v${lib.version}, ${vectorCount} vectors`);
            } else {
                console.log(`  ❌ ${libName}.library: Not found`);
            }
        });
        
        if (!libraries.exec) {
            console.warn('⚠️ [KICKSTART] exec.library not found - this will prevent proper operation!');
        }
    }

    // *** NEW: Special analysis for exec.library ***
    analyzeExecLibrary(execResident) {
        console.log('🔧 [EXEC] Analyzing exec.library structure...');
        
        // exec.library is special - it provides the base for all other libraries
        // Find OpenLibrary, AllocMem, FreeMem functions specifically
        
        if (execResident.vectorTable && execResident.vectorTable.length > 0) {
            // Map known exec functions
            const execFunctionMap = new Map();
            
            execResident.vectorTable.forEach((vector, index) => {
                const funcName = vector.name;
                if (funcName) {
                    execFunctionMap.set(funcName, {
                        address: vector.address,
                        offset: vector.offset,
                        index: index
                    });
                    
                    // Log important functions
                    if (['OpenLibrary', 'CloseLibrary', 'AllocMem', 'FreeMem'].includes(funcName)) {
                        console.log(`   🎯 [EXEC] ${funcName}: 0x${vector.address.toString(16)} (offset ${vector.offset})`);
                    }
                }
            });
            
            execResident.functionMap = execFunctionMap;
            
            // Store key function addresses for quick access
            this.execFunctions = {
                openLibrary: execFunctionMap.get('OpenLibrary'),
                closeLibrary: execFunctionMap.get('CloseLibrary'),
                allocMem: execFunctionMap.get('AllocMem'),
                freeMem: execFunctionMap.get('FreeMem')
            };
            
            console.log(`✅ [EXEC] Mapped ${execFunctionMap.size} exec.library functions`);
            
        } else {
            console.warn('⚠️ [EXEC] No vector table found for exec.library');
        }
    }

    // *** PLACEHOLDER: Parse individual resident structure ***
    parseResidentStructure(address) {
        try {
            const matchWord = this.readWord(address);              // Should be 0x4AFC
            const matchTag = this.readLong(address + 2);           // Pointer back to this structure
            const endSkip = this.readLong(address + 6);            // End of resident
            const flags = this.readByte(address + 10);             // Flags
            const version = this.readByte(address + 11);           // Version
            const type = this.readByte(address + 12);              // Node type
            const pri = this.readByte(address + 13);               // Priority
            const namePtr = this.readLong(address + 14);           // Name pointer
            const idString = this.readLong(address + 18);          // ID string pointer
            const initPtr = this.readLong(address + 22);           // Init pointer
            
            // Try to read name if pointer is valid
            let name = 'Unknown';
            if (namePtr >= this.KICKSTART_ROM_BASE && namePtr < this.KICKSTART_ROM_BASE + this.KICKSTART_ROM_SIZE) {
                name = this.readStringFromROM(namePtr);
            }
            
            console.log(`   📋 [RESIDENT] ${name} v${version} (flags=0x${flags.toString(16)}, pri=${pri})`);
            
            return {
                address: address,
                matchWord: matchWord,
                matchTag: matchTag,
                endSkip: endSkip,
                flags: flags,
                version: version,
                type: type,
                priority: pri,
                namePtr: namePtr,
                name: name,
                idString: idString,
                initPtr: initPtr
            };
            
        } catch (error) {
            console.warn(`⚠️ [RESIDENT] Failed to parse resident at 0x${address.toString(16)}: ${error.message}`);
            return null;
        }
    }
    
    // *** NEW: Read string from ROM ***
    readStringFromROM(address, maxLength = 64) {
        let str = '';
        for (let i = 0; i < maxLength; i++) {
            const byte = this.readByte(address + i);
            if (byte === 0) break; // Null terminator
            if (byte >= 32 && byte <= 126) { // Printable ASCII
                str += String.fromCharCode(byte);
            } else {
                break; // Invalid character
            }
        }
        return str;
    }
    
    // *** PLACEHOLDER: Find system libraries in residents ***
    findSystemLibraries() {
        console.log('🔍 [KICKSTART] Locating system libraries...');
        
        const libraries = {
            exec: null,
            dos: null,
            graphics: null,
            intuition: null
        };
        
        for (const resident of this.residentModules) {
            const name = resident.name.toLowerCase();
            
            if (name.includes('exec')) {
                libraries.exec = resident;
                console.log(`📚 [KICKSTART] Found exec.library: ${resident.name}`);
            } else if (name.includes('dos')) {
                libraries.dos = resident;
                console.log(`📚 [KICKSTART] Found dos.library: ${resident.name}`);
            } else if (name.includes('graphics')) {
                libraries.graphics = resident;
                console.log(`📚 [KICKSTART] Found graphics.library: ${resident.name}`);
            } else if (name.includes('intuition')) {
                libraries.intuition = resident;
                console.log(`📚 [KICKSTART] Found intuition.library: ${resident.name}`);
            }
        }
        
        this.systemLibraries = libraries;
        
        if (!libraries.exec) {
            console.warn('⚠️ [KICKSTART] exec.library not found in ROM!');
        }
    }
    
    // *** ENHANCED: Initialize ExecBase from ROM data with jump vectors ***
    initializeExecBaseFromROM() {
        console.log('🔧 [KICKSTART] Initializing ExecBase from ROM data...');
        
        // Initialize basic ExecBase structure
        this.initializeExecBase();
        
        // *** NEW: Initialize library jump vectors ***
        this.initializeLibraryJumpVectors();
        
        // TODO: Parse actual ExecBase structure from ROM
        // TODO: Initialize memory lists from ROM
        
        console.log('✅ [KICKSTART] ExecBase initialized from ROM with jump vectors');
    }

    // *** NEW: Initialize library jump vectors from discovered ROM addresses ***
    initializeLibraryJumpVectors() {
        console.log('🔧 [VECTORS] Initializing library jump vectors...');
        
        if (!this.execBaseAddr) {
            console.warn('⚠️ [VECTORS] ExecBase not initialized - cannot create jump vectors');
            return;
        }
        
        // Initialize exec.library jump vectors (negative offsets from ExecBase)
        this.initializeExecLibraryVectors();
        
        // Initialize other system library vectors
        this.initializeSystemLibraryVectors();
        
        console.log('✅ [VECTORS] Library jump vectors initialized');
    }

    // *** NEW: Initialize exec.library jump vectors ***
    initializeExecLibraryVectors() {
        console.log('🔧 [EXEC] Setting up exec.library jump vectors...');
        
        const execBase = this.execBaseAddr;
        
        // Find exec.library from resident modules
        const execLibrary = this.systemLibraries?.exec;
        if (!execLibrary || !execLibrary.vectorTable) {
            console.warn('⚠️ [EXEC] exec.library vectors not found - using stub implementations');
            this.createExecLibraryStubs();
            return;
        }
        
        console.log(`📋 [EXEC] Found ${execLibrary.vectorTable.length} exec.library vectors`);
        
        // Map exec function offsets to ROM addresses
        const execVectorMap = new Map();
        
        // Create mapping from known function names to ROM addresses
        execLibrary.vectorTable.forEach((vector, index) => {
            const funcName = vector.name;
            if (funcName) {
                // Map common exec functions to their standard offsets
                const standardOffset = this.getStandardExecOffset(funcName);
                if (standardOffset) {
                    execVectorMap.set(standardOffset, vector.address);
                    console.log(`📍 [EXEC] ${funcName}: offset ${standardOffset} → ROM 0x${vector.address.toString(16)}`);
                }
            }
        });
        
        // Create jump vectors for known exec functions
        let vectorsCreated = 0;
        for (const [funcName, offset] of Object.entries(this.EXEC_FUNCTIONS)) {
            const romAddress = execVectorMap.get(offset);
            
            // FORCE: Always use our stub for OpenLibrary to prevent string corruption
            if (funcName === 'OpenLibrary') {
                console.log(`🔧 [FORCE] Using fixed OpenLibrary stub instead of ROM version`);
                this.createStubVector(execBase + offset, `exec.${funcName}`);
                vectorsCreated++;
            } else if (romAddress) {
                const jumpTableAddr = execBase + offset; // Note: offset is negative
                this.createJumpVector(jumpTableAddr, romAddress, `exec.${funcName}`);
                vectorsCreated++;
            } else {
                console.warn(`⚠️ [EXEC] No ROM address found for ${funcName} (offset ${offset})`);
                // Create stub for missing function
                this.createStubVector(execBase + offset, `exec.${funcName}`);
            }
        }
        
        console.log(`✅ [EXEC] Created ${vectorsCreated} exec.library jump vectors`);
    }

    // *** NEW: Get standard exec function offset by name ***
    getStandardExecOffset(funcName) {
        const nameMap = {
            'OpenLibrary': -552,
            'CloseLibrary': -414,
            'AllocMem': -198,
            'FreeMem': -210,
            'FindTask': -294,
            'Permit': -138,
            'Forbid': -132
        };
        
        return nameMap[funcName] || null;
    }

    // *** NEW: Create jump vector (JMP absolute.L instruction) ***
    createJumpVector(jumpAddr, targetAddr, funcName) {
        // Write JMP absolute.L instruction (0x4EF9) followed by 32-bit target address
        this.writeWord(jumpAddr, 0x4EF9);        // JMP absolute.L opcode
        this.writeLong(jumpAddr + 2, targetAddr); // Target address
        
        console.log(`🎯 [VECTOR] ${funcName}: 0x${jumpAddr.toString(16)} → JMP 0x${targetAddr.toString(16)}`);
        
        // Verify the jump vector was written correctly
        const writtenOpcode = this.readWord(jumpAddr);
        const writtenTarget = this.readLong(jumpAddr + 2);
        
        if (writtenOpcode !== 0x4EF9 || writtenTarget !== targetAddr) {
            console.error(`❌ [VECTOR] Failed to write jump vector for ${funcName}`);
            console.error(`   Expected: 0x4EF9 0x${targetAddr.toString(16)}`);
            console.error(`   Written:  0x${writtenOpcode.toString(16)} 0x${writtenTarget.toString(16)}`);
        }
    }

    // *** NEW: Create stub vector for missing functions ***
    createStubVector(jumpAddr, funcName) {
        // Map exec function names to our ROM stub addresses
        const stubMap = {
            'exec.OpenLibrary': 0x20000,    // Use RAM space instead of ROM
            'exec.CloseLibrary': 0x20100,
            'exec.AllocMem': 0x20200,
            'exec.FreeMem': 0x20300,
            'exec.FindTask': 0x20400,
            'exec.Permit': 0x20500,
            'exec.Forbid': 0x20600,
            'exec.MakeFunctions': 0x20700
        };
        
        const stubAddr = stubMap[funcName];
        if (stubAddr) {
            // Create jump vector to our RAM-based stub  
            this.createJumpVector(jumpAddr, stubAddr, funcName);
            
            // Ensure the stub is actually created at the target address
            if (funcName === 'exec.OpenLibrary') {
                this.createOpenLibraryStub(stubAddr);
            }
            
            // FORCE: Always ensure jump vector points to our stub  
            this.writeWord(jumpAddr, 0x4EF9);        // JMP absolute.L
            this.writeLong(jumpAddr + 2, stubAddr);  // Force stub address
            console.log(`🔧 [FORCE] Jump vector at 0x${jumpAddr.toString(16)} → JMP 0x${stubAddr.toString(16)}`);
            
            // Verify it stuck
            const verify = this.readLong(jumpAddr + 2);
            console.log(`🔍 [VERIFY] Jump vector now points to 0x${verify.toString(16)}`);
        } else {
            // Fallback: simple NOP+RTS stub
            this.writeWord(jumpAddr, 0x4E71);     // NOP
            this.writeWord(jumpAddr + 2, 0x4E75); // RTS
            this.writeWord(jumpAddr + 4, 0x4E71); // NOP (padding)
            console.log(`🔧 [STUB] ${funcName}: 0x${jumpAddr.toString(16)} → STUB (NOP+RTS)`);
        }
    }

    // *** NEW: Create exec.library stubs when ROM vectors not available ***
    createExecLibraryStubs() {
        console.log('🔧 [EXEC] Creating exec.library stubs (ROM vectors not available)...');
        
        const execBase = this.execBaseAddr;
        let stubsCreated = 0;
        
        for (const [funcName, offset] of Object.entries(this.EXEC_FUNCTIONS)) {
            const jumpTableAddr = execBase + offset; // Note: offset is negative
            this.createStubVector(jumpTableAddr, `exec.${funcName}`);
            stubsCreated++;
        }
        
        console.log(`✅ [EXEC] Created ${stubsCreated} exec.library stubs`);
    }

    // *** ENHANCED: Initialize ALL system library vectors ***
    initializeSystemLibraryVectors() {
        console.log('🔧 [SYSTEM] Setting up ALL system library vectors...');
        
        // Initialize library base tracking
        this.libraryBases = new Map();
        this.nextLibraryBase = 0x00010000; // Start allocating library bases at 64KB
        
        // Create library bases and jump vectors for all discovered libraries
        let librariesProcessed = 0;
        
        for (const resident of this.residentModules) {
            if (resident.isLibrary && resident.vectorTable && resident.vectorTable.length > 0) {
                console.log(`🔧 [LIBRARY] Creating library base for ${resident.name}...`);
                
                // Skip exec.library (already handled)
                if (resident.name.toLowerCase().includes('exec')) {
                    continue;
                }
                
                // Create library base structure
                const libraryBase = this.createLibraryBase(resident);
                
                if (libraryBase) {
                    // Create jump vectors for this library
                    this.createLibraryJumpVectors(resident, libraryBase);
                    librariesProcessed++;
                }
            }
        }
        
        console.log(`✅ [SYSTEM] Created jump vectors for ${librariesProcessed} system libraries`);
        
        // Debug: Show all library bases
        this.debugLibraryBases();
    }

    // *** NEW: Create library base structure ***
    createLibraryBase(resident) {
        const libraryBase = this.nextLibraryBase;
        this.nextLibraryBase += 0x1000; // 4KB spacing between library bases
        
        console.log(`📍 [LIBRARY] Creating ${resident.name} base at 0x${libraryBase.toString(16)}`);
        
        // Create standard Amiga library structure
        this.setupLibraryStructure(libraryBase, resident);
        
        // Store library base mapping
        this.libraryBases.set(resident.name, {
            baseAddress: libraryBase,
            resident: resident,
            vectorCount: resident.vectorTable.length,
            isOpen: false
        });
        
        return libraryBase;
    }

    // *** NEW: Setup standard Amiga library structure ***
    setupLibraryStructure(baseAddr, resident) {
        // === LN (List Node) structure - 14 bytes ===
        this.writeLong(baseAddr + 0, 0);        // ln_Succ
        this.writeLong(baseAddr + 4, 0);        // ln_Pred  
        this.writeByte(baseAddr + 8, 9);        // ln_Type (NT_LIBRARY = 9)
        this.writeByte(baseAddr + 9, 0);        // ln_Pri
        this.writeLong(baseAddr + 10, 0);       // ln_Name
        
        // === LIB (Library) structure - 20 bytes ===
        this.writeWord(baseAddr + 14, 0x0105);  // lib_Flags
        this.writeWord(baseAddr + 16, 0);       // lib_pad
        this.writeWord(baseAddr + 18, resident.vectorTable.length * 6); // lib_NegSize
        this.writeWord(baseAddr + 20, 100);     // lib_PosSize  
        this.writeWord(baseAddr + 22, resident.version); // lib_Version
        this.writeWord(baseAddr + 24, 1);       // lib_Revision
        this.writeLong(baseAddr + 26, 0);       // lib_IdString
        this.writeLong(baseAddr + 30, 0);       // lib_Sum
        this.writeWord(baseAddr + 34, 0);       // lib_OpenCnt
        
        console.log(`📋 [LIBRARY] ${resident.name} structure created (${resident.vectorTable.length} vectors)`);
    }

    // *** NEW: Create jump vectors for a library ***
    createLibraryJumpVectors(resident, libraryBase) {
        console.log(`🎯 [VECTORS] Creating jump vectors for ${resident.name}...`);
        
        let vectorsCreated = 0;
        
        // Create jump vectors at their ACTUAL offsets (not sequential)
        resident.vectorTable.forEach((vector, index) => {
            // Use the vector's actual offset if it has one, otherwise use sequential
            const offset = vector.offset || (-6 * (index + 1));
            const jumpAddr = libraryBase + offset;
            
            // Create JMP instruction pointing to ROM function
            this.createJumpVector(jumpAddr, vector.address, `${resident.name}.${vector.name || `Func${index}`}`);
            vectorsCreated++;
            
            // Update vector with jump address for reference
            vector.jumpAddress = jumpAddr;
            vector.offset = offset;
        });
        
        console.log(`✅ [VECTORS] Created ${vectorsCreated} jump vectors for ${resident.name}`);
        
        // Add standard library functions (Open, Close, Expunge, Reserved)
        this.addStandardLibraryVectors(resident, libraryBase);
    }

    // *** NEW: Add standard library vectors (Open, Close, Expunge, Reserved) ***
    addStandardLibraryVectors(resident, libraryBase) {
        // Every Amiga library has these 4 standard functions at the beginning
        const standardVectors = [
            { offset: -6, name: 'Open', stubType: 'return_self' },
            { offset: -12, name: 'Close', stubType: 'return_null' },
            { offset: -18, name: 'Expunge', stubType: 'return_null' },
            { offset: -24, name: 'Reserved', stubType: 'return_null' }
        ];
        
        standardVectors.forEach(stdVector => {
            const jumpAddr = libraryBase + stdVector.offset;
            
            // Create appropriate stub for standard functions
            if (stdVector.stubType === 'return_self') {
                // Open() should return the library base in D0
                this.writeWord(jumpAddr, 0x2008);     // MOVE.L A0,D0 (return library base)
                this.writeWord(jumpAddr + 2, 0x4E75); // RTS
                this.writeWord(jumpAddr + 4, 0x4E71); // NOP (padding)
            } else {
                // Close/Expunge/Reserved return NULL
                this.writeWord(jumpAddr, 0x7000);     // MOVEQ #0,D0 (return NULL)
                this.writeWord(jumpAddr + 2, 0x4E75); // RTS
                this.writeWord(jumpAddr + 4, 0x4E71); // NOP (padding)
            }
            
            console.log(`🔧 [STD] ${resident.name}.${stdVector.name}: 0x${jumpAddr.toString(16)} → STUB`);
        });
    }

    // *** NEW: Debug library bases ***
    debugLibraryBases() {
        console.log('\n📚 [LIBRARY BASES] Summary:');
        
        for (const [libName, libInfo] of this.libraryBases) {
            console.log(`  📍 ${libName}:`);
            console.log(`      Base: 0x${libInfo.baseAddress.toString(16)}`);
            console.log(`      Vectors: ${libInfo.vectorCount}`);
            console.log(`      Version: ${libInfo.resident.version}`);
            
            // Show first few vectors
            const vectors = libInfo.resident.vectorTable.slice(0, 3);
            vectors.forEach(vector => {
                if (vector.jumpAddress) {
                    console.log(`      ${vector.name}: 0x${vector.jumpAddress.toString(16)} → 0x${vector.address.toString(16)}`);
                }
            });
            if (libInfo.vectorCount > 3) {
                console.log(`      ... and ${libInfo.vectorCount - 3} more vectors`);
            }
        }
        console.log('');
    }

    // *** NEW: OpenLibrary implementation ***
    openLibrary(libraryName, version = 0) {
        console.log(`📚 [OPEN] OpenLibrary("${libraryName}", ${version})`);
        
        // Find library by name (case-insensitive partial match)
        const normalizedName = libraryName.toLowerCase();
        
        for (const [libName, libInfo] of this.libraryBases) {
            if (libName.toLowerCase().includes(normalizedName) || 
                normalizedName.includes(libName.toLowerCase().replace('.library', ''))) {
                
                console.log(`✅ [OPEN] Found ${libName} at base 0x${libInfo.baseAddress.toString(16)}`);
                
                // Mark library as open
                libInfo.isOpen = true;
                
                // Return library base address
                return libInfo.baseAddress;
            }
        }
        
        // Special handling for common library name variations
        const libraryAliases = {
            'dos': 'dos.library',
            'graphics': 'graphics.library',  
            'intuition': 'intuition.library',
            'gadtools': 'gadtools.library',
            'workbench': 'workbench.library',
            'icon': 'icon.library',
            'layers': 'layers.library',
            'utility': 'utility.library',
            'expansion': 'expansion.library'
        };
        
        const aliasName = libraryAliases[normalizedName];
        if (aliasName) {
            return this.openLibrary(aliasName, version);
        }
        
        console.warn(`⚠️ [OPEN] Library "${libraryName}" not found`);
        return 0; // NULL - library not found
    }

    // *** NEW: CloseLibrary implementation ***
    closeLibrary(libraryBase) {
        console.log(`📚 [CLOSE] CloseLibrary(0x${libraryBase.toString(16)})`);
        
        // Find library by base address
        for (const [libName, libInfo] of this.libraryBases) {
            if (libInfo.baseAddress === libraryBase) {
                console.log(`✅ [CLOSE] Closing ${libName}`);
                libInfo.isOpen = false;
                return;
            }
        }
        
        console.warn(`⚠️ [CLOSE] Library base 0x${libraryBase.toString(16)} not found`);
    }

    // *** NEW: Get library info by base address ***
    getLibraryInfo(baseAddress) {
        for (const [libName, libInfo] of this.libraryBases) {
            if (libInfo.baseAddress === baseAddress) {
                return {
                    name: libName,
                    base: baseAddress,
                    version: libInfo.resident.version,
                    vectorCount: libInfo.vectorCount,
                    isOpen: libInfo.isOpen
                };
            }
        }
        return null;
    }

    // *** NEW: Read library name string from memory ***
    readLibraryNameString(address) {
        let name = '';
        for (let i = 0; i < 64; i++) {
            const byte = this.readByte(address + i);
            if (byte === 0) break; // Null terminator
            if (byte >= 32 && byte <= 126) { // Printable ASCII
                name += String.fromCharCode(byte);
            } else {
                break; // Invalid character
            }
        }
        return name;
    }

    // *** NEW: Check if address is a library function call ***
    isLibraryFunctionCall(address) {
        // Check if this address is in any library's negative offset range
        for (const [libName, libInfo] of this.libraryBases) {
            const baseAddr = libInfo.baseAddress;
            const negativeRange = libInfo.vectorCount * 6;
            
            if (address >= baseAddr - negativeRange && address < baseAddr) {
                return {
                    library: libName,
                    base: baseAddr,
                    offset: address - baseAddr,
                    vectorIndex: Math.floor((baseAddr - address) / 6) - 1
                };
            }
        }
        
        // Check exec.library (ExecBase)
        if (this.execBaseAddr) {
            const execBase = this.execBaseAddr;
            if (address >= execBase - 552 && address < execBase) {
                return {
                    library: 'exec.library',
                    base: execBase,
                    offset: address - execBase,
                    vectorIndex: Math.floor((execBase - address) / 6) - 1
                };
            }
        }
        
        return null;
    }
    
    // *** NEW: Get current ROM status ***
    getROMStatus() {
        return {
            loaded: this.hasROMLoaded(),
            currentRom: this.currentRomId,
            romInfo: this.currentRomInfo,
            availableRoms: this.getAvailableROMs(),
            residentCount: this.residentModules.length,
            systemLibraries: this.systemLibraries || {},
            kickstartInitialized: this.kickstartInitialized
        };
    }
}

module.exports = { MemoryManager };