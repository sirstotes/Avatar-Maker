function setRGBA(pixels, width, x, y, r, g, b, a) {
    let n = (x + y*width) * 4;
    pixels[n] = r;
    pixels[n + 1] = g;
    pixels[n + 2] = b;
    pixels[n + 3] = a;
}
function normalBlend(pixels, width, x, y, rA, gA, bA, aA) {
    let n = (x + y*width) * 4;
    let rB = pixels[n];
    let gB = pixels[n+1];
    let bB = pixels[n+2];
    let aB = pixels[n+3];

    let aN = aA + aB * (1 - aA);
    pixels[n] = (rA * aA + rB * aB * (1 - aA)) / aN;
    pixels[n + 1] = (gA * aA + gB * aB * (1 - aA)) / aN;
    pixels[n + 2] = (bA * aA + bB * aB * (1 - aA)) / aN;
    pixels[n + 3] = aN;
}
function getRGBA(pixels, width, x, y) {
    let n = (x + y*width) * 4;
    return [pixels[n], pixels[n + 1], pixels[n + 2], pixels[n + 3]];
}
class ImageSettings {
    constructor(tintColor, bitMask = undefined) {
        this.tintColor = tintColor;
        this.bitMask = bitMask;
    }
}
class ImageLayer {
    constructor(packURL, options, savePixels = false) {
        this.source = packURL + options.source;
        this.applyTint = options.applyTint || true;
        this.savePixels = savePixels;
        this.img = undefined; //not loaded yet
    }
    preload(p) {
        this.img = p.loadImage(this.source);
    }
    setup(p) {
        if(this.savePixels) {
            this.img.loadPixels();
            this.pixels = [...this.img.pixels];//Is it more performant to save the pixels array or load it each frame?
        }
    }
    draw(canvas, imageSettings) {
        if(imageSettings.bitMask != undefined) {
            this.drawPixels(canvas, function(x, y, r, g, b, a) {
                if(!imageSettings.bitMask[Math.floor(x) + Math.floor(y) * pack.canvasWidth]) {
                    return;
                }
                normalBlend(canvas.pixels, pack.canvasWidth, Math.floor(x), Math.floor(y), r, g, b, a);
            }, imageSettings.bitMask);
        } else {
            if(this.applyTint && imageSettings.tintColor != undefined) {
                canvas.tint(imageSettings.tintColor);
            }
            canvas.image(this.img, 0, 0);
            canvas.noTint();
        }
    }
    drawPixels(canvas, drawFunction, bitMask) {
    //TODO: Rather than looping over every pixel in the image, it could be faster to loop over every pixel in the bitmask
    //It might also be a lot faster to draw the image to a buffer and then just copy the pixels over. I think this is the solution I'm gonna go for.
        let transform = canvas.drawingContext.getTransform();
        //const topLeft = transform.transformPoint(new DOMPointReadOnly(-this.img.width * 0.5, -this.img.height * 0.5));
        //const topRight = transform.transformPoint(new DOMPointReadOnly(this.img.width * 0.5, -this.img.height * 0.5));
        //const bottomLeft = transform.transformPoint(new DOMPointReadOnly(-this.img.width * 0.5, this.img.height * 0.5));
        //const bottomRight = transform.transformPoint(new DOMPointReadOnly(this.img.width * 0.5, this.img.height * 0.5));
        for(let x = 0; x < this.img.width; x += 10) {//TODO: should try not to render every pixel, that's too slow
            for(let y = 0; y < this.img.height; y += 10) {
                //let displayX = x;
                //let displayY = y;

                //Transform point according to image transform

                //This solution is not correct for rotations and leaves gaps
                //let displayX = canvas.map(x, 0, this.img.width, topLeft.x, bottomRight.x);
                //let displayY = canvas.map(y, 0, this.img.height, topLeft.y, bottomRight.y);

                //This solution is correct but too slow
                let f = transform.transformPoint(new DOMPointReadOnly(x - this.img.width * 0.5, y - this.img.height * 0.5));
                let displayX = f.x;
                let displayY = f.y;
                
                if(displayX < 0 || displayX >= pack.canvasWidth || displayY < 0 || displayY >= pack.canvasHeight) {
                    continue;
                }
                //drawFunction(displayX, displayY, 0, 0, 0, 255);
                let n = (x + y*this.img.width) * 4;
                drawFunction(displayX, displayY, this.pixels[n], this.pixels[n + 1], this.pixels[n + 2], this.pixels[n + 3]);
            }
        }
    }
}
class LayeredImage {
    constructor(packURL, options) {
        this.layers = [];
        if(options.source instanceof Array) {
            options.source.forEach(layer => {
                if (layer instanceof Object) {
                    this.layers.push(new ImageLayer(packURL, layer, options.savePixels));
                } else {
                    this.layers.push(new ImageLayer(packURL, {source: layer, applyTint: true}, options.savePixels));
                }
            });
        } else if (options.source instanceof Object) {
            this.layers.push(new ImageLayer(packURL, options.source, options.savePixels));
        } else {
            this.layers.push(new ImageLayer(packURL, {source: options.source, applyTint: true}, options.savePixels));
        }
        this.thumbnail = options.thumbnail;
    }
    calculateMask(buffer) {
        this.mask = new Array(pack.canvasWidth*pack.canvasHeight).fill(false);
        //Right now masks are just a binary 0 or 1 to hopefully cut down on performance cost. Could be worth it to check if 0-255 is performant, as it would allow more seamless masking.
        //If 0-255 does not run in realtime, I'd want to calculate it when exporting the image.
        buffer.clear();
        this.draw(buffer, new ImageSettings());
        buffer.loadPixels();
        for(let x = 0; x < pack.canvasWidth; x ++) {
            for (let y = 0; y < pack.canvasHeight; y ++) {
                this.mask[x + y*pack.canvasHeight] = buffer.pixels[(x + y*pack.canvasHeight) * 4] > 0;
            }
        }
    }
    getMask() {
        return this.mask;
    }
    draw(canvas, imageSettings) {
        if(imageSettings.bitMask != undefined) {
            canvas.loadPixels();
        }
        this.layers.forEach(layer => layer.draw(canvas, imageSettings));
        if(imageSettings.bitMask != undefined) {
            canvas.updatePixels();
        }
    }
    getWidth() {
        if(this.layers != undefined) {
            return this.layers[0].img.width;
        }
        return 0;
    }
    getHeight() {
        if(this.layers != undefined) {
            return this.layers[0].img.height;
        }
        return 0;
    }
    onclick() {}
    preload(p) {
        this.layers.forEach(layer => layer.preload(p));
    }
    setup() {
        this.layers.forEach(layer => layer.setup(p));
    }
    getSketch(selected, tintColor, onclickGenerator) {
        let layeredImage = this;
        return function(p) {
            p.canvasSize = 200;
            p.setup = function() {
                let canvas = p.createCanvas(p.canvasSize, p.canvasSize);
                canvas.addClass("extrude");
                if(selected) {
                    canvas.addClass("selected");
                }
                canvas.parent('selectable_elements');
                canvas.removeAttribute("style");
                p.background(255);
            }
            p.draw = function() {
                layeredImage.layers.forEach(layer => {
                    if(layer.applyTint) {
                        p.tint(tintColor);
                    }
                    let w = p.canvasSize * layeredImage.thumbnail.scale;
                    let h = p.canvasSize * layeredImage.thumbnail.scale * (layer.img.height/layer.img.width);
                    p.image(layer.img, p.canvasSize*0.5-w*0.5 + layeredImage.thumbnail.x * layeredImage.thumbnail.scale, p.canvasSize*0.5-w*0.5 + layeredImage.thumbnail.y * layeredImage.thumbnail.scale, w, h);
                    p.noTint();
                });
            }
            p.mouseClicked = onclickGenerator(p);
        };
    }
}