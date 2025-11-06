class Element extends ElementContainer {
    constructor() {
        super();
    }
    async init(json = {}, base = true) {
        await super.init({}, base);
        this.parent = undefined;
        this.name = "";
        this.thumbnail = undefined;
        this.images = [];
        this.options.colors = new Option(this, "colors", "assets/color-picker.png")
            .property("mode", "tint")
            .property("palette", undefined, {save:false})
            .property("allowCustomColors", true)
            .property("value", "white", {split: true})
            .randomFunction(function(property) {
                const randomColor = function() {
                    return `hsl(${Math.floor(Math.random()*360)}, 100%, 50%)`;
                }
                if(property == "value") {
                    if(this.hasDefinedProperty("palette")) {
                        let pal = this.getValue("palette");
                        return pal[Math.floor(Math.random()*pal.length)];
                    } else {
                        return randomColor();
                    }
                    //Pick random color from palette if it exists
                } else if (property == "palette") {
                    return [randomColor(), randomColor(), randomColor(), randomColor(), randomColor()];
                } else {
                    console.error(`Unable to generate a random value for property ${this.name}:${property}`);
                }
            })
            .style(function(element) {
                if(element.getDisplayColor() != "white") {
                    return `background-color:${element.getDisplayColor()};`;
                }
                return "";
            })
            .click(function(element, button) {
                hideControls();
                selectedElement = element;
                cancelButton(button);
                if(element.get("colors", "mode") == "shift") {
                    showColorPicker();
                } else {
                    showColorPalette();
                }
            });
        this.selectedImage = 0;
        this.childrenNode = undefined;
        this.boundingBox = undefined;
        await this.processJSON(json);
        console.log("INITIALIZING ELEMENT: "+(this.name||"unnamed"));
        if(this.name != "") {
            elementLookupTable[this.name] = this;
        }
    }
    canHaveChildren() {
        return this.children.length > 0 || this.canAddChildren;
    }
    getColorPalette() {
        if(this.get("colors", "palette") == undefined) {
            return currentPack.defaultPalette;
        }
        return this.get("colors", "palette");
    }
    getCurrentImage() {
        return this.images[this.getImageNumber()];
    }
    getDisplayColor() {
        return this.get("colors");
    }
    getImageNumber() {
        if(this.selectedImage instanceof Object) {
            if(elementLookupTable.hasOwnProperty(this.selectedImage.copy)) {
                return elementLookupTable[this.selectedImage.copy].getImageNumber();
            }
            return 0;
        }
        return this.selectedImage;
    }
    isPointInBoundingBox(point) {
        return true;
    }
    // getParentMask() {
    //     let parent = this.getFirstElementParent();
    //     if(parent != undefined) {
    //         return parent.getMask();
    //     }
    //     return undefined;
    // }
    // getMask() {
    //     return this.getCurrentImage().getMask();
    // }
    needsNewBuffer() {
        return this.get("clip") || super.needsNewBuffer();
    }
    needsParentBufferSeparate() {
        return this.get("clip");
    }
    hasColorPalette() {
        return this.get("colors", "palette") != undefined;
    }
    addColorToPalette(color) {
        if(!this.getColorPalette().includes(color)) {
            this.getColorPalette().push(color);
        }
    }
    // calculateMask(buffer) {//Could it be faster to have individual methods for transforming the mask? like moving all the pixels to the left etc?
    //     this.applyTransforms(buffer);
    //     this.getCurrentImage().calculateMask(buffer);
    //     buffer.resetMatrix();
    // }
    createMainButton() {
        const mainButton = document.createElement("button");
        mainButton.classList.add("image");
        if(this.thumbnail == undefined) {
             mainButton.innerHTML = "<img src='assets/category.png'>";
        } else {
            if(this.thumbnail.split("/")[0] == "default_icons") {
                mainButton.innerHTML = "<img src='assets/"+this.thumbnail+"'>";
            } else {
                mainButton.innerHTML = "<img src='"+currentPack.URL+this.thumbnail+"'>";
            }
        }
        
        const emnt = this;
        if(this.images.length > 1) {
            mainButton.classList.add("extrude");
            mainButton.onclick = function() {
                showImageSelectPopup(emnt);
            }
        }
        return mainButton;
    }
    cycleCurrentImage() {
        this.selectedImage ++;
        this.selectedImage = this.selectedImage%this.images.length;
    }
    draw(buffer) {
        if(this.images.length > 0) {
            this.getCurrentImage().draw(buffer, new ImageSettings().tint(this.getDisplayColor()).recolorMode(this.get("colors", "mode")));
        }
    }
    drawAfter(buffer) {//Method called after drawing children
        if(this.images.length > 0) {
            this.getCurrentImage().drawAfter(buffer, new ImageSettings().tint(this.getDisplayColor()).recolorMode(this.get("colors", "mode")));
        }
    }
    drawBoundingBox(buffer) {
        this.applyTransforms(buffer);
        buffer.noFill();
        buffer.drawingContext.setLineDash([2, 6]);
        buffer.strokeWeight(3);
        buffer.stroke(0);
        buffer.rect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.w, this.boundingBox.h);
        let origin = this.get("transform", "origin");
        buffer.line(origin.x, origin.y-10, origin.x, origin.y+10);
        buffer.line(origin.x-10, origin.y, origin.x+10, origin.y);
        buffer.resetMatrix();
    }
    exportJSON() {
        let json = super.exportJSON();
        json.selectedImage = this.getImageNumber();
        return json;
    }
    refreshDisplay() {
        super.refreshDisplay();
        this.resetDisplayColor();
    }
    removeColorOption(color) {
        for(let i = this.getColorPalette().length-1; i > -1; i --) {
            if(this.getColorPalette()[i] == color) {
                this.getColorPalette().splice(i, 1);
            }
        }
    }
    resetDisplayColor() {
        this.getOption("colors").revert();
    }
    saveDisplayColor() {
        this.getOption("colors").save();
    }
    selectImage(layeredImage) {
        if(this.images.includes(layeredImage)) {
            this.selectedImage = this.images.indexOf(layeredImage);
        }
    }
    preload(p5) {
        console.log("LOADING IMAGES FOR: "+this.name);
        this.images.forEach(image => image.preload(p5));
        super.preload(p5);
    }
    setup(p5) {
        this.images.forEach(image => image.setup(p5));
        if(this.boundingBox == undefined) {
            this.boundingBox = {x:0, y:0, w:this.getCurrentImage().getWidth(), h:this.getCurrentImage().getHeight()};
        }
        super.setup(p5);
    }
    setColorPalette(palette) {
        this.set("colors", "palette", palette);
    }
    setDisplayColor(color) {
        this.set("colors", color);
    }
    toggleClip() {
        this.get("clip") = !this.get("clip");
    }
    async processJSON(json, refreshNode = false) {
        await super.processJSON(json, false);
        for(let i = 0; i < Object.keys(json).length; i ++) {
            let key = Object.keys(json)[i];
            const option = json[key];
            if (key == "image") {
                this.images = [];
                //let savePixels = this.get("clip") || this.controls.clip.allowEdit;
                let thumbnail = option.thumbnail || {scale:1,x:0,y:0};
                if(Object.hasOwn(option, "variants")) {//Multiple variants, most objects will have this
                    option.variants.forEach(variant => {
                        let options = {source: variant};
                        options.thumbnail = thumbnail;
                        this.images.push(new LayeredImage(currentPack.URL, options));
                    });
                }
                if(Object.hasOwn(option, "variant")) {
                    let options = {source: option.variant};
                    options.thumbnail = thumbnail;
                    this.images.push(new LayeredImage(currentPack.URL, options));
                }
                // if(Object.hasOwn(options, "folder")) {
                //     let urls = await getDirectory(currentPack.URL+option.folder);
                //     console.log("LOADING IMAGE URLS FROM FOLDER: "+option.folder);
                //     urls.forEach(url => {
                //         let imageSettings = {
                //             variant: option.variant,
                //             savePixels: savePixels
                //         };
                //         this.images.push(new LayeredImage("", [url], option.thumbnail));
                //     })
                // }
            }
        }
        if(refreshNode) {
            this.refreshNode();
        }
    }
}

async function getDirectory(dirname) {
  let response = await fetch(dirname);
  let str = await response.text();
  let el = document.createElement('html');
  el.innerHTML = str;

  // this parse will work for http-server and may have to be modified for other
  // servers. Inspect the returned string to determine the proper parsing method
  let list = el.getElementsByTagName("ul")[0].getElementsByTagName("li");
  let arr = [];
  for (i = 0; i < list.length; i++) {
    arr[i] = list[i].getElementsByTagName("a")[0].href;
  }
  arr.shift(); // get rid of first result which is the "../" directory reference
  return(arr);
}

function pointInRect(rect, p) {//https://www.geeksforgeeks.org/dsa/check-whether-given-point-lies-inside-rectangle-not/
    const n = rect.length;
    let inside = false;
    let j = n - 1;
    for (let i = 0; i < n; i++) {
        if ((rect[i][1] > p[1]) != (rect[j][1] > p[1])) {
            if (p[0] < (rect[j][0] - rect[i][0]) * (p[1] - rect[i][1]) / (rect[j][1] - rect[i][1]) + rect[i][0]) {
                inside = !inside;
            }
        }
        j = i;
    }
    return inside;
}