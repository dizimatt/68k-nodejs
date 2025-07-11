// Enhanced MemoryManager.js with Kickstart Integration

class MemoryManager {
    constructor() {
        this.chipRam = new Uint8Array(2 * 1024 * 1024); // 2MB chip RAM
        this.fastRam = new Uint8Array(8 * 1024 * 1024); // 8MB fast RAM
        this.customRegisters = new Uint16Array(0x200); // Custom chip registers
        this.hunks = [];
        
        // *** NEW: Kickstart memory layout ***
        this.kickstartInitialized = false;
        this.EXECBASE_PTR = 0x000004;           // ExecBase pointer location
        this.EXECBASE_ADDR = 0x01000000;        // ExecBase structure location (16MB)
        this.EXEC_LIBRARY_BASE = 0x01001000;    // exec.library jump table
        this.DOS_LIBRARY_BASE = 0x01002000;     // dos.library jump table  
        this.GRAPHICS_LIBRARY_BASE = 0x01003000; // graphics.library jump table
        this.LIBRARY_STUBS_BASE = 0x01010000;   // Our rewritten library functions
        
        // Library function offsets (negative offsets from library base)
        this.EXEC_FUNCTIONS = {
            AllocMem: -198,      // -0xC6
            FreeMem: -210,       // -0xD2  
            OpenLibrary: -552,   // -0x228
            CloseLibrary: -414,  // -0x19E
            FindTask: -294,      // -0x126
            Permit: -138,        // -0x8A
            Forbid: -132,        // -0x84
        };
        
        this.nextStubAddress = this.LIBRARY_STUBS_BASE;
        this.libraryStubs = new Map(); // Track created stubs
        
        console.log('🏗️ [MEMORY] MemoryManager initialized with Kickstart support');
    }
    
    // *** NEW: Initialize Kickstart system ***
    initializeKickstart() {
        if (this.kickstartInitialized) {
            console.log('⚠️ [KICKSTART] Already initialized');
            return;
        }
        
        console.log('🚀 [KICKSTART] Initializing ExecBase and library system...');
        
        // 1. Set ExecBase pointer at address 4
        this.writeLong(this.EXECBASE_PTR, this.EXECBASE_ADDR);
        console.log(`📍 [KICKSTART] ExecBase pointer: 0x${this.EXECBASE_PTR.toString(16).padStart(8, '0')} → 0x${this.EXECBASE_ADDR.toString(16).padStart(8, '0')}`);
        
        // 2. Initialize ExecBase structure
        this.setupExecBaseStructure();
        
        // 3. Setup exec.library jump table
        this.setupExecLibraryJumpTable();
        
        this.kickstartInitialized = true;
        console.log('✅ [KICKSTART] ExecBase and exec.library initialized successfully');
        
        // Debug: Show key memory locations
        this.debugKickstartLayout();
    }
    
    // *** NEW: Setup ExecBase structure ***
    setupExecBaseStructure() {
        console.log('🔧 [KICKSTART] Setting up ExecBase structure...');
        
        const execBase = this.EXECBASE_ADDR;
        
        // ExecBase structure (simplified)
        // Offset 0: Library node (standard library header)
        this.writeLong(execBase + 0, 0);        // ln_Succ
        this.writeLong(execBase + 4, 0);        // ln_Pred  
        this.writeByte(execBase + 8, 9);        // ln_Type (NT_LIBRARY)
        this.writeByte(execBase + 9, 0);        // ln_Pri
        this.writeLong(execBase + 10, 0);       // ln_Name (pointer to "exec.library")
        
        // Offset 14: Library specific
        this.writeWord(execBase + 14, 0x0105);  // lib_Flags
        this.writeWord(execBase + 16, 0);       // lib_pad
        this.writeWord(execBase + 18, 22);      // lib_NegSize (size of negative part)
        this.writeWord(execBase + 20, 100);     // lib_PosSize (size of positive part)
        this.writeWord(execBase + 22, 39);      // lib_Version
        this.writeWord(execBase + 24, 1);       // lib_Revision
        this.writeLong(execBase + 26, 0);       // lib_IdString
        this.writeLong(execBase + 30, 0);       // lib_Sum
        this.writeWord(execBase + 34, 1);       // lib_OpenCnt
        
        // Key ExecBase fields
        this.writeLong(execBase + 36, this.EXEC_LIBRARY_BASE); // Library base pointer
        
        console.log(`📋 [KICKSTART] ExecBase structure created at 0x${execBase.toString(16)}`);
    }
    
