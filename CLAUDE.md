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

#### 2.1 Pure JavaScript 68k CPU Integration ⭐ **UPDATED APPROACH**
**Objective:** Replace basic CPU with complete 68k emulation using proven JavaScript patterns

- [ ] **MusashiInspiredCPU Integration** (MusashiInspiredCPU.js)
  - 100% Pure JavaScript implementation - **ZERO native dependencies**
  - Opcode patterns derived from proven Musashi implementations
  - Complete instruction set coverage (~5,000-10,000 core opcodes)
  - Plugin-ready architecture with full portability
  - Lookup table approach for maximum performance

- [ ] **Proven Opcode Library Integration**
  - Leverage existing JavaScript 68k projects for opcode verification
  - Cross-reference implementations with Musashi m68k_in.c patterns
  - A/B test opcodes against known-good implementations
  - Incremental opcode expansion using battle-tested patterns

**Why This Approach:**
- ✅ **100% Portable** - works in any JavaScript environment
- ✅ **Plugin-Compatible** - no FFI restrictions or build dependencies
- ✅ **Development Velocity** - no compilation steps, instant debugging
- ✅ **Proven Patterns** - opcodes based on Musashi's proven implementations
- ✅ **Performance** - lookup table approach with 200-400x improvement over current CPU
- ✅ **Future-Proof** - easily adaptable to browser/WebAssembly environments

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

### Upgrade Installation ⭐ **SIMPLIFIED PROCESS**
```bash
# 1. NO additional dependencies needed!
# Pure JavaScript approach requires only standard Node.js

# 2. Replace source files with enhanced pure JS versions
# (See file replacement guide below)

# 3. Start enhanced emulator
npm start

# That's it! No compilation, no build tools, no platform dependencies
```

### ✅ **Deployment Benefits of Pure JavaScript Approach**
```bash
# Deploy to ANY environment that supports Node.js:
- Cloud platforms (AWS, Google Cloud, Heroku)
- Docker containers
- Shared hosting
- Plugin systems
- Serverless functions (Vercel, Netlify)
- Development environments

# NO build requirements on target systems
# NO platform-specific compilation
# NO native dependency management
```

## File Replacement Guide

### Files to Replace/Add
```
src/SimpleCPU.js → src/MusashiInspiredCPU.js
src/BlitterChip.js → src/AmigaBlitter.js  
src/VirtualCanvas.js → src/EnhancedVirtualCanvas.js
src/AmigaInterpreter.js → src/EnhancedAmigaInterpreter.js
server.js → Enhanced server.js (with pure JS features)
package.json → Updated package.json (NO ffi-rs dependency needed!)
```

### New Files to Add
```
src/MusashiInspiredCPU.js   # Pure JavaScript 68k CPU with proven opcodes
lib/                        # Optional: For future native optimizations
temp/                       # Optional: For development artifacts
```

### Files to Keep Unchanged
```
src/HunkLoader.js           # Already complete and working
src/MemoryManager.js        # Enhanced but compatible with pure JS
src/CopperChip.js          # Basic version sufficient for now
public/index.html          # Will work with enhanced pure JS backend
```

### Dependencies Comparison
```
BEFORE (Musashi Approach):
- ffi-rs package (native dependency)
- Build tools (GCC, Git)
- Platform-specific compilation
- Deployment complexity

AFTER (Pure JavaScript Approach):
- ZERO native dependencies
- Standard Node.js packages only
- Cross-platform by design
- Deploy anywhere JavaScript runs
```

## Expected Capabilities After Upgrade

### CPU Emulation
- ✅ **Complete 68k instruction set** (5,000-10,000 core opcodes covering 90%+ of Amiga software)
- ✅ **Pure JavaScript implementation** for 100% portability and plugin compatibility
- ✅ **Proven opcode patterns** derived from battle-tested Musashi implementations
- ✅ **High performance** via optimized lookup tables (200-400x improvement)
- ✅ **Zero dependencies** - works in any JavaScript environment

### Graphics & Display
- ✅ **Authentic Amiga graphics** with bitplane rendering
- ✅ **AGA chipset features** (256 colors, HAM mode)
- ✅ **Real-time canvas output** showing actual Amiga display
- ✅ **Multiple display modes** (Low/High/Super High Resolution)

