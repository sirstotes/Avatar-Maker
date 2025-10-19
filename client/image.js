class ImageLayer {
    constructor(packURL, source, applyTint = true) {
        if(source instanceof Object) {
            this.source = packURL + source.source;
            this.applyTint = source.applyTint;
        } else {
            this.source = packURL + source;
            this.applyTint = applyTint;
        }
        this.img = undefined; //not loaded yet
    }
    load(p) {
        this.img = p.loadImage(this.source);
    }
}
class LayeredImage {
    constructor(packURL, layers, thumbnail = {scale:1, x:0, y:0}) {
        this.layers = [];
        layers.forEach(layer => {
            if (layer instanceof ImageLayer) {
                this.layers.push(layer);
            } else {
                this.layers.push(new ImageLayer(packURL, layer));
            }
        });
        this.thumbnail = thumbnail;
    }
    draw(p, tintColor) {
        this.layers.forEach(layer => {
            if(layer.applyTint) {
                p.tint(tintColor);
            }
            p.image(layer.img, 0, 0);
            p.noTint();
        })
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