    // *** NEW: Setup exec.library jump table ***
    setupExecLibraryJumpTable() {
        console.log('🔧 [KICKSTART] Setting up exec.library jump table...');
        
        const execBase = this.EXEC_LIBRARY_BASE;
        
        // Create jump table entries (JMP instructions to our rewritten functions)
        for (const [funcName, offset] of Object.entries(this.EXEC_FUNCTIONS)) {
            const jumpTableAddr = execBase + offset;
            const targetAddr = this.createLibraryStub(funcName);
            
            // Write JMP instruction: 0x4EF9 (JMP absolute.L) + target address
            this.writeWord(jumpTableAddr, 0x4EF9);
            this.writeLong(jumpTableAddr + 2, targetAddr);
            
            console.log(`📋 [KICKSTART] ${funcName.padEnd(12)}: 0x${jumpTableAddr.toString(16)} → JMP 0x${targetAddr.toString(16)}`);
        }
        
        console.log('✅ [KICKSTART] exec.library jump table setup complete');
    }
    
    // *** NEW: Create library function stubs ***
    createLibraryStub(functionName) {
        // Check if stub already exists
        if (this.libraryStubs.has(functionName)) {
            return this.libraryStubs.get(functionName);
        }
        
        // Allocate space for our rewritten function
        const stubAddr = this.allocateStubSpace(functionName);
        
        switch (functionName) {
            case 'AllocMem':
                this.createAllocMemStub(stubAddr);
                break;
            case 'FreeMem':
                this.createFreeMemStub(stubAddr);
                break;
            case 'OpenLibrary':
                this.createOpenLibraryStub(stubAddr);
                break;
            case 'CloseLibrary':
                this.createCloseLibraryStub(stubAddr);
                break;
            default:
                this.createGenericStub(stubAddr, functionName);
                break;
        }
        
        this.libraryStubs.set(functionName, stubAddr);
        return stubAddr;
    }
    
    // *** NEW: Allocate space for stub functions ***
    allocateStubSpace(functionName) {
        const stubAddr = this.nextStubAddress;
        this.nextStubAddress += 64; // 64 bytes per stub (plenty of space)
        
        console.log(`🔧 [KICKSTART] Allocating stub space for ${functionName}: 0x${stubAddr.toString(16)}`);
        return stubAddr;
    }
    
    // *** NEW: Create specific library function stubs ***
    createAllocMemStub(stubAddr) {
        console.log(`🔧 [KICKSTART] Creating AllocMem stub at 0x${stubAddr.toString(16)}`);
        
        // AllocMem(size:D0, requirements:D1) -> memory:D0
        // Simple implementation: return a fake allocated address
        const code = [
            // Check if size is reasonable
            0x0C80, 0x0010, 0x0000,    // CMPI.L #$100000,D0 (check if size > 1MB)
            0x6E06,                    // BGT.S fail (if too big, fail)
            
            // Simulate successful allocation
            0x203C, 0x0020, 0x0000,    // MOVE.L #$200000,D0 (fake allocated memory at 2MB)
            0x4E75,                    // RTS
            
            // Fail case
            0x7000,                    // MOVEQ #0,D0 (return NULL)
            0x4E75                     // RTS
        ];
        
        this.writeStubCode(stubAddr, code);
        console.log(`✅ [KICKSTART] AllocMem stub created: returns memory at 0x200000`);
    }
    
