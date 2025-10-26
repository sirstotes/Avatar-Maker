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
        this.afterImages = [];
        this.selectedImage = 0;
        this.childrenNode = undefined;
        await this.processJSON(json);
        console.log("INITIALIZING ELEMENT: "+(this.name||"unnamed"));
        if(this.name != "") {
            elementLookupTable[this.name] = this;
        }

        if(this.hasColorPalette() && this.getColorPalette().hasOwnProperty("copy")) {
            if(elementLookupTable.hasOwnProperty(this.getColorPalette().copy)) {
                this.setColorPalette(elementLookupTable[this.getColorPalette().copy].getColorPalette());
            }
        }
    }
    canHaveChildren() {
        return this.children.length > 0 || this.canAddChildren;
    }
    getBoundingBox() {
        let translation = this.getGlobalTranslation();
        let scale = this.getGlobalScale();
        let w = this.getCurrentImage().getWidth() * scale.x;
        let h = this.getCurrentImage().getHeight() * scale.y;
        let x = translation.x;
        let y = translation.y;
        x -= w*0.5;
        y -= h*0.5;
        return {
            x: x,
            y: y,
            w: w,
            h: h
        };
    }
    getColorPalette() {
        if(this.controls.colors.palette == undefined) {
            return pack.defaultPalette;
        }
        return this.controls.colors.palette;
    }
    getCurrentImage() {
        return this.images[this.getImageNumber()];
    }
    getDisplayColor() {
        if(this.controls.colors.displayTint == "random") {
            this.setDisplayColor(this.getColorPalette()[Math.floor(Math.random() * this.getColorPalette().length)]);
            this.saveDisplayColor();
        }
        if(this.controls.colors.displayTint instanceof Object) {
            if(this.controls.colors.displayTint.hasOwnProperty("copy") && elementLookupTable.hasOwnProperty(this.controls.colors.displayTint.copy)) {
                this.setDisplayColor(elementLookupTable[this.controls.colors.displayTint.copy].getDisplayColor());
            } else {
                this.setDisplayColor("white");
            }
            this.saveDisplayColor();
        }
        return this.controls.colors.displayTint;
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
        return this.controls.clip.clipping || super.needsNewBuffer();
    }
    needsParentBufferSeparate() {
        return this.controls.clip.clipping;
    }
    hasColorPalette() {
        return this.controls.colors.palette != undefined;
    }
    addColorToPalette(color) {
        if(!this.getColorPalette().includes(color)) {
            this.setColorPalette([...this.getColorPalette(), color]);
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
            mainButton.innerHTML = "<img src='"+packURL+this.thumbnail+"'>";
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
            //console.log(`DRAWING ${this.name} ON ${buffer.name}`);
            this.getCurrentImage().draw(buffer, new ImageSettings().tint(this.getDisplayColor()));
        }
    }
    drawBoundingBox(buffer) {
        this.applyTransforms(buffer);
        buffer.noFill();
        buffer.drawingContext.setLineDash([5 + Math.sin(buffer.frameCount/10)*2, 10 - Math.sin(buffer.frameCount/10)*2])
        buffer.strokeWeight(3);
        buffer.stroke(0);
        buffer.rect(0, 0, this.getCurrentImage().getWidth(), this.getCurrentImage().getHeight());
        buffer.rect(0, 0, this.getCurrentImage().getWidth()+20, this.getCurrentImage().getHeight()+20);
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
        this.setDisplayColor(this.controls.colors.savedTint);
    }
    saveDisplayColor() {
        this.controls.colors.savedTint = this.controls.colors.displayTint;
    }
    selectImage(layeredImage) {
        if(this.images.includes(layeredImage)) {
            this.selectedImage = this.images.indexOf(layeredImage);
        }
    }
    preload(p5) {
        this.images.forEach(image => image.preload(p5));
        super.preload(p5);
    }
    setup(p5) {
        if(this.controls.colors.hasOwnProperty("copy")) {
            if(elementLookupTable.hasOwnProperty(this.controls.colors.copy)) {
                this.controls.colors = elementLookupTable[this.controls.colors.copy].controls.colors;
            }
        }
        this.images.forEach(image => image.setup(p5));
        //this.calculateMask(buffer);
        console.log("LOADING IMAGES FOR: "+this.name);
        super.setup(p5);
    }
    setColorPalette(palette) {
        this.controls.colors.palette = palette;
    }
    setDisplayColor(color) {
        this.controls.colors.displayTint = color;
    }
    toggleClip() {
        this.controls.clip.clipping = !this.controls.clip.clipping;
    }
    async processJSON(json, refreshNode = false) {
        await super.processJSON(json, false);
        for(let i = 0; i < Object.keys(json).length; i ++) {
            let key = Object.keys(json)[i];
            const option = json[key];
            if (key == "image") {
                this.images = [];
                //let savePixels = this.controls.clip.clipping || this.controls.clip.allowEdit;
                let thumbnail = option.thumbnail || {scale:1,x:0,y:0};
                if(Object.hasOwn(option, "variants")) {//Multiple variants, most objects will have this
                    option.variants.forEach(variant => {
                        let options = {source: variant};
                        options.thumbnail = thumbnail;
                        this.images.push(new LayeredImage(packURL, options));
                    });
                }
                if(Object.hasOwn(option, "variant")) {
                    let options = {source: option.variant};
                    options.thumbnail = thumbnail;
                    this.images.push(new LayeredImage(packURL, options));
                }
                // if(Object.hasOwn(options, "folder")) {
                //     let urls = await getDirectory(packURL+option.folder);
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