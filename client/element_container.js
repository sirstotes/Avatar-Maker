class ElementContainer {
    constructor(json = {}, base = true, outermost = false) {
        this.name = "";
        this.base = base;
        this.outermost = outermost;
        this.children = [];
        this.addableChildren = [];
        this.displayTransform = new ConstrainedTransform(vec(0, 0));
        this.savedTransform = new ConstrainedTransform();
        this.incrementTransform = new Transform(vec(1, 1), vec(0.01, 0.01), 1);
        this.collapsible = false;
        this.collapsed = false;
        this.shouldCreateNode = true;
        this.reorderable = false;
        this.controls = {
            moveable: {
                allowEdit: false,
                translation: true,
                rotation: true,
                scale: true,
                name: "Move",
                icon: "<img class='icon' src='assets/move.png'>",
                getOnclick: function(element) {
                    return function() {
                        hideControls();
                        selectedElement = element;
                        cancelButton(this);
                        showMovementControls();
                    }
                }
            },
            horizontalFlip: {
                allowEdit: false,
                flip: 1,
                name: "Flip",
                icon: "<img class='icon' src='assets/horizontal.png'>",
                getOnclick: function(element) {
                    return function() {
                        element.controls.horizontalFlip.flip *= -1;
                    }
                }
            },
            verticalFlip: {
                allowEdit: false,
                flip: 1,
                name: "Flip",
                icon: "<img class='icon' src='assets/vertical.png'>",
                getOnclick: function(element) {
                    return function() {
                        element.controls.verticalFlip.flip *= -1;
                    }
                }
            },
            clip: {
                allowEdit: false,
                clipping: false,
                exportDeepCopies: false,
                exportOptions: ["clipping"],
                name: "Clip",
                icon: "<img class='icon' src='assets/shown.png'>",
                getOnclick: function(element) {
                    return function() {
                        element.toggleHidden();
                        this.innerHTML = element.getIconForOption("display");
                    }
                }
            },
            hideable: {
                allowEdit: false,
                hidden: false,
                exportDeepCopies: false,
                exportOptions: ["hidden"],
                name: "Hide",
                icon: "<img class='icon' src='assets/shown.png'>",
                icon2: "<img class='icon' src='assets/hidden.png'>",
                getOnclick: function(element) {
                    return function() {
                        element.toggleHidden();
                        this.innerHTML = element.getIconForOption("hideable");
                    }
                }
            },
            cloneable: {
                allowEdit: false,
                name: "Clone",
                icon: "<img class='icon' src='assets/clone.png'>",
                getOnclick: function(element) {
                    return function() {
                        element.clone();
                    }
                }
            },
            removeable: {
                allowEdit: false,
                name: "Remove",
                icon: "<img class='icon' src='assets/delete.png'>",
                getOnclick: function(element) {
                    return function() {
                        this.style = "background-color:red;";
                        this.innerHTML = "<img class='icon' src='assets/check.png' style='filter:invert(1);'>";
                        this.onclick = function() {
                            element.parent.removeChild(element);
                        }
                        if(trashedButton != undefined) {
                            refreshTrashedButton();
                        }
                        trashedButton = this;
                    }
                }
            }
        };

        this.processJSON(json);
        if(this.name != "") {
            elementLookupTable[this.name] = this;
        }
    }
    canHaveChildren() {
        return true;
    }
    isHidden() {
        return this.controls.hideable.hidden;
    }
    getClone(options) {
        let e = new this.constructor(options);
        this.children.forEach(child => {
            e.addChild(child.getClone(child.exportOptions()));
        });
        e.base = false;
        addedElements.push(e);
        return e;
    }
    getIconForOption(option) {
        if(option == "hideable" && this.isHidden()) {
            return this.controls[option].icon2;
        }
        return this.controls[option].icon;
    }
    getGlobalTranslation() {
        let translation = vec(0, 0);
        if(this.parent != undefined) {
            translation = this.parent.getGlobalTranslation();
        }
        translation.x += this.displayTransform.translation.x;
        translation.y += this.displayTransform.translation.y;
        return translation;
    }
    getGlobalScale() {
        let scale = vec(1, 1);
        if(this.parent != undefined) {
            scale = this.parent.getGlobalTranslation();
        }
        scale.x *= this.displayTransform.scale.x * this.controls.horizontalFlip.flip;
        scale.y *= this.displayTransform.scale.y * this.controls.verticalFlip.flip;
        return scale;
    }
    getOptionAmount() {
        let num = 1;
        Object.keys(this.controls).forEach(key => {
            if(this.controls[key].allowEdit) {
                num ++;
            }
        });
        return num;
    }
    addChild(element) {
        this.children.push(element);
        element.parent = this;
    }
    addChildAfter(existingElement, newElement) {
        this.children.splice(this.children.indexOf(existingElement)+1, 0, newElement);
        newElement.parent = this;
    }
    addNodesTo(node) {
        if(this.shouldCreateNode) {
            this.node = this.createNode();
            node.appendChild(this.node);
        }
        if(this.canHaveChildren()) {
            this.childrenNode = this.createChildrenNode();
            node.appendChild(this.childrenNode);
        }
    }
    applyTransforms(p) {
        if(this.parent != undefined) {
            this.parent.applyTransforms(p);
        }
        this.displayTransform.apply(p);
        p.scale(this.controls.horizontalFlip.flip, this.controls.verticalFlip.flip);
    }
    clone() {
        const options = this.exportOptions();
        options.removeable = true;
        if(this.name != "") {
            options.name = this.name;
        }
        this.parent.addChildAfter(this, this.getClone(options));
        this.parent.refreshChildrenNode();
    }
    cloneTo(parentElementContainer) {
        const options = this.exportOptions();
        options.removeable = true;
        if(this.name != "") {
            options.name = this.name;
        }
        parentElementContainer.addChild(this.getClone(options));
        parentElementContainer.refreshChildrenNode();
    }
    createChildrenNode() {
        const div = document.createElement("div");
        div.classList.add("element_children");
        if(!this.outermost) {
            div.classList.add("element_outline");
        }
        this.children.forEach(child => {
            child.addNodesTo(div);
        });
        if(this.addableChildren.length > 0) {
            this.addChildButton = document.createElement("button");
            this.addChildButton.classList.add("add_element", "extrude");
            this.addChildButton.innerHTML = '<img class="icon" src="assets/plus.png">';
            let thisInstance = this;
            this.addChildButton.onclick = function() {
                showElementSelectPopup(thisInstance);
            }
            div.appendChild(this.addChildButton);
        }
        div.style = this.collapsed ? "display:none;" : "";
        return div;
    }
    createMainButton() {
        const mainButton = document.createElement("button");
        mainButton.classList.add("image");
        mainButton.innerHTML = `<h3>${this.name}</h3>`;
        return mainButton;
    }
    createNode() {
        const thisInstance = this;
        const element = document.createElement("div");
        element.classList.add("element");
        if(this.outermost) {
            element.classList.add("flex");
        } else {
            switch(this.getOptionAmount()) {
                case 1: element.classList.add("singular"); break;
                case 2: element.classList.add("dual"); break;
                case 3: element.classList.add("tri"); break;
                case 4: case 5: break;
                case 6: case 7: element.classList.add("sept"); break;
                default: element.classList.add("multi"); break;
            }
        }
        // if(this.name != "") {
        //     const span = document.createElement("span");
        //     span.innerText = this.name;
        //     element.appendChild(span);
        // }
        if(this.collapsible) {
            const collapseButton = document.createElement("button");
            collapseButton.classList.add("extrude");
            collapseButton.innerHTML = this.collapsed ? "<img class='tiny_icon' src='assets/down.png'>" : "<img class='tiny_icon' src='assets/up.png'>";
            collapseButton.onclick = function() {
                if(thisInstance.toggleCollapse()) {
                    this.innerHTML = "<img class='tiny_icon' src='assets/down.png'>";
                } else {
                    this.innerHTML = "<img class='tiny_icon' src='assets/up.png'>";
                }
            };
            element.appendChild(collapseButton);
        }
        const mainDiv = document.createElement("div");
        mainDiv.classList.add("options");
        if(!this.outermost) {
            mainDiv.appendChild(this.createMainButton());
        }
        Object.keys(this.controls).forEach(key => {
            const option = this.controls[key];
            if(option.allowEdit) {
                const button = document.createElement("button");
                button.classList.add("extrude");
                button.innerHTML = this.getIconForOption(key);
                button.defaultInnerHTML = option.icon;
                if(option.getOnclick != undefined) {
                    button.onclick = option.getOnclick(this);
                    button.defaultOnclick = option.getOnclick(this);
                }
                mainDiv.appendChild(button);
            }
        });
        if(this.parent != undefined && this.parent.reorderable) {
            const sideDiv = document.createElement("div");
            sideDiv.classList.add("side");
            const button1 = document.createElement("button");
            button1.classList.add("extrude");
            button1.innerHTML = "<img class='icon' src='assets/up.png'>";
            button1.onclick = function() {
                thisInstance.moveUp();
            }
            sideDiv.appendChild(button1);
            const button2 = document.createElement("button");
            button2.classList.add("extrude");
            button2.innerHTML = "<img class='icon' src='assets/down.png'>";
            button2.onclick = function() {
                thisInstance.moveDown();
            }
            sideDiv.appendChild(button2);
            element.appendChild(sideDiv);
        }
        element.appendChild(mainDiv);
        return element;
    }
    draw(p) {
        if(!this.isHidden()) {
            for(let i = 0; i < this.children.length; i ++) {
                this.children[i].draw(p);
            }
        }
    }
    drawBoundingBox(p) {
        this.children.forEach(child => {
            child.drawBoundingBox(p);
        });
    }
    exportJSON() {
        const json = {
            "name": this.name,
            "transform": this.savedTransform.getJSON(),
            "hidden": this.isHidden()
        };
        if(!this.base) {
            json.parentName = this.parent.name;
        }
        Object.keys(this.controls).forEach(key => {
            if(this.controls[key].hasOwnProperty("getJSON")) {
                let j = this.controls[key].getJSON(this);
                json[j.key] = j.value;
            }
        });
        return json;
    }
    exportOptions() {
        const options = {
            name: this.name,
            thumbnail: this.thumbnail,
            images: this.images,
            selectedImage: this.selectedImage,
            collapsible: this.collapsible,
            collapsed: this.collapsed
        };
        Object.keys(this.controls).forEach(key => {
            const option = this.controls[key];

            options[key] = {allowEdit:option.allowEdit};
            if(option.hasOwnProperty("exportOptions")) {
                for(let i = 0; i < option.exportOptions.length; i ++) {
                    if(option.exportDeepCopies == true) {
                        if(option[option.exportOptions[i]] instanceof ConstrainedTransform) {
                            options[key][option.exportOptions[i]] = option[option.exportOptions[i]].getCopy();
                        } else {
                            let copy = JSON.parse(JSON.stringify(option[option.exportOptions[i]]));
                            copy.prototype = option[option.exportOptions[i]].prototype;
                            options[key][option.exportOptions[i]] = copy;
                        }
                    } else {
                        options[key][option.exportOptions[i]] = option[option.exportOptions[i]];
                    }
                }
            }
        });
        return options;
    }
    moveUp() {
        let pos = this.parent.children.indexOf(this);
        if (pos > 0) {
            this.parent.children.splice(pos, 1);
            this.parent.children.splice(pos-1, 0, this);
            this.parent.refreshChildrenNode();
            if(!this.base) {
                pos = addedElements.indexOf(this);
                if(pos > 0) {
                    addedElements.splice(pos, 1);
                    addedElements.splice(pos-1, 0, this);
                }
            }
        }
    }
    moveDown() {
        let pos = this.parent.children.indexOf(this);
        if (pos < this.parent.children.length - 1) {
            this.parent.children.splice(pos, 1);
            this.parent.children.splice(pos+1, 0, this);
            this.parent.refreshChildrenNode();
            if(!this.base) {
                pos = addedElements.indexOf(this);
                if(pos < addedElements.length - 1) {
                    addedElements.splice(pos, 1);
                    addedElements.splice(pos+1, 0, this);
                }
            }
        }
    }
    preload() {
        this.children.forEach(child => {
            child.preload();
        });
    }
    processJSON(json, refreshNode = false) {
        Object.keys(json).forEach(key => {
            if (key == "transform") {
                let transformationTypes = ["translation", "rotation", "scale"];
                transformationTypes.forEach(transformationType => {
                    if(json[key].hasOwnProperty(transformationType)) {
                        if(json[key][transformationType].hasOwnProperty("x") || json[key][transformationType].hasOwnProperty("r")) {
                            this.savedTransform[transformationType] = json[key][transformationType];
                        } else {
                            if(json[key][transformationType].hasOwnProperty("default")) {
                                this.savedTransform[transformationType] = json[key][transformationType].default;
                            }
                            if(json[key][transformationType].hasOwnProperty("min")) {
                                this.savedTransform[transformationType+"Min"] = json[key][transformationType].min;
                            }
                            if(json[key][transformationType].hasOwnProperty("max")) {
                                this.savedTransform[transformationType+"Max"] = json[key][transformationType].max;
                            }
                            if(json[key][transformationType].hasOwnProperty("increment")) {
                                this.incrementTransform[transformationType] = json[key][transformationType].increment;
                            }
                        }
                    }
                });
                this.displayTransform = this.savedTransform.getCopy();
            } if (key == "children") {
                json.children.forEach(child => {
                    let newChild;
                    if(child.hasOwnProperty("image")) {
                        newChild = new Element(child);
                    } else {
                        newChild = new ElementContainer(child);
                    }
                    this.addChild(newChild);
                });
            } else if (key == "addableChildren") {
                json.addableChildren.forEach(child => {
                    let newChild;
                    if(child.hasOwnProperty("image")) {
                        newChild = new Element(child, false);
                    } else {
                        newChild = new ElementContainer(child, false);
                    }
                    this.addableChildren.push(newChild);
                });
            } else if (this.controls.hasOwnProperty(key)) {
                if(typeof json[key] === "boolean") {
                    this.controls[key].allowEdit = json[key];
                } else if(json[key] instanceof Object) {
                    if(!json[key].hasOwnProperty("allowEdit")) {
                        this.controls[key].allowEdit = true;
                    }
                    Object.keys(json[key]).forEach(key2 => {
                        if(key2 == "default" && this.controls[key].hasOwnProperty("defaultKeys")) {
                            this.controls[key].defaultKeys.forEach(defaultKey => {
                                this.controls[key][defaultKey] = json[key][key2];;
                            });
                        } else {
                            this.controls[key][key2] = json[key][key2];
                        }
                    });
                }
            } else if (this.hasOwnProperty(key)) {
                this[key] = json[key];
            }
        });
        if(refreshNode) {
            this.refreshNode();
        }
    }
    refreshDisplay() {
        this.displayTransform = this.savedTransform.getCopy();
    }
    refreshChildrenNode() {
        const node = this.createChildrenNode();
        if(this.childrenNode != undefined) {
            this.childrenNode.replaceWith(node);
        }
        this.childrenNode = node;
    }
    refreshNode() {
        if(this.shouldCreateNode) {
            const node = this.createNode();
            if(this.node != undefined) {
                this.node.replaceWith(node);
            }
            this.node = node;
        }
    }
    removeChild(element) {
        if(this.children.includes(element)) {
            this.children.splice(this.children.indexOf(element), 1);
            if(element.node != undefined) {
                this.childrenNode.removeChild(element.node);
            }
            if(element.childrenNode != undefined) {
                this.childrenNode.removeChild(element.childrenNode);
            }
        } else {
            console.error("Tried to remove a child ("+element.name+") that does not belong to this element ("+this.name+")");
        }
    }
    saveDisplayTransform() {
        this.savedTransform = this.displayTransform.getCopy();
    }
    setup(p) {
        this.children.forEach(child => {
            child.setup(p);
        });
        this.addableChildren.forEach(child => {
            child.setup(p);
        });
    }
    toggleCollapse() {
        this.collapsed = !this.collapsed;
        if(this.childrenNode != undefined) {
            this.childrenNode.style = this.collapsed ? "display:none;" : "";
        }
        return this.collapsed;
    }
    toggleHidden() {
        this.controls.hideable.hidden = !this.controls.hideable.hidden;
    }
}