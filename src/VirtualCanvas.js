class VirtualCanvas {
    constructor() {
        this.width = 320;
        this.height = 256;
        this.pixels = new Uint8Array(this.width * this.height);
        this.palette = new Array(32).fill(0x000000);
    }
    
    update() {
        // Placeholder for display updates
    }
    
    getPixelData() {
        return {
            width: this.width,
            height: this.height,
            pixels: Array.from(this.pixels.slice(0, 100)) // Sample for debugging
        };
    }
    
    reset() {
        this.pixels.fill(0);
    }
}
module.exports = { VirtualCanvas };
