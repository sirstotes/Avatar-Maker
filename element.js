class Element extends ElementContainer {
    constructor() {
        super();
    }
    async init(json = {}, base = true) {
        await super.init({}, base);
        this.controls.colors = {
            allowEdit: false,
            displayTint: "white",
            savedTint: "white",
            customColorsAllowed: true,
            palette: undefined,
            exportDeepCopies: false,
            exportOptions: ["displayTint", "savedTint", "customColorsAllowed", "palette"],
            defaultKeys: ["displayTint", "savedTint"],
            name: "Recolor",
            icon: "<img class='icon' src='assets/color-picker.png'>",
            getOnclick: function(element) {
                return function() {
                    hideControls();
                    selectedElement = element;
                    cancelButton(this);
                    showColorPalette();
                };
            },
            getJSON: function(element) {
                if(element.getDisplayColor() != "white") {
                    let json = {"key":"colors","value":{}};
                    json.value.default = element.getDisplayColor();
                    return json;
                }
                return undefined;
                // if(element.hasColorPalette()) { //Not sure if I wanna save color palettes?
                //     json.value.palette = element.getColorPalette();
                // }
            },
            getStyle: function(element) {
                if(element.getDisplayColor() != "white") {
                    return `background-color:${element.getDisplayColor()};`;
                }
                return "";
            }
        };
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
    getClipFunction() {
        if(!this.isHidden()) {
            let parentClip = this.parent.getClipFunction();
            let thisInstance = this;
            return function() {
                thisInstance.applyTransforms(p);
                if(thisInstance.images.length > 0) {
                    thisInstance.getCurrentImage().draw(p, new ImageSettings(undefined, parentClip));
                }
                p.resetMatrix();
            }
        }
        return undefined;
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
    hasColorPalette() {
        return this.controls.colors.palette != undefined;
    }
    addColorToPalette(color) {
        if(!this.getColorPalette().includes(color)) {
            this.setColorPalette([...this.getColorPalette(), color]);
        }
    }
    calculateMasks() {
        
    }
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
    draw(p) {
        if(!this.isHidden()) {
            this.applyTransforms(p);
            if(this.images.length > 0) {
                this.getCurrentImage().draw(p, new ImageSettings(this.getDisplayColor(), this.getClipFunction()));
            }
            p.resetMatrix();
            super.draw(p);
        }
    }
    drawBoundingBox(p) {
        this.applyTransforms(p);
        p.noFill();
        p.drawingContext.setLineDash([5 + p.sin(p.frameCount/10)*2, 10 - p.sin(p.frameCount/10)*2])
        p.strokeWeight(3);
        p.stroke(0);
        p.rect(0, 0, this.getCurrentImage().getWidth(), this.getCurrentImage().getHeight());
        p.rect(0, 0, this.getCurrentImage().getWidth()+20, this.getCurrentImage().getHeight()+20);
        p.resetMatrix();
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
    setup(p) {
        if(this.controls.colors.hasOwnProperty("copy")) {
            if(elementLookupTable.hasOwnProperty(this.controls.colors.copy)) {
                this.controls.colors = elementLookupTable[this.controls.colors.copy].controls.colors;
            }
        }
        console.log("LOADING IMAGES FOR: "+this.name);
        this.images.forEach(image => {
            image.load(p);
        });
        super.setup(p);
    }
    setColorPalette(palette) {
        this.controls.colors.palette = palette;
    }
    setDisplayColor(color) {
        this.controls.colors.displayTint = color;
    }
    async processJSON(json, refreshNode = false) {
        await super.processJSON(json, false);
        for(let i = 0; i < Object.keys(json).length; i ++) {
            let key = Object.keys(json)[i];
            const option = json[key];
            if (key == "image") {
                this.images = [];
                if(option.hasOwnProperty("variants")) {
                    option.variants.forEach(variant => {
                        this.images.push(new LayeredImage(packURL, variant, option.thumbnail));
                    });
                } else if(option.hasOwnProperty("variant")) {
                    this.images.push(new LayeredImage(packURL, option.variant, option.thumbnail));
                }
                if(option.hasOwnProperty("folder")) {
                    let urls = await getDirectory(packURL+option.folder);
                    console.log("LOADING IMAGE URLS FROM FOLDER: "+option.folder);
                    urls.forEach(url => {
                        this.images.push(new LayeredImage("", [url], option.thumbnail));
                    })
                }
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