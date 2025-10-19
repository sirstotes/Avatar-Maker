class Element extends ElementContainer {
    constructor(json = {}, base = true) {
        super({}, base);
        this.controls.colors = {
            allowEdit: false,
            displayTint: "white",
            savedTint: "white",
            customColorsAllowed: true,
            palette: ["white"],
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
                return {
                    "key":"colors",
                    "value": {
                        "default": element.controls.colors.displayTint
                    }
                }
            }
        };
        this.parent = undefined;
        this.name = "";
        this.thumbnail = undefined;
        this.images = [];
        this.selectedImage = 0;
        this.childrenNode = undefined;
        this.processJSON(json);
        if(this.name != "") {
            elementLookupTable[this.name] = this;
        }

        if(this.controls.colors.displayTint == "random") {
            this.setDisplayColor(this.controls.colors.palette[Math.floor(Math.random() * this.controls.colors.palette.length)]);
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
        if(this.controls.colors.palette.hasOwnProperty("copy")) {
            if(elementLookupTable.hasOwnProperty(this.controls.colors.palette.copy)) {
                this.controls.colors.palette = elementLookupTable[this.controls.colors.palette.copy].controls.colors.palette;
            } else {
                this.controls.colors.palette = ["white"];
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
    getColorOptions() {
        return this.controls.colors.palette;
    }
    getCurrentImage() {
        return this.images[this.getImageNumber()];
    }
    getDisplayColor() {
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
    addColorOption(color) {
        this.controls.colors.palette.push(color);
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
        console.log(this.selectedImage);
    }
    draw(p) {
        if(!this.isHidden()) {
            this.applyTransforms(p);
            this.getCurrentImage().draw(p, this.getDisplayColor());
            p.resetMatrix();
            super.draw(p);
        }
    }
    drawBoundingBox(p) {
        this.applyTransforms(p);
        p.noFill();
        p.drawingContext.setLineDash([5 + p.sin(p.frameCount/10)*2, 10 - p.sin(p.frameCount/10)*2])
        p.strokeWeight(3);
        p.stroke(255);
        p.rect(0, 0, this.getCurrentImage().getWidth(), this.getCurrentImage().getHeight());
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
        if(this.getColorOptions().includes(color)) {
            this.getColorOptions().splice(this.getColorOptions().indexOf(color), 1);
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
        this.images.forEach(image => {
            image.load(p);
        });
        super.setup(p);
    }
    setDisplayColor(color) {
        this.controls.colors.displayTint = color;
    }
    processJSON(json, refreshNode = false) {
        super.processJSON(json, refreshNode);
        Object.keys(json).forEach(key => {
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
            }
        });
        if(refreshNode) {
            this.refreshNode();
        }
    }
}