    createFreeMemStub(stubAddr) {
        console.log(`🔧 [KICKSTART] Creating FreeMem stub at 0x${stubAddr.toString(16)}`);
        
        // FreeMem(memory:A1, size:D0) - just return success
        const code = [
            0x4E75  // RTS (just return - memory is "freed")
        ];
        
        this.writeStubCode(stubAddr, code);
        console.log(`✅ [KICKSTART] FreeMem stub created: always succeeds`);
    }
    
    createOpenLibraryStub(stubAddr) {
        console.log(`🔧 [KICKSTART] Creating OpenLibrary stub at 0x${stubAddr.toString(16)}`);
        
        // OpenLibrary(name:A1, version:D0) -> library:D0
        // Return fake library base for dos.library
        const code = [
            0x203C, 0x0100, 0x2000,    // MOVE.L #$1002000,D0 (fake dos.library base)
            0x4E75                     // RTS
        ];
        
        this.writeStubCode(stubAddr, code);
        console.log(`✅ [KICKSTART] OpenLibrary stub created: returns dos.library at 0x1002000`);
    }
    
    createCloseLibraryStub(stubAddr) {
        console.log(`🔧 [KICKSTART] Creating CloseLibrary stub at 0x${stubAddr.toString(16)}`);
        
        // CloseLibrary(library:A1) - just return
        const code = [
            0x4E75  // RTS
        ];
        
        this.writeStubCode(stubAddr, code);
        console.log(`✅ [KICKSTART] CloseLibrary stub created: always succeeds`);
    }
    
    createGenericStub(stubAddr, functionName) {
        console.log(`🔧 [KICKSTART] Creating generic stub for ${functionName} at 0x${stubAddr.toString(16)}`);
        
        // Generic success stub
        const code = [
            0x7000,  // MOVEQ #0,D0 (return success)
            0x4E75   // RTS
        ];
        
        this.writeStubCode(stubAddr, code);
        console.log(`✅ [KICKSTART] Generic stub created for ${functionName}`);
    }
    
    // *** NEW: Write stub code to memory ***
    writeStubCode(address, codeWords) {
        let offset = 0;
        for (const word of codeWords) {
            if (word <= 0xFF) {
                // Single byte
                this.writeByte(address + offset, word);
                offset += 1;
            } else {
                // Word (16-bit)
                this.writeWord(address + offset, word);
                offset += 2;
            }
        }
        
        console.log(`📝 [KICKSTART] Wrote ${offset} bytes of code to 0x${address.toString(16)}`);
    }
    
    // *** NEW: Debug kickstart layout ***
    debugKickstartLayout() {
        console.log('\n📋 [KICKSTART] Memory Layout Summary:');
        console.log(`ExecBase Pointer: 0x${this.EXECBASE_PTR.toString(16).padStart(8, '0')} → 0x${this.readLong(this.EXECBASE_PTR).toString(16).padStart(8, '0')}`);
        console.log(`ExecBase Struct:  0x${this.EXECBASE_ADDR.toString(16).padStart(8, '0')}`);
        console.log(`exec.library:     0x${this.EXEC_LIBRARY_BASE.toString(16).padStart(8, '0')}`);
        console.log(`Library Stubs:    0x${this.LIBRARY_STUBS_BASE.toString(16).padStart(8, '0')}`);
        
        console.log('\n📋 [KICKSTART] Function Jump Table:');
        for (const [funcName, offset] of Object.entries(this.EXEC_FUNCTIONS)) {
            const jumpAddr = this.EXEC_LIBRARY_BASE + offset;
            const targetAddr = this.readLong(jumpAddr + 2);
            console.log(`${funcName.padEnd(12)}: 0x${jumpAddr.toString(16)} → 0x${targetAddr.toString(16)}`);
        }
        console.log('');
    }
    
    // *** NEW: Check if address is a library call ***
    isLibraryAddress(address) {
        return address >= this.EXEC_LIBRARY_BASE && address < this.LIBRARY_STUBS_BASE + 0x1000;
    }
    
