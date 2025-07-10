# CLAUDE.md - Amiga A1200 Emulator Project

## Project Overview

This project is a **Node.js-based Amiga A1200 emulator** that executes 68k machine code and outputs graphics directly to an HTML5 canvas. The emulator uses a Node.js backend for CPU and chipset emulation, with a web frontend for controls and real-time display output.

### Architecture Design

**Backend (Node.js):**
- Complete 68000/68020 CPU emulation
- Amiga custom chipset emulation (Blitter, Copper, AGA)
- Memory management (Chip RAM, Fast RAM, Custom registers)
- Amiga Hunk executable format loading

**Frontend (HTML5/JavaScript):**
- Web-based control interface
- HTML5 Canvas for authentic Amiga display output
- Real-time debugging and system inspection
- File upload for Amiga executables

**Display Pipeline:**
```
68k CPU → Custom Chips → Blitter → VirtualCanvas → HTML5 Canvas
```

## Current Project Structure (Pre-Upgrade)

```
amiga-executable-runner/
├── package.json                 # Node.js dependencies
├── server.js                    # Express web server
├── src/
│   ├── AmigaInterpreter.js      # Main emulator orchestrator
│   ├── HunkLoader.js            # Amiga executable parser
│   ├── MemoryManager.js         # Memory management system
│   ├── SimpleCPU.js             # Basic 68k CPU (limited instructions)
│   ├── BlitterChip.js           # Placeholder blitter emulation
│   ├── CopperChip.js            # Placeholder copper emulation
│   └── VirtualCanvas.js         # Basic display buffer
└── public/
    └── index.html               # Web interface
```

## Project Deliverables

### Phase 1: Original Implementation ✅
**Status: COMPLETED**

- [x] **Basic 68k CPU Emulation** (SimpleCPU.js)
  - NOP, RTS, JSR instructions
  - Stack management and program flow
  - Basic register handling
  
- [x] **Amiga Hunk Format Loading** (HunkLoader.js)
  - Parse Amiga executable format
  - Load CODE, DATA, BSS hunks
  - Memory layout management
  
- [x] **Memory Management** (MemoryManager.js)
  - Chip RAM and Fast RAM emulation
  - Custom register space ($DFF000-$DFF1FF)
  - Memory mapping and access control
  
- [x] **Web Interface** (index.html + server.js)
  - File upload for Amiga executables
  - Step-by-step execution control
  - Real-time CPU and memory debugging
  - HTML5 canvas placeholder for display

- [x] **System Integration** (AmigaInterpreter.js)
  - Component orchestration
  - Execution control (run/step/reset)
  - State management and debugging

### Phase 2: Complete Upgrade Plan 🚀
**Status: READY FOR IMPLEMENTATION**

#### 2.1 Complete 68k CPU Integration
**Objective:** Replace basic CPU with full Motorola 68000/68020 emulation

- [ ] **Musashi Integration** (Musashi68kCPU.js)
  - Industry-standard 68k emulator (used in MAME)
  - Complete instruction set (all ~54,000 valid opcodes)
  - Cycle-accurate timing for Amiga compatibility
  - 68020 support for A1200 accuracy
  - High-performance FFI binding via ffi-rs

- [ ] **Build System** (scripts/build-musashi.js)
  - Automated Musashi compilation
  - Platform-specific library building
  - Amiga-optimized configuration
  - Fallback stub implementation

#### 2.2 Advanced Graphics Architecture (AGA) Display System
**Objective:** Authentic Amiga A1200 graphics with HTML5 canvas output

- [ ] **Enhanced Display System** (EnhancedVirtualCanvas.js)
  - Multiple resolutions: 320x256, 640x256, 1280x256
  - AGA 256-color palette support
  - HAM (Hold-And-Modify) mode for thousands of colors
  - EHB (Extra Half-Brite) mode support
  - Bitplane rendering to RGBA canvas data
  - Real-time display register handling

- [ ] **Display Pipeline Integration**
  - Blitter → VirtualCanvas → HTML5 Canvas
  - Real-time scanline rendering
  - Proper aspect ratio and scaling
  - Performance optimization with dirty region tracking

#### 2.3 Complete Blitter Chip Emulation
**Objective:** Full Amiga blitter functionality for graphics operations

- [ ] **Blitter Implementation** (AmigaBlitter.js)
  - All blitter operation modes (area, line, fill)
  - 256 minterm logic functions
  - DMA channel management (A, B, C, D)
  - Shift operations and masking
  - Direct canvas pixel updates
  - Cycle-accurate timing

- [ ] **Graphics Operations**
  - Copy and move operations
  - Pattern fills and texture mapping
  - Line drawing with Bresenham algorithm
  - Boolean operations (AND, OR, XOR, etc.)

#### 2.4 Enhanced System Integration
**Objective:** Complete A1200 system emulation

- [ ] **Enhanced Interpreter** (EnhancedAmigaInterpreter.js)
  - A1200-specific memory map
  - Custom chip register routing
  - DMA and interrupt handling
  - Performance monitoring and statistics

- [ ] **Copper Chip Integration** (Enhanced CopperChip.js)
  - Basic copper list execution
  - WAIT and MOVE instructions
  - Display timing synchronization
  - Palette and register animations

## Technical Specifications

### Emulated Hardware: Commodore Amiga A1200
- **CPU:** Motorola 68020 @ 14MHz
- **Chipset:** AGA (Advanced Graphics Architecture)
- **Memory:** 2MB Chip RAM + 8MB Fast RAM
- **Display:** Up to 1280x256 resolution, 256 colors
- **Custom Chips:** Blitter, Copper, Enhanced display controllers

