class Buffers {
    constructor(processing, width, height, canvas) {
        this.p5 = processing;
        this.canvas = canvas;
        this.buffers = [];
        this.width = width;
        this.height = height;
        this.currentBuffer = 0;
        this.addBuffer(canvas);
    }
    static clip(blendFunction) {
        return function(rA, gA, bA, aA, rB, gB, bB, aB) {
            return blendFunction(rA, gA, bA, aA * (aB/255), rB, gB, bB, aB);
        };
    }
    static discard(rA, gA, bA, aA, rB, gB, bB, aB) {
        return [rA, gA, bA, aA];
    }
    static override(rA, gA, bA, aA, rB, gB, bB, aB) {
        return [rB, gB, bB, aB];
    }
    static over(rA, gA, bA, aA, rB, gB, bB, aB) {
        if(aB > 0) {
            return [rB, gB, bB, aB];
        }
        return [rA, gA, bA, aA];
    }
    static normalBlend(rA, gA, bA, aA, rB, gB, bB, aB) {
        let aN = aA + aB * (1 - aA);
        return [(rA * aA + rB * aB * (1 - aA)) / aN, 
                (gA * aA + gB * aB * (1 - aA)) / aN, 
                (bA * aA + bB * aB * (1 - aA)) / aN, 
                aN];
    }
    getCanvas() {
        return this.buffers[0];
    }
    getCurrent() {
        return this.buffers[this.currentBuffer];
    }
    getNext() {
        return this.buffers[this.currentBuffer + 1];
    }
    addBuffer(canvas=undefined) {
        let buffer = this.p5.createFramebuffer(this.width, this.height, canvas);
        buffer.name = "Buffer "+this.buffers.length;
        buffer.angleMode(p.DEGREES);
        buffer.imageMode(p.CENTER);
        buffer.rectMode(p.CENTER);
        buffer.drawingContext.willReadFrequently = true;
        this.buffers.push(buffer);
    }
    clear() {
        this.updateCanvas = false;
        this.buffers.forEach(buffer => {
            buffer.clear(); 
            buffer.resetMatrix();
        });
    }
    push() {
        this.currentBuffer ++;
        if(this.currentBuffer >= this.buffers.length) {
            this.addBuffer();
        }
        this.getCurrent().clear();
        return this.getCurrent();
    }
    pop(blendFunction = Buffers.normalBlend) {
        this.currentBuffer -= 1;
        if(this.currentBuffer < 0) {
            console.error("Tried to pop canvas buffer");
            this.currentBuffer = 0;
        }
        this.getCurrent().loadPixels();
        this.getNext().loadPixels();
        console.log("BLENDING "+(this.currentBuffer+1)+" TO "+this.currentBuffer);
        for(let i = 0; i < this.getCurrent().pixels.length; i += 4) {
            let pixel = blendFunction(this.getNext().pixels[i], this.getNext().pixels[i + 1], this.getNext().pixels[i + 2], this.getNext().pixels[i + 3],
            this.getCurrent().pixels[i], this.getCurrent().pixels[i + 1], this.getCurrent().pixels[i + 2], this.getCurrent().pixels[i + 3]);
            this.getCurrent().pixels[i] = pixel[0];
            this.getCurrent().pixels[i + 1] = pixel[1];
            this.getCurrent().pixels[i + 2] = pixel[2];
            this.getCurrent().pixels[i + 3] = pixel[3];
        }
        this.getCurrent().updatePixels();
        // if(this.currentBuffer == 0) {
        //     console.log("UPDATE PIXELS");
        //     this.getCanvas().updatePixels();
        // }
        //this.getCurrent().save(this.getCurrent().name);
        return this.getCurrent();
    }
}