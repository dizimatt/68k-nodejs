// src/MusashiInspiredCPU.js - Main Entry Point (Clean and Simple)

const { CPUCore } = require('./cpu/CPUCore');

class MusashiInspiredCPU extends CPUCore {
    constructor(memory) {
        super(memory);
        console.log('🚀 [CPU] MusashiInspiredCPU ready - 100% Pure JavaScript');
    }
}

module.exports = { MusashiInspiredCPU };