### Modern Implementation Stack
- **Backend:** Node.js with Express
- **CPU Emulation:** Musashi 68k core via FFI
- **Frontend:** HTML5 + Canvas + JavaScript
- **Graphics:** Real-time bitplane rendering
- **Performance:** ffi-rs (318k ops/s) for native bindings

## Installation & Setup

### Prerequisites
```bash
# Required tools
- Node.js 16+
- Git
- GCC compiler (for Musashi build)
```

### Current Setup (Pre-Upgrade)
```bash
git clone <repository>
cd amiga-executable-runner
npm install
npm start
# Access: http://localhost:3000
```

### Upgrade Installation
```bash
# 1. Install new dependencies
npm install ffi-rs

# 2. Build Musashi library
npm run setup

# 3. Replace source files with enhanced versions
# (See file replacement guide below)

# 4. Start enhanced emulator
npm start
```

## File Replacement Guide

### Files to Replace
```
src/SimpleCPU.js → src/Musashi68kCPU.js
src/BlitterChip.js → src/AmigaBlitter.js  
src/VirtualCanvas.js → src/EnhancedVirtualCanvas.js
src/AmigaInterpreter.js → src/EnhancedAmigaInterpreter.js
server.js → Enhanced server.js
package.json → Updated package.json
```

### New Files to Add
```
scripts/build-musashi.js     # Musashi build automation
lib/                         # Compiled libraries directory
temp/                        # Temporary build files
```

### Files to Keep Unchanged
```
src/HunkLoader.js           # Already complete
src/MemoryManager.js        # Enhanced but compatible
src/CopperChip.js          # Basic version sufficient for now
public/index.html          # Will work with enhanced backend
```

## Expected Capabilities After Upgrade

### CPU Emulation
- ✅ **Complete 68k instruction set** (all arithmetic, logic, control flow)
- ✅ **Cycle-accurate timing** for authentic Amiga behavior
- ✅ **68020 features** for A1200 compatibility
- ✅ **High performance** via optimized native library

### Graphics & Display
- ✅ **Authentic Amiga graphics** with bitplane rendering
- ✅ **AGA chipset features** (256 colors, HAM mode)
- ✅ **Real-time canvas output** showing actual Amiga display
- ✅ **Multiple display modes** (Low/High/Super High Resolution)

### Software Compatibility
- ✅ **Simple demos and utilities**
- ✅ **Graphics demos** using blitter operations  
- ✅ **Basic games** with standard Amiga features
- ✅ **System software** that doesn't require advanced OS features

### Development & Debugging
- ✅ **Real-time stepping** through 68k instructions
- ✅ **Memory inspection** and modification
- ✅ **Custom chip monitoring** (blitter, display registers)
- ✅ **Performance profiling** and statistics

## Testing Strategy

### Phase 1: Basic Functionality
1. **CPU Test:** Load simple NOP/RTS programs
2. **Memory Test:** Verify memory access patterns
3. **Display Test:** Basic pixel output to canvas

### Phase 2: Graphics Testing  
1. **Blitter Test:** Simple copy operations
2. **Palette Test:** Color cycling and changes
3. **Mode Test:** Different display resolutions

### Phase 3: Software Testing
1. **Demo Programs:** Simple Amiga demos
2. **Utilities:** Basic Amiga tools
3. **Games:** Simple arcade-style games

## Performance Expectations

### Current Performance (Pre-Upgrade)
- **CPU:** ~25 instructions implemented (NOP, RTS, JSR)
- **Graphics:** Placeholder display
- **Compatibility:** Sample programs only

### Expected Performance (Post-Upgrade)
- **CPU:** 54,000+ instructions (100% 68k compatibility)
- **Graphics:** Full AGA feature set
- **Performance:** 10-100x faster execution via Musashi
- **Compatibility:** Real Amiga software execution

## Development Roadmap

### Immediate Priority (Upgrade Phase)
1. **Week 1:** CPU integration and Musashi build
2. **Week 2:** Blitter implementation and testing
3. **Week 3:** Display system and canvas integration  
4. **Week 4:** System integration and debugging

### Future Enhancements
- **Audio System:** Paula chip emulation
- **Disk System:** ADF file support and floppy emulation
- **Networking:** TCP/IP stack for modern connectivity
- **Performance:** WebAssembly port for browser execution

## Support & Documentation

### Key Resources
- **Amiga Hardware Reference Manual:** Custom chip specifications
- **Musashi Documentation:** CPU emulator API reference
- **AGA Chipset Guide:** Advanced graphics features
- **68000 Programmer's Manual:** CPU instruction reference

### Debugging Tools
- **Real-time CPU inspection:** Registers, flags, stack
- **Memory viewers:** Hex dump and disassembly
- **Custom chip monitors:** Register values and DMA status
- **Performance profiling:** Cycle counts and timing analysis

---

## Project Goals Achievement

**Original Vision:** Node.js Amiga emulator with HTML5 canvas display  
**Current Status:** ✅ Basic framework complete  
**Upgrade Goal:** 🚀 Complete A1200 emulation with authentic graphics  
**Final Target:** Production-ready Amiga emulator running real software  

This upgrade transforms the project from a proof-of-concept into a fully functional Amiga A1200 emulator capable of running real Amiga software with authentic graphics output to HTML5 canvas.