    // *** NEW: Get library function info ***
    getLibraryFunctionInfo(address) {
        // Check if it's in exec.library jump table
        if (address >= this.EXEC_LIBRARY_BASE && address < this.EXEC_LIBRARY_BASE + 0x1000) {
            const offset = address - this.EXEC_LIBRARY_BASE;
            for (const [funcName, funcOffset] of Object.entries(this.EXEC_FUNCTIONS)) {
                if (funcOffset === offset) {
                    return {
                        library: 'exec',
                        function: funcName,
                        offset: offset
                    };
                }
            }
        }
        
        return null;
    }
    
    // Existing memory methods...
    loadHunks(hunks) {
        // Initialize Kickstart when first executable is loaded
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
        if (address >= 0xDFF000 && address < 0xDFF200) {
            // Custom chip register
            const reg = (address - 0xDFF000) >> 1;
            return this.customRegisters[reg] & 0xFF;
        }
        
        if (address < this.chipRam.length) {
            return this.chipRam[address];
        }
        
        if (address >= 0x400000 && address < 0x400000 + this.fastRam.length) {
            return this.fastRam[address - 0x400000];
        }
        
        // *** NEW: Handle library/system memory ***
        if (address >= 0x01000000 && address < 0x02000000) {
            // System memory area - simulate with zeros for now
            return 0;
        }
        
        return 0;
    }
    
    writeByte(address, value) {
        if (address >= 0xDFF000 && address < 0xDFF200) {
            // Custom chip register
            const reg = (address - 0xDFF000) >> 1;
            this.customRegisters[reg] = (this.customRegisters[reg] & 0xFF00) | (value & 0xFF);
            return;
        }
        
        if (address < this.chipRam.length) {
            this.chipRam[address] = value;
            return;
        }
        
        if (address >= 0x400000 && address < 0x400000 + this.fastRam.length) {
            this.fastRam[address - 0x400000] = value;
            return;
        }
        
        // *** NEW: Handle library/system memory ***
        if (address >= 0x01000000 && address < 0x02000000) {
            // System memory area - for now, just ignore writes
            // In a full implementation, this would write to system RAM
            return;
        }
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
    
    getChipRamSample() {
        // Return first 1024 bytes for debugging
        return Array.from(this.chipRam.slice(0, 1024));
    }
    
    getCustomRegisters() {
        return Array.from(this.customRegisters.slice(0, 32));
    }
    
    // Reset working state but keep loaded hunks and kickstart
    resetWorkingState() {
        console.log('🧹 [MEMORY] Resetting working state (preserving loaded hunks and Kickstart)...');
        
        // Clear all memory
        this.chipRam.fill(0);
        this.fastRam.fill(0);
        this.customRegisters.fill(0);
        
        // DON'T clear hunks array or kickstart
        // this.hunks = [];  ← DON'T do this!
        // this.kickstartInitialized = false;  ← DON'T do this!
        
        // Reinitialize Kickstart (this will set up the system again)
        if (this.kickstartInitialized) {
            this.kickstartInitialized = false;
            this.initializeKickstart();
        }
        
        console.log(`✅ [MEMORY] Working state cleared, ${this.hunks.length} hunks and Kickstart preserved`);
    }
    
    // Complete reset (clears everything including loaded executable and kickstart)
    reset() {
        console.log('🧹 [MEMORY] Complete reset - clearing all data including Kickstart...');
        
        this.chipRam.fill(0);
        this.fastRam.fill(0);
        this.customRegisters.fill(0);
        this.hunks = [];
        this.kickstartInitialized = false;
        this.libraryStubs.clear();
        this.nextStubAddress = this.LIBRARY_STUBS_BASE;
        
        console.log('✅ [MEMORY] Complete reset finished');
    }
    
    // Check if executable is loaded
    hasExecutableLoaded() {
        return this.hunks.length > 0;
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
            hunks: this.hunks.map(hunk => ({
                type: hunk.type,
                address: hunk.loadAddress,
                size: hunk.data.length
            }))
        };
    }
}

module.exports = { MemoryManager };