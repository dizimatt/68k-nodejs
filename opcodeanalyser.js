class OpcodeAnalyzer {
    constructor(cpu) {
        this.cpu = cpu;
        this.opcodeMap = new Map(); // opcode -> {module, handler, count}
        this.duplicates = [];
        this.missing = [];
        this.moduleStats = new Map();
    }

    analyzeOpcodeTable(opcodeTable) {
        console.log('🔍 [ANALYZER] Starting comprehensive opcode analysis...');
        
        // Reset analysis data
        this.opcodeMap.clear();
        this.duplicates = [];
        this.missing = [];
        this.moduleStats.clear();
        
        // Analyze current table state
        this.scanExistingTable(opcodeTable);
        this.findMissingCriticalOpcodes();
        this.generateReport();
        
        return {
            duplicates: this.duplicates,
            missing: this.missing,
            stats: this.getComprehensiveStats(),
            recommendations: this.getRecommendations()
        };
    }

    scanExistingTable(opcodeTable) {
        let implementedCount = 0;
        let nullCount = 0;
        
        for (let i = 0; i < 65536; i++) {
            if (opcodeTable[i] !== null && opcodeTable[i] !== undefined) {
                implementedCount++;
                
                // Try to identify which module this came from by analyzing the handler
                const handler = opcodeTable[i];
                const handlerStr = handler.toString();
                const moduleName = this.identifyModule(handlerStr);
                
                if (this.opcodeMap.has(i)) {
                    // Duplicate found!
                    this.duplicates.push({
                        opcode: i,
                        hex: `0x${i.toString(16).padStart(4, '0')}`,
                        originalModule: this.opcodeMap.get(i).module,
                        conflictModule: moduleName,
                        instruction: this.decodeInstruction(i)
                    });
                }
                
                this.opcodeMap.set(i, {
                    module: moduleName,
                    handler: handler,
                    count: 1
                });
                
                // Update module stats
                if (!this.moduleStats.has(moduleName)) {
                    this.moduleStats.set(moduleName, { count: 0, opcodes: [] });
                }
                this.moduleStats.get(moduleName).count++;
                this.moduleStats.get(moduleName).opcodes.push(i);
            } else {
                nullCount++;
            }
        }
        
        console.log(`📊 [ANALYZER] Scanned ${implementedCount} implemented opcodes, ${nullCount} unimplemented`);
    }

    identifyModule(handlerStr) {
        // Analyze function string to identify likely module
        if (handlerStr.includes('op_move')) return 'MoveOpcodes';
        if (handlerStr.includes('op_add') || handlerStr.includes('op_sub') || handlerStr.includes('op_cmp')) return 'ArithmeticOpcodes';
        if (handlerStr.includes('op_and') || handlerStr.includes('op_or') || handlerStr.includes('op_eor')) return 'LogicalOpcodes';
        if (handlerStr.includes('op_lsl') || handlerStr.includes('op_lsr') || handlerStr.includes('op_asl')) return 'ShiftOpcodes';
        if (handlerStr.includes('op_bra') || handlerStr.includes('op_bcc') || handlerStr.includes('op_jmp')) return 'BranchOpcodes';
        if (handlerStr.includes('op_jsr') || handlerStr.includes('op_lea') || handlerStr.includes('op_pea')) return 'SystemOpcodes';
        if (handlerStr.includes('op_nop') || handlerStr.includes('op_rts')) return 'BasicOpcodes';
        if (handlerStr.includes('op_btst') || handlerStr.includes('op_bset')) return 'ExtendedBitOpcodes';
        return 'Unknown';
    }

    findMissingCriticalOpcodes() {
        const criticalOpcodes = [
            // ACCURATE Missing CMP instructions (based on your existing implementation)
            { opcode: 0x0C18, name: 'CMPI.B #imm,(A0)+', priority: 'CRITICAL' },
            { opcode: 0x0C19, name: 'CMPI.B #imm,(A1)+', priority: 'CRITICAL' }, // Most likely what you need!
            { opcode: 0x0C1A, name: 'CMPI.B #imm,(A2)+', priority: 'HIGH' },
            { opcode: 0x0C1B, name: 'CMPI.B #imm,(A3)+', priority: 'HIGH' },
            { opcode: 0x0C1C, name: 'CMPI.B #imm,(A4)+', priority: 'HIGH' },
            { opcode: 0x0C1D, name: 'CMPI.B #imm,(A5)+', priority: 'HIGH' },
            { opcode: 0x0C1E, name: 'CMPI.B #imm,(A6)+', priority: 'HIGH' },
            { opcode: 0x0C1F, name: 'CMPI.B #imm,(A7)+', priority: 'HIGH' },
            
            // Pre-decrement addressing
            { opcode: 0x0C20, name: 'CMPI.B #imm,-(A0)', priority: 'HIGH' },
            { opcode: 0x0C21, name: 'CMPI.B #imm,-(A1)', priority: 'HIGH' },
            { opcode: 0x0C22, name: 'CMPI.B #imm,-(A2)', priority: 'HIGH' },
            { opcode: 0x0C23, name: 'CMPI.B #imm,-(A3)', priority: 'HIGH' },
            { opcode: 0x0C24, name: 'CMPI.B #imm,-(A4)', priority: 'HIGH' },
            { opcode: 0x0C25, name: 'CMPI.B #imm,-(A5)', priority: 'HIGH' },
            { opcode: 0x0C26, name: 'CMPI.B #imm,-(A6)', priority: 'HIGH' },
            { opcode: 0x0C27, name: 'CMPI.B #imm,-(A7)', priority: 'HIGH' },
            
            // Displacement addressing
            { opcode: 0x0C28, name: 'CMPI.B #imm,(d16,A0)', priority: 'HIGH' },
            { opcode: 0x0C29, name: 'CMPI.B #imm,(d16,A1)', priority: 'HIGH' },
            { opcode: 0x0C2A, name: 'CMPI.B #imm,(d16,A2)', priority: 'HIGH' },
            { opcode: 0x0C2B, name: 'CMPI.B #imm,(d16,A3)', priority: 'HIGH' },
            { opcode: 0x0C2C, name: 'CMPI.B #imm,(d16,A4)', priority: 'HIGH' },
            { opcode: 0x0C2D, name: 'CMPI.B #imm,(d16,A5)', priority: 'HIGH' },
            { opcode: 0x0C2E, name: 'CMPI.B #imm,(d16,A6)', priority: 'HIGH' },
            { opcode: 0x0C2F, name: 'CMPI.B #imm,(d16,A7)', priority: 'HIGH' },
            
            // Index addressing  
            { opcode: 0x0C30, name: 'CMPI.B #imm,(d8,A0,Xn)', priority: 'MEDIUM' },
            { opcode: 0x0C31, name: 'CMPI.B #imm,(d8,A1,Xn)', priority: 'MEDIUM' },
            { opcode: 0x0C32, name: 'CMPI.B #imm,(d8,A2,Xn)', priority: 'MEDIUM' },
            { opcode: 0x0C33, name: 'CMPI.B #imm,(d8,A3,Xn)', priority: 'MEDIUM' },
            { opcode: 0x0C34, name: 'CMPI.B #imm,(d8,A4,Xn)', priority: 'MEDIUM' },
            { opcode: 0x0C35, name: 'CMPI.B #imm,(d8,A5,Xn)', priority: 'MEDIUM' },
            { opcode: 0x0C36, name: 'CMPI.B #imm,(d8,A6,Xn)', priority: 'MEDIUM' },
            { opcode: 0x0C37, name: 'CMPI.B #imm,(d8,A7,Xn)', priority: 'MEDIUM' },
            
            // PC-relative addressing
            { opcode: 0x0C3A, name: 'CMPI.B #imm,(d16,PC)', priority: 'HIGH' },
            { opcode: 0x0C3B, name: 'CMPI.B #imm,(d8,PC,Xn)', priority: 'MEDIUM' },
            
            // TST instructions - critical for null checking
            { opcode: 0x4A00, name: 'TST.B D0', priority: 'HIGH' },
            { opcode: 0x4A01, name: 'TST.B D1', priority: 'HIGH' },
            { opcode: 0x4A02, name: 'TST.B D2', priority: 'HIGH' },
            { opcode: 0x4A03, name: 'TST.B D3', priority: 'HIGH' },
            { opcode: 0x4A04, name: 'TST.B D4', priority: 'HIGH' },
            { opcode: 0x4A05, name: 'TST.B D5', priority: 'HIGH' },
            { opcode: 0x4A06, name: 'TST.B D6', priority: 'HIGH' },
            { opcode: 0x4A07, name: 'TST.B D7', priority: 'HIGH' },
            
            { opcode: 0x4A40, name: 'TST.W D0', priority: 'HIGH' },
            { opcode: 0x4A80, name: 'TST.L D0', priority: 'HIGH' },
            
            // TRAP instructions - for system calls
            { opcode: 0x4E40, name: 'TRAP #0', priority: 'HIGH' },
            { opcode: 0x4E41, name: 'TRAP #1', priority: 'HIGH' },
            { opcode: 0x4E42, name: 'TRAP #2', priority: 'HIGH' },
            { opcode: 0x4E43, name: 'TRAP #3', priority: 'HIGH' },
            
            // Common arithmetic
            { opcode: 0xD000, name: 'ADD.B D0,D0', priority: 'MEDIUM' },
            { opcode: 0x9000, name: 'SUB.B D0,D0', priority: 'MEDIUM' },
            
            // Bit operations
            { opcode: 0x0800, name: 'BTST #imm,D0', priority: 'MEDIUM' },
            { opcode: 0x0840, name: 'BCHG #imm,D0', priority: 'MEDIUM' },
            { opcode: 0x0880, name: 'BCLR #imm,D0', priority: 'MEDIUM' },
            { opcode: 0x08C0, name: 'BSET #imm,D0', priority: 'MEDIUM' }
        ];
        
        for (const critical of criticalOpcodes) {
            if (!this.opcodeMap.has(critical.opcode)) {
                this.missing.push(critical);
            }
        }
        
        // Sort by priority
        this.missing.sort((a, b) => {
            const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    decodeInstruction(opcode) {
        // Basic instruction decoding for analysis
        const high4 = (opcode >> 12) & 0xF;
        
        if ((opcode & 0xF100) === 0x7000) {
            const reg = (opcode >> 9) & 7;
            return `MOVEQ #imm,D${reg}`;
        }
        
        if (high4 >= 1 && high4 <= 3) {
            const size = high4 === 1 ? 'B' : (high4 === 2 ? 'L' : 'W');
            return `MOVE.${size}`;
        }
        
        if ((opcode & 0xFF00) === 0x0C00) {
            return 'CMPI.B #imm,EA';
        }
        
        if ((opcode & 0xFF00) === 0x4A00) {
            return 'TST';
        }
        
        if ((opcode & 0xFFF0) === 0x4E40) {
            return 'TRAP';
        }
        
        return `UNKNOWN_${opcode.toString(16)}`;
    }

    getComprehensiveStats() {
        const total = 65536;
        const implemented = this.opcodeMap.size;
        const unimplemented = total - implemented;
        
        return {
            total,
            implemented,
            unimplemented,
            coverage: ((implemented / total) * 100).toFixed(2) + '%',
            duplicates: this.duplicates.length,
            criticalMissing: this.missing.filter(m => m.priority === 'CRITICAL').length,
            highPriorityMissing: this.missing.filter(m => m.priority === 'HIGH').length,
            moduleBreakdown: Array.from(this.moduleStats.entries()).map(([name, stats]) => ({
                module: name,
                count: stats.count,
                percentage: ((stats.count / implemented) * 100).toFixed(1) + '%'
            }))
        };
    }

    getRecommendations() {
        const recommendations = [];
        
        if (this.duplicates.length > 0) {
            recommendations.push({
                type: 'CRITICAL',
                title: 'Resolve Duplicate Opcodes',
                description: `Found ${this.duplicates.length} duplicate opcode assignments that could cause unpredictable behavior`,
                action: 'Review module loading order and ensure each opcode is only assigned once'
            });
        }
        
        const criticalMissing = this.missing.filter(m => m.priority === 'CRITICAL');
        if (criticalMissing.length > 0) {
            recommendations.push({
                type: 'CRITICAL',
                title: 'Implement Critical Missing Opcodes',
                description: `${criticalMissing.length} critical opcodes are missing, blocking core functionality`,
                action: `Implement: ${criticalMissing.map(m => m.name).join(', ')}`
            });
        }
        
        const highMissing = this.missing.filter(m => m.priority === 'HIGH');
        if (highMissing.length > 0) {
            recommendations.push({
                type: 'HIGH',
                title: 'Implement High Priority Opcodes', 
                description: `${highMissing.length} high priority opcodes missing`,
                action: `Consider implementing: ${highMissing.slice(0, 5).map(m => m.name).join(', ')}`
            });
        }
        
        return recommendations;
    }

    generateReport() {
        console.log('\n🎯 === 68K OPCODE ANALYSIS REPORT ===');
        
        const stats = this.getComprehensiveStats();
        console.log(`📊 Coverage: ${stats.implemented}/${stats.total} opcodes (${stats.coverage})`);
        
        if (this.duplicates.length > 0) {
            console.log('\n🚨 DUPLICATE OPCODES DETECTED:');
            this.duplicates.forEach(dup => {
                console.log(`  ${dup.hex}: ${dup.instruction} (${dup.originalModule} ↔ ${dup.conflictModule})`);
            });
        }
        
        if (this.missing.length > 0) {
            console.log('\n⚠️  MISSING CRITICAL OPCODES:');
            this.missing.slice(0, 10).forEach(miss => {
                console.log(`  0x${miss.opcode.toString(16).padStart(4, '0')}: ${miss.name} [${miss.priority}]`);
            });
        }
        
        console.log('\n📈 MODULE BREAKDOWN:');
        stats.moduleBreakdown.forEach(mod => {
            console.log(`  ${mod.module}: ${mod.count} opcodes (${mod.percentage})`);
        });
        
        const recommendations = this.getRecommendations();
        if (recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            recommendations.forEach(rec => {
                console.log(`  [${rec.type}] ${rec.title}`);
                console.log(`    ${rec.description}`);
                console.log(`    Action: ${rec.action}`);
            });
        }
        
        console.log('\n=== END ANALYSIS ===\n');
    }

    // Method to clean up duplicate opcodes
    cleanupDuplicates(opcodeTable) {
        console.log('🧹 [CLEANUP] Starting duplicate opcode cleanup...');
        
        const cleaned = [];
        for (const duplicate of this.duplicates) {
            // Keep the implementation from the more specific module
            const moduleRanking = {
                'ExtendedImmediateOpcodes': 1,
                'ExtendedAddressingOpcodes': 2, 
                'ExtendedBitOpcodes': 3,
                'MoveOpcodes': 4,
                'ArithmeticOpcodes': 5,
                'LogicalOpcodes': 6,
                'ShiftOpcodes': 7,
                'BranchOpcodes': 8,
                'SystemOpcodes': 9,
                'BasicOpcodes': 10
            };
            
            const originalRank = moduleRanking[duplicate.originalModule] || 99;
            const conflictRank = moduleRanking[duplicate.conflictModule] || 99;
            
            if (originalRank < conflictRank) {
                console.log(`  Keeping ${duplicate.originalModule} implementation for ${duplicate.hex}`);
            } else {
                console.log(`  Keeping ${duplicate.conflictModule} implementation for ${duplicate.hex}`);
            }
            
            cleaned.push(duplicate.hex);
        }
        
        console.log(`✅ [CLEANUP] Processed ${cleaned.length} duplicate opcodes`);
        return cleaned;
    }
}

// Usage example:
// const analyzer = new OpcodeAnalyzer(cpu);
// const analysis = analyzer.analyzeOpcodeTable(opcodeTable.table);
// analyzer.cleanupDuplicates(opcodeTable.table);

module.exports = OpcodeAnalyzer;