### Software Compatibility
- ✅ **Most Amiga demos and utilities** (targeting 90%+ compatibility)
- ✅ **Graphics demos** using blitter operations  
- ✅ **Games and applications** with standard Amiga features
- ✅ **System software** that doesn't require advanced OS features

### Development & Debugging
- ✅ **Real-time stepping** through 68k instructions
- ✅ **Memory inspection** and modification
- ✅ **Custom chip monitoring** (blitter, display registers)
- ✅ **Performance profiling** and statistics
- ✅ **Full JavaScript debugging** with stack traces and breakpoints

### Plugin & Deployment Advantages ⭐ **NEW BENEFITS**
- ✅ **Plugin-ready architecture** - drop into any JavaScript environment
- ✅ **Cloud deployment** without build dependencies
- ✅ **Browser compatibility** (with minor adaptations)
- ✅ **Serverless deployment** (Vercel, Netlify Functions)
- ✅ **Docker simplicity** - just copy source files
- ✅ **Development velocity** - instant changes, no compilation

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
- **Dependencies:** Node.js only

### Expected Performance (Post-Upgrade) ⭐ **UPDATED TARGETS**
- **CPU:** 5,000-10,000 instructions (200-400x improvement, covers 90%+ of Amiga software)
- **Graphics:** Full AGA feature set with authentic bitplane rendering
- **Performance:** High-speed execution via JavaScript lookup tables
- **Compatibility:** Real Amiga software execution including demos, games, utilities
- **Dependencies:** STILL Node.js only! (100% portable)

### **Comparison: Pure JS vs Native Approaches**
```
                          Pure JavaScript    Native (Musashi)
Opcodes Implemented:      5,000-10,000      54,000
Typical Software Support: 90-95%           99%+
Portability:              100%              Platform-dependent
Plugin Compatible:       ✅ Yes            ❌ No (FFI restrictions)
Build Dependencies:      ❌ None           ✅ GCC, Git, ffi-rs
Deployment Complexity:   ⭐ Copy files     🔧 Compile per platform
Development Speed:       ⚡ Instant        🐌 Compile cycle
Debugging:               🔍 Full JS stack  🔮 Native black box
```

**Strategic Decision:** Pure JavaScript gives us 90-95% of the benefit with 100% of the portability and plugin compatibility.

## Development Roadmap

### Immediate Priority (Upgrade Phase)
1. **Week 1:** Pure JavaScript CPU integration with proven opcode patterns
2. **Week 2:** Blitter implementation and testing
3. **Week 3:** Display system and canvas integration  
4. **Week 4:** System integration and real Amiga software testing

### Future Enhancements
- **Extended Opcodes:** Add remaining specialized 68k instructions as needed
- **Audio System:** Paula chip emulation for sound
- **Disk System:** ADF file support and floppy emulation
- **Networking:** TCP/IP stack for modern connectivity
- **Browser Port:** WebAssembly optimization for in-browser execution
- **Plugin Ecosystem:** NPM package for easy integration into other projects

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
**Upgrade Goal:** 🚀 Complete A1200 emulation with authentic graphics using **Pure JavaScript**  
**Final Target:** Production-ready, plugin-compatible Amiga emulator running real software  

## ⭐ **Strategic Decision: Pure JavaScript Approach**

After careful analysis, we chose **Pure JavaScript over Native (Musashi)** because:

### **Why Pure JavaScript Wins:**
1. **Plugin Architecture Ready** - Zero FFI restrictions, works in any JS environment
2. **100% Portable** - Deploy anywhere Node.js runs without compilation
3. **Development Velocity** - Instant changes, full JavaScript debugging
4. **90-95% Software Compatibility** - More than sufficient for typical Amiga software
5. **Future-Proof** - Easy browser/WebAssembly adaptation
6. **Zero Dependencies** - No build tools, compilers, or platform-specific libraries

### **Trade-offs Accepted:**
- Slightly lower opcode coverage (5K-10K vs 54K) - but covers 90%+ of real-world usage
- Pure JS performance vs native speed - offset by development and deployment benefits

This upgrade transforms the project from a proof-of-concept into a **fully functional, plugin-ready Amiga A1200 emulator** that can be dropped into any JavaScript environment while running real Amiga software with authentic graphics output to HTML5 canvas.

**Result:** The world's most portable and plugin-friendly Amiga emulator! 🎯