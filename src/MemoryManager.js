// Enhanced MemoryManager.js - CORRECTED for Step 1 Fixes

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
        };
        
        // Stub management (for later ROM integration)
        this.nextStubAddress = 0x01010000;             // Our implementation area
        this.libraryStubs = new Map();                 // Track created stubs
        
        console.log('🏗️ [MEMORY] MemoryManager initialized - ready for Kickstart ROM loading');
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
    
    // *** CORRECTED: Get library function info ***
    getLibraryFunctionInfo(address) {
        // This will be implemented properly after ROM loading
        // For now, return null as we don't have real library info
        return null;
    }
    
    // *** Existing memory methods (unchanged) ***
    loadHunks(hunks) {
        // Initialize basic ExecBase when first executable is loaded
        if (!this.kickstartInitialized) {
            this.initializeKickstart();
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
            console.warn(`⚠️ [MEMORY] Attempt to write to ROM at 0x${address.toString(16)} - ignored`);
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
        
        // Re-initialize ExecBase if we have hunks
        if (this.hunks.length > 0 || this.kickstartRom) {
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
        console.log(`Hunks Loaded:      ${this.hunks.length}`);
        console.log(`Kickstart Init:    ${this.kickstartInitialized}`);
        console.log('');
    }
}

module.exports = { MemoryManager };