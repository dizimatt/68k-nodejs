# ROM-Driven Mode: Authentic Amiga Emulation

## Overview

This document explains the transition from **JavaScript stubbing** to **authentic ROM-driven initialization** in the Amiga emulator.

## Problem with Previous Approach

### JavaScript Stubbing (Old Way)
```javascript
// ❌ JavaScript doing Amiga's job:
initializeExecLibraryVectors() {
    // JavaScript manually creating what ROM should create
    this.createOpenLibraryStub(0x10000);
    this.createJumpVector(0x1D8, 0x10000);
}
```

**Issues:**
- 500+ lines of stub creation code
- JavaScript approximating Amiga behavior
- Manual jump vector creation
- Not authentic to real hardware
- Maintenance complexity

### ROM-Driven Approach (New Way)
```javascript
// ✅ Authentic approach - Amiga doing its own job:
const resetVectors = memory.enableROMDrivenMode();
cpu.initializeFromROM(resetVectors);
cpu.run(); // ROM code handles its own initialization
```

**Benefits:**
- Authentic Amiga behavior
- Less emulator code to maintain
- ROM handles edge cases automatically
- Works with different Kickstart versions
- Debuggable through actual Amiga startup code

## Implementation Details

### 1. ROM Reset Vector Extraction

```javascript
// Located in MemoryManager.js:693-698
validateROMStructure(romBuffer) {
    const view = new DataView(romBuffer.buffer);
    
    const resetSSP = view.getUint32(0, false);    // Reset Stack Pointer
    const resetPC = view.getUint32(4, false);     // Reset Program Counter
    
    this.romResetVectors = {
        stackPointer: resetSSP,
        programCounter: resetPC
    };
}
```

### 2. ROM-Driven Mode Activation

```javascript
enableROMDrivenMode() {
    console.log('🚀 [ROM] Enabling authentic ROM-driven initialization mode');
    
    this.romDrivenMode = true;
    this.libraryStubs.clear();  // Remove JavaScript stubs
    
    return this.getROMResetVectors();
}
```

### 3. CPU Initialization from ROM

```javascript
initializeFromROM(resetVectors) {
    // Set registers from ROM reset vectors
    this.registers.pc = resetVectors.programCounter >>> 0;
    this.registers.a[7] = resetVectors.stackPointer >>> 0;
    this.registers.sr = 0x2700;  // Supervisor mode
    
    this.running = true;
    this.initialized = true;
}
```

## API Usage

### Enable ROM-Driven Mode
```bash
# 1. Load ROM
curl -X POST http://localhost:3000/roms/load-default

# 2. Enable ROM-driven mode
curl -X POST http://localhost:3000/roms/enable-rom-driven-mode

# 3. Initialize CPU from ROM vectors
curl -X POST http://localhost:3000/cpu/initialize-from-rom

# 4. Execute ROM startup code
curl -X POST http://localhost:3000/step
```

### Check Mode Status
```bash
curl http://localhost:3000/roms/status | jq '.status.romDrivenMode'
```

## Execution Flow Comparison

### Old Flow (JavaScript Stubs)
```
1. Load ROM into memory
2. Parse ROM resident structures (JavaScript)
3. Create JavaScript stub functions
4. Create jump vectors pointing to stubs
5. Initialize CPU with user program entry point
6. Execute user program
7. User program calls JSR (-552,A6)
8. CPU jumps to JavaScript stub
9. Stub returns fake library base
```

### New Flow (ROM-Driven)
```
1. Load ROM into memory
2. Enable ROM-driven mode (disable stubs)
3. Extract ROM reset vectors
4. Initialize CPU with ROM reset PC/SP
5. Execute ROM startup code
6. ROM scans resident structures
7. ROM creates jump vectors naturally
8. ROM initializes ExecBase and libraries
9. ROM sets up memory management
10. ROM transfers control to user programs
```

## Key Advantages

### 1. Authenticity
- Real Amiga ROM code executes
- Authentic initialization sequence
- Hardware-accurate behavior

### 2. Compatibility
- Works with different Kickstart versions
- Handles ROM variations automatically
- Future-proof for ROM updates

### 3. Debugging
- Step through actual Amiga startup
- Trace ROM initialization code
- Understand real hardware behavior

### 4. Maintenance
- Eliminates 500+ lines of stub code
- Reduces JavaScript complexity
- ROM handles its own edge cases

## Testing

Run the test script to see both modes:

```bash
./test_rom_driven_mode.sh
```

This demonstrates:
1. Traditional stub-based initialization
2. Transition to ROM-driven mode
3. CPU initialization from ROM vectors
4. Execution of authentic ROM code

## Future Integration

Once ROM-driven mode is stable, it will become the default initialization method, eliminating the need for JavaScript library stubs entirely.

The emulator will become a **pure hardware simulation** rather than a **software reimplementation**, providing the most authentic Amiga experience possible.