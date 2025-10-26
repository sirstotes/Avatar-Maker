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
    constructor() {
        this.tintColor = undefined;
        this.mode = "tint";
    }
    tint(tintColor) {
        this.tintColor = tintColor;
        return this;
    }
    recolorMode(mode) {
        this.mode = mode;
        return this;
    }
}
class ImageLayer {
    constructor(packURL, options) {
        this.source = packURL + options.source;
        if(options.applyTint == undefined) {
            this.applyTint = true;
        } else {
            this.applyTint = options.applyTint;
        }
        this.image = undefined; //not loaded yet
    }
    preload(p5) {
        this.image = p5.loadImage(this.source);
    }
    setup(p5) {
        // if(this.savePixels) {
        //     this.image.loadPixels();
        //     this.pixels = [...this.image.pixels];//Is it more performant to save the pixels array or load it each frame?
        // }
    }
    draw(buffer, imageSettings) {
        // this.drawPixels(buffer, function(x, y, r, g, b, a) {
        //     if(!imageSettings.bitMask[Math.floor(x) + Math.floor(y) * buffer.width]) {
        //         return;
        //     }
        //     normalBlend(buffer.pixels, buffer.width, Math.floor(x), Math.floor(y), r, g, b, a);
        // }, imageSettings.bitMask);
        if(this.applyTint && imageSettings.tintColor != undefined) {
            if(imageSettings.mode == "tint") {
                buffer.tint(imageSettings.tintColor);
            } else {
                drawingContext.filter = `hue-rotate(${buffer.hue(imageSettings.tintColor)}deg)saturate(${buffer.saturation(imageSettings.tintColor)})brightness(${buffer.brightness(imageSettings.tintColor)}%)`; 
            }
        }
        buffer.image(this.image, 0, 0);
        buffer.noTint();
    }
    // drawPixels(canvas, drawFunction, bitMask) {
    // //It might also be a lot faster to draw the image to a buffer and then just copy the pixels over. I think this is the solution I'm gonna go for.
    //     let transform = canvas.drawingContext.getTransform();
    //     //const topLeft = transform.transformPoint(new DOMPointReadOnly(-this.image.width * 0.5, -this.image.height * 0.5));
    //     //const topRight = transform.transformPoint(new DOMPointReadOnly(this.image.width * 0.5, -this.image.height * 0.5));
    //     //const bottomLeft = transform.transformPoint(new DOMPointReadOnly(-this.image.width * 0.5, this.image.height * 0.5));
    //     //const bottomRight = transform.transformPoint(new DOMPointReadOnly(this.image.width * 0.5, this.image.height * 0.5));
    //     for(let x = 0; x < this.image.width; x += 10) {//TODO: should try not to render every pixel, that's too slow
    //         for(let y = 0; y < this.image.height; y += 10) {
    //             //let displayX = x;
    //             //let displayY = y;

    //             //Transform point according to image transform

    //             //This solution is not correct for rotations and leaves gaps
    //             //let displayX = canvas.map(x, 0, this.image.width, topLeft.x, bottomRight.x);
    //             //let displayY = canvas.map(y, 0, this.image.height, topLeft.y, bottomRight.y);

    //             //This solution is correct but too slow
    //             let f = transform.transformPoint(new DOMPointReadOnly(x - this.image.width * 0.5, y - this.image.height * 0.5));
    //             let displayX = f.x;
    //             let displayY = f.y;
                
    //             if(displayX < 0 || displayX >= buffer.width || displayY < 0 || displayY >= buffer.height) {
    //                 continue;
    //             }
    //             //drawFunction(displayX, displayY, 0, 0, 0, 255);
    //             let n = (x + y*this.image.width) * 4;
    //             drawFunction(displayX, displayY, this.pixels[n], this.pixels[n + 1], this.pixels[n + 2], this.pixels[n + 3]);
    //         }
    //     }
    // }
}
class LayeredImage {
    constructor(packURL, options) {
        this.layers = [];
        if(options.source instanceof Array) {
            options.source.forEach(layer => {
                if (layer instanceof Object) {
                    this.layers.push(new ImageLayer(packURL, layer));
                } else {
                    this.layers.push(new ImageLayer(packURL, {source: layer, applyTint: true}));
                }
            });
        } else if (options.source instanceof Object) {
            this.layers.push(new ImageLayer(packURL, options.source));
        } else {
            this.layers.push(new ImageLayer(packURL, {source: options.source, applyTint: true}));
        }
        this.thumbnail = options.thumbnail;
    }
    // calculateMask(buffer) {
    //     this.mask = new Array(buffer.width*buffer.height).fill(false);
    //     //Right now masks are just a binary 0 or 1 to hopefully cut down on performance cost. Could be worth it to check if 0-255 is performant, as it would allow more seamless masking.
    //     //If 0-255 does not run in realtime, I'd want to calculate it when exporting the image.
    //     buffer.clear();
    //     this.draw(buffer, new ImageSettings());
    //     buffer.loadPixels();
    //     for(let x = 0; x < buffer.width; x ++) {
    //         for (let y = 0; y < buffer.height; y ++) {
    //             this.mask[x + y*buffer.height] = buffer.pixels[(x + y*buffer.height) * 4] > 0;
    //         }
    //     }
    // }
    // getMask() {
    //     return this.mask;
    // }
    draw(buffer, imageSettings) {
        this.layers.forEach(layer => layer.draw(buffer, imageSettings));
    }
    getWidth() {
        if(this.layers != undefined) {
            return this.layers[0].image.width;
        }
        return 0;
    }
    getHeight() {
        if(this.layers != undefined) {
            return this.layers[0].image.height;
        }
        return 0;
    }
    onclick() {}
    preload(p5) {
        this.layers.forEach(layer => layer.preload(p5));
    }
    setup(p5) {
        this.layers.forEach(layer => layer.setup(p5));
    }
    getSketch(selected, tintColor, onclick) {
        let layeredImage = this;
        return function(p5) {
            p5.setup = function() {
                let canvas = p5.createCanvas(200, 200);
                canvas.addClass("extrude");
                if(selected) {
                    canvas.addClass("selected");
                }
                canvas.parent('selectable_elements');
                canvas.removeAttribute("style");
                canvas.canvas.addEventListener("click", onclick);
                p5.noLoop();
            }
            p5.draw = function() {
                p5.background(255);
                layeredImage.layers.forEach(layer => {
                    if(layer.applyTint) {
                        p5.tint(tintColor);
                    }
                    let w = p5.width * layeredImage.thumbnail.scale;
                    let h = p5.height * layeredImage.thumbnail.scale * (layer.image.height/layer.image.width);
                    p5.image(layer.image, p5.width*0.5-w*0.5 + layeredImage.thumbnail.x * layeredImage.thumbnail.scale, p5.height*0.5-w*0.5 + layeredImage.thumbnail.y * layeredImage.thumbnail.scale, w, h);
                    p5.noTint();
                });
            }
        };
    }
}