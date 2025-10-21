// let blendModes = {
//     "normal": function(a, b) {
//         let alpha = a.a + b.a * (1 - a.a);
//         let r = (a.r * a.a + b.r * b.a * (1 - a.a)) / alpha;
//         let g = (a.g * a.a + b.g * b.a * (1 - a.a)) / alpha;
//         let b = (a.b * a.a + b.b * b.a * (1 - a.a)) / alpha;
//     }
// };
// function applyPixels(lower, upper, blend) {
//     return lower.map((pixel, index) => blend(pixel, upper[index]));
// }
class ImageSettings {
    constructor(tintColor, clipFunction = undefined) {
        this.tintColor = tintColor;
        this.clipFunction = clipFunction;
    }
}
class ImageLayer {
    constructor(packURL, source, applyTint = true, applyClip = true) {
        if(source instanceof Object) {
            this.source = packURL + source.source;
            this.applyTint = source.applyTint;
            this.applyClip = source.applyClip;
        } else {
            this.source = packURL + source;
            this.applyTint = applyTint;
            this.applyClip = applyClip;
        }
        this.img = undefined; //not loaded yet
    }
    load(p) {
        this.img = p.loadImage(this.source);
    }
    draw(p, imageSettings) {
        if(this.applyTint && imageSettings.tintColor != undefined) {
            p.tint(imageSettings.tintColor);
        }
        // if(this.applyClip && imageSettings.clipFunction != undefined) {
        //     p.clip(imageSettings.clipFunction);
        // }
        p.image(this.img, 0, 0);
        p.noTint();
    }
}
class LayeredImage {
    constructor(packURL, layers, thumbnail = {scale:1, x:0, y:0}) {
        this.layers = [];
        if(layers instanceof Array) {
            layers.forEach(layer => {
                if (layer instanceof ImageLayer) {
                    this.layers.push(layer);
                } else {
                    this.layers.push(new ImageLayer(packURL, layer));
                }
            });
        } else if (layers instanceof ImageLayer) {
            this.layers.push(layers);
        } else {
            this.layers.push(new ImageLayer(packURL, layers));
        }
        
        this.thumbnail = thumbnail;
    }
    draw(p, imageSettings) {
        this.layers.forEach(layer => layer.draw(p, imageSettings));
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
    load(p) {
        this.layers.forEach(layer => {
            layer.load(p);
        });
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