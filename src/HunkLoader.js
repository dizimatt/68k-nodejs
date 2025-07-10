// src/HunkLoader.js - Fixed version with proper buffer handling

class HunkLoader {
    loadHunks(buffer) {
        // Debug: Log what we received
        console.log('HunkLoader received:', {
            type: typeof buffer,
            constructor: buffer.constructor.name,
            isBuffer: Buffer.isBuffer(buffer),
            isUint8Array: buffer instanceof Uint8Array,
            length: buffer.length || buffer.byteLength
        });
        
        // Convert different buffer types to ArrayBuffer
        let arrayBuffer;
        
        if (buffer instanceof ArrayBuffer) {
            // Already an ArrayBuffer
            arrayBuffer = buffer;
        } else if (Buffer.isBuffer(buffer)) {
            // Node.js Buffer - convert to ArrayBuffer
            arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        } else if (buffer instanceof Uint8Array) {
            // Uint8Array - convert to ArrayBuffer
            arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        } else {
            throw new Error(`Unsupported buffer type: ${buffer.constructor.name}`);
        }
        
        console.log('Converted to ArrayBuffer:', arrayBuffer.byteLength, 'bytes');
        
        // Now create DataView from the ArrayBuffer
        const view = new DataView(arrayBuffer);
        let offset = 0;
        
        try {
            // Check magic number
            const magic = view.getUint32(offset, false); // Big endian
            console.log(`Magic number: 0x${magic.toString(16)}`);
            
            if (magic !== 0x000003F3) {
                throw new Error(`Invalid Amiga executable. Expected magic 0x000003F3, got 0x${magic.toString(16)}`);
            }
            offset += 4;
            
            // Skip library dependencies (should be 0)
            const libCount = view.getUint32(offset, false);
            console.log(`Library count: ${libCount}`);
            offset += 4;
            
            if (libCount !== 0) {
                throw new Error('Library dependencies not supported in this simple implementation');
            }
            
            // Read hunk count
            const hunkCount = view.getUint32(offset, false);
            console.log(`Hunk count: ${hunkCount}`);
            offset += 4;
            
            // Read first and last hunk numbers
            const firstHunk = view.getUint32(offset, false);
            const lastHunk = view.getUint32(offset + 4, false);
            console.log(`Hunks: ${firstHunk} to ${lastHunk}`);
            offset += 8;
            
            // Read hunk sizes
            const hunkSizes = [];
            for (let i = 0; i < hunkCount; i++) {
                const size = view.getUint32(offset, false);
                hunkSizes.push(size);
                console.log(`Hunk ${i} size: ${size} longwords (${size * 4} bytes)`);
                offset += 4;
            }
            
            // Load hunks
            const hunks = [];
            let currentAddress = 0x400000; // Start loading at 4MB (arbitrary)
            
            for (let i = 0; i < hunkCount; i++) {
                try {
                    const hunk = this.loadHunk(view, offset, currentAddress, hunkSizes[i]);
                    hunks.push(hunk);
                    offset = hunk.nextOffset;
                    currentAddress += Math.max(hunk.data.length, 4); // Ensure minimum spacing
                } catch (error) {
                    console.error(`Error loading hunk ${i}:`, error);
                    throw new Error(`Failed to load hunk ${i}: ${error.message}`);
                }
            }
            
            console.log(`Successfully loaded ${hunks.length} hunks`);
            return hunks;
            
        } catch (error) {
            console.error('HunkLoader error:', error);
            console.error('Buffer dump (first 64 bytes):', this.dumpBuffer(arrayBuffer, 64));
            throw error;
        }
    }
    
    loadHunk(view, offset, loadAddress, expectedSize) {
        console.log(`Loading hunk at offset 0x${offset.toString(16)}`);
        
        // Check bounds
        if (offset >= view.byteLength) {
            throw new Error(`Offset ${offset} exceeds buffer length ${view.byteLength}`);
        }
        
        const hunkType = view.getUint32(offset, false);
        console.log(`Hunk type: 0x${hunkType.toString(16)}`);
        offset += 4;
        
        let hunkData = new Uint8Array(0);
        let hunkName = '';
        
        switch (hunkType) {
            case 0x3E9: // HUNK_CODE
                hunkName = 'CODE';
                break;
            case 0x3EA: // HUNK_DATA
                hunkName = 'DATA';
                break;
            case 0x3EB: // HUNK_BSS
                hunkName = 'BSS';
                break;
            default:
                throw new Error(`Unsupported hunk type: 0x${hunkType.toString(16)}`);
        }
        
        if (hunkType !== 0x3EB) { // Not BSS
            const dataSize = view.getUint32(offset, false) * 4; // Size in longwords
            console.log(`${hunkName} hunk data size: ${dataSize} bytes`);
            offset += 4;
            
            // Check bounds for data
            if (offset + dataSize > view.byteLength) {
                throw new Error(`Hunk data extends beyond buffer: need ${offset + dataSize}, have ${view.byteLength}`);
            }
            
            // Create new Uint8Array from the data
            hunkData = new Uint8Array(dataSize);
            for (let i = 0; i < dataSize; i++) {
                hunkData[i] = view.getUint8(offset + i);
            }
            offset += dataSize;
            
            // Pad to longword boundary
            while (offset % 4 !== 0) offset++;
        } else {
            // BSS hunk - just allocate space
            const bssSize = view.getUint32(offset, false) * 4;
            console.log(`BSS hunk size: ${bssSize} bytes`);
            offset += 4;
            hunkData = new Uint8Array(bssSize); // Already zeroed
        }
        
        // Skip relocation info for now (simplified)
        // Look for HUNK_END marker
        while (offset < view.byteLength) {
            const marker = view.getUint32(offset, false);
            console.log(`Checking marker at offset 0x${offset.toString(16)}: 0x${marker.toString(16)}`);
            
            if (marker === 0x3F2) { // HUNK_END
                console.log(`Found HUNK_END at offset 0x${offset.toString(16)}`);
                offset += 4;
                break;
            }
            
            // Skip other hunk types (relocation, etc.)
            if (marker === 0x3EC) { // HUNK_RELOC32
                console.log('Skipping HUNK_RELOC32');
                offset += 4;
                // Skip relocation data (simplified)
                while (offset < view.byteLength) {
                    const count = view.getUint32(offset, false);
                    offset += 4;
                    if (count === 0) break;
                    const hunkNum = view.getUint32(offset, false);
                    offset += 4;
                    offset += count * 4; // Skip relocation offsets
                }
            } else {
                // Unknown marker, skip
                offset += 4;
            }
        }
        
        console.log(`Loaded ${hunkName} hunk: ${hunkData.length} bytes at 0x${loadAddress.toString(16)}`);
        
        return {
            type: hunkName,
            data: hunkData,
            loadAddress: loadAddress,
            nextOffset: offset
        };
    }
    
    // Helper method to dump buffer contents for debugging
    dumpBuffer(arrayBuffer, maxBytes = 64) {
        const view = new DataView(arrayBuffer);
        const bytes = [];
        const limit = Math.min(maxBytes, arrayBuffer.byteLength);
        
        for (let i = 0; i < limit; i++) {
            bytes.push(view.getUint8(i).toString(16).padStart(2, '0'));
        }
        
        return bytes.join(' ');
    }
}

module.exports = { HunkLoader };