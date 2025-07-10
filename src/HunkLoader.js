class HunkLoader {
    loadHunks(buffer) {
        const view = new DataView(buffer);
        let offset = 0;
        
        // Check magic number
        const magic = view.getUint32(offset, false); // Big endian
        if (magic !== 0x000003F3) {
            throw new Error(`Invalid Amiga executable. Expected magic 0x000003F3, got 0x${magic.toString(16)}`);
        }
        offset += 4;
        
        // Skip library dependencies (should be 0)
        const libCount = view.getUint32(offset, false);
        offset += 4;
        
        if (libCount !== 0) {
            throw new Error('Library dependencies not supported in this simple implementation');
        }
        
        // Read hunk count
        const hunkCount = view.getUint32(offset, false);
        offset += 4;
        
        // Read first and last hunk numbers
        const firstHunk = view.getUint32(offset, false);
        const lastHunk = view.getUint32(offset + 4, false);
        offset += 8;
        
        console.log(`Loading ${hunkCount} hunks (${firstHunk} to ${lastHunk})`);
        
        // Read hunk sizes
        const hunkSizes = [];
        for (let i = 0; i < hunkCount; i++) {
            const size = view.getUint32(offset, false);
            hunkSizes.push(size);
            offset += 4;
        }
        
        // Load hunks
        const hunks = [];
        let currentAddress = 0x400000; // Start loading at 4MB (arbitrary)
        
        for (let i = 0; i < hunkCount; i++) {
            const hunk = this.loadHunk(view, offset, currentAddress, hunkSizes[i]);
            hunks.push(hunk);
            offset = hunk.nextOffset;
            currentAddress += hunk.data.length;
        }
        
        return hunks;
    }
    
    loadHunk(view, offset, loadAddress, expectedSize) {
        const hunkType = view.getUint32(offset, false);
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
            offset += 4;
            
            hunkData = new Uint8Array(view.buffer, offset, dataSize);
            offset += dataSize;
            
            // Pad to longword boundary
            while (offset % 4 !== 0) offset++;
        } else {
            // BSS hunk - just allocate space
            const bssSize = view.getUint32(offset, false) * 4;
            offset += 4;
            hunkData = new Uint8Array(bssSize);
        }
        
        // Skip relocation info for now (simplified)
        // In a real implementation, you'd process HUNK_RELOC32 here
        
        // Skip to end marker
        while (offset < view.byteLength) {
            const marker = view.getUint32(offset, false);
            if (marker === 0x3F2) { // HUNK_END
                offset += 4;
                break;
            }
            offset += 4;
        }
        
        console.log(`Loaded ${hunkName} hunk: ${hunkData.length} bytes at 0x${loadAddress.toString(16)}`);
        
        return {
            type: hunkName,
            data: hunkData,
            loadAddress: loadAddress,
            nextOffset: offset
        };
    }
}
module.exports = { HunkLoader };
