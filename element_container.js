class ElementContainer {
    constructor() {

    }
    async init(json = {}, base = true, outermost = false) {
        this.name = "";
        this.base = base;
        this.outermost = outermost;
        this.children = [];
        this.addableChildren = [];
        this.collapsible = false;
        this.collapsed = false;
        this.optionSources = {};
        this.options = {
            transform: new TransformOption(this, "transform", "assets/move.png")
                .click(function(element, button) {
                    hideControls();
                    selectedElement = element;
                    cancelButton(button);
                    showMovementControls();
                }),
            horizontalFlip: new Option(this, "horizontalFlip", "assets/horizontal.png")
                .property("value", 1)
                .click(function(element, button) {
                    element.set("horizontalFlip", element.get("horizontalFlip") * -1);
                }),
            verticalFlip: new Option(this, "verticalFlip", "assets/vertical.png")
                .property("value", 1)
                .click(function(element, button) {
                    element.set("verticalFlip", element.get("verticalFlip") * -1);
                }),
            hide: new Option(this, "hide", "assets/shown.png")
                .property("value", false)
                .addIcon("value", true, "assets/hidden.png")
                .click(function(element, button) {
                    updateDraw = true;
                    element.set("hide", !element.get("hide"));
                    button.innerHTML = element.getOption("hide").getIcon();
                }),
            cloneable: new Option(this, "cloneable", "assets/clone.png")
                .click(function(element, button) {
                    updateDraw = true;
                    element.clone();
                }),
            removeable: new Option(this, "removeable", "assets/delete.png")
                .requireConfirmation()
                .click(function(element, button) {
                    element.removeSelf();
                    updateDraw = true;
                }),
            clip: new Option(this, "clip", "assets/mask.png")
                .property("value", false)
                .click(function(element, button) {
                    return function() {
                        element.toggleClip();
                        updateDraw = true;
                    }
                })
        };
        this.shouldCreateNode = !outermost;
        this.reorderable = false;
        await this.processJSON(json);
        if(this.name != "") {
            elementLookupTable[this.name] = this;
        }
    }
    canHaveChildren() {
        return true;
    }
    canMoveUp() {
        return this.parent.children.indexOf(this) > 0;
    }
    canMoveDown() {
        return this.parent.children.indexOf(this) < this.parent.children.length - 1;
    }
    isHidden() {
        return this.get("hide");
    }
    isPointInBoundingBox(point) {
        for(child of this.children) {
            if(child.isPointInBoundingBox(point)) {
                return true;
            }
        }
        return false;
    }
    get(option, property=undefined) {
        return this.options[option].getValue(property);
    }
    getOption(option) {
        return this.options[option];
    }
    async getClone(options) {
        let e = new this.constructor();
        await e.init(options);
        for(let i = 0; i < this.children.length; i ++) {
            e.addChild(await this.children[i].getClone(this.children[i].exportOptions()));
        }
        e.base = false;
        addedElements.push(e);
        return e;
    }
    // getElementBefore(child) {
    //     for(let i = this.children.indexOf(child)-1; i > 0; i --) {
    //         if(this.children[i] instanceof Element) {
    //             return this.children[i];
    //         }
    //     }
    //     if(this.parent == undefined) {
    //         return undefined;
    //     }
    //     return this.parent.getElementBefore(this);
    // }
    // getElementAfter(child) {
    //     for(let i = this.children.indexOf(child)+1; i < this.children.length; i ++) {
    //         if(this.children[i] instanceof Element) {
    //             return this.children[i];
    //         }
    //     }
    //     if(this.parent == undefined) {
    //         return undefined;
    //     }
    //     return this.parent.getElementAfter(this);
    // }
    // getFirstElementParent() {
    //     if(this.parent == undefined) {
    //         return undefined;
    //     }
    //     if(this.parent instanceof Element) {
    //         return this.parent;
    //     }
    //     return this.parent.getFirstElementParent();
    // }
    getGlobalOrigin() {
        return this.get("transform", "origin");
    }
    getMatrix() {
        if(this.parent == undefined) {
            return this.applyTransforms(new DOMMatrix());
        } else {
            return this.applyTransforms(this.parent.getMatrix());
        }
    }
    // getNextElement() {
    //     if(this.parent == undefined) {
    //         return undefined;
    //     }
    //     return this.parent.getElementAfter(this);
    // }
    getOptionAmount() {
        let num = 1;
        Object.keys(this.options).forEach(key => {
            if(this.options[key].allowEdit) {
                num ++;
            }
        });
        return num;
    }
    // getPreviousElement() {
    //     if(this.parent == undefined) {
    //         return undefined;
    //     }
    //     return this.parent.getElementBefore(this);
    // }
    needsNewBuffer() {
        return this.children.some(child => {
            if (child instanceof Element) {
                return child.needsParentBufferSeparate();
            }
            return child.needsNewBuffer();
        });
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
    applyTransforms(buffer) {
        if(this.parent != undefined) {
            this.parent.applyTransforms(buffer);
        }
        let origin = this.get("transform", "origin");
        if(buffer instanceof DOMMatrix) {
            buffer.translateSelf(origin.x, origin.y);
            this.get("transform").apply(buffer);
            buffer.translateSelf(-origin.x, -origin.y);
            buffer.scaleSelf(this.get("horizontalFlip"), this.get("verticalFlip"));
        } else {
            buffer.translate(origin.x, origin.y);
            this.get("transform").apply(buffer);
            buffer.translate(-origin.x, -origin.y);
            buffer.scale(this.get("horizontalFlip"), this.get("verticalFlip"));
        }
    }
    async clone() {
        const options = this.exportOptions();
        options.removeable = true;
        if(this.name != "") {
            options.name = this.name;
        }
        this.parent.addChildAfter(this, await this.getClone(options));
        this.parent.refreshChildrenNode();
    }
    async cloneTo(parentElementContainer) {
        const options = this.exportOptions();
        options.removeable = true;
        if(this.name != "") {
            options.name = this.name;
        }
        let clone = await this.getClone(options);
        parentElementContainer.addChild(clone);
        parentElementContainer.refreshChildrenNode();
        return clone;
    }
    createChildrenNode() {
        const div = document.createElement("div");
        div.classList.add("element_children");
        if(this.collapsible) {
            div.classList.add("inset_element");
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
        mainButton.innerHTML = `<h2>${this.name}</h2>`;
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
                case 4: case 5: element.classList.add("quad"); break;
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
            collapseButton.innerHTML = `<img class='tiny_icon ${this.collapsed ? "prev" : "next"}'>`;
            collapseButton.onclick = function() {
                if(thisInstance.toggleCollapse()) {
                    this.innerHTML = `<img class='tiny_icon prev'>`;
                } else {
                    this.innerHTML = `<img class='tiny_icon next'>`;
                }
            };
            element.appendChild(collapseButton);
        }
        const mainDiv = document.createElement("div");
        mainDiv.classList.add("options");
        if(!this.outermost) {
            mainDiv.appendChild(this.createMainButton());
        }
        Object.keys(this.options).forEach(key => {
            const option = this.options[key];
            if(option.allowEdit) {
                const button = document.createElement("button");
                button.classList.add("extrude");
                button.getStyle = option.getStyle;
                button.style = option.getStyle(this);
                button.innerHTML = option.getIcon();
                button.defaultInnerHTML = option.getIcon();
                button.onclick = option.getOnclick(thisInstance, button);
                button.defaultOnclick = option.getOnclick(thisInstance, button);
                mainDiv.appendChild(button);
            }
        });
        if(this.parent != undefined && this.parent.reorderable) {
            const sideDiv = document.createElement("div");
            sideDiv.classList.add("side");
            const button1 = document.createElement("button");
            button1.classList.add("extrude");
            button1.innerHTML = `<img class='tiny_icon prev'>`;
            button1.onclick = function() {
                thisInstance.moveUp();
                updateDraw = true;
            }
            button1.disabled = !thisInstance.canMoveUp();
            sideDiv.appendChild(button1);
            const button2 = document.createElement("button");
            button2.classList.add("extrude");
            button2.innerHTML = `<img class='tiny_icon next'>`;
            button2.onclick = function() {
                thisInstance.moveDown();
                updateDraw = true;
            }
            button2.disabled = !thisInstance.canMoveDown();
            sideDiv.appendChild(button2);
            element.appendChild(sideDiv);
        }
        element.appendChild(mainDiv);
        return element;
    }
    render(buffers) {
        if(!this.isHidden()) {
            if(this.needsNewBuffer()) {
                this.applyTransforms(buffers.push());
                this.draw(buffers.getCurrent());
                buffers.getCurrent().resetMatrix();
                this.children.forEach(child => {
                    child.render(buffers);
                });
                if(this.get("clip", "clipping")) {
                    buffers.pop(Buffers.clip(Buffers.normalBlend));
                } else {
                    buffers.pop();
                }
                this.applyTransforms(buffers.getCurrent());
                this.drawAfter(buffers.getCurrent());
                buffers.getCurrent().resetMatrix();
            } else {
                this.applyTransforms(buffers.getCurrent());
                this.draw(buffers.getCurrent());
                buffers.getCurrent().resetMatrix();
                this.children.forEach(child => {
                    child.render(buffers);
                });
                this.applyTransforms(buffers.getCurrent());
                this.drawAfter(buffers.getCurrent());
                buffers.getCurrent().resetMatrix();
            }
        }
    }
    replaceOptionReference(name, newReference) {
        this.options[name] = newReference;
    }
    draw(buffer) {}
    drawAfter(buffer) {}
    drawBoundingBox(buffer) {
        this.children.forEach(child => {
            child.drawBoundingBox(buffer);
        });
    }
    exportJSON() {
        const json = {
            "name": this.name
        };
        if(!this.base) {
            json.parentName = this.parent.name;
        }
        Object.keys(this.options).forEach(key => {
            if(!this.options[key].isDefault()) {
                let j = this.options[key].getJSON();
                if(j != undefined) {
                    json[key] = j;
                }
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
        let transformJSON = this.get("transform").getJSON();
        if(Object.keys(transformJSON).length != 0) {//Don't save it if it's just default.
            options.transform = transformJSON;
        }
        Object.keys(this.options).forEach(key => {
            if(this.options[key].allowEdit) {
                let j = this.options[key].getJSON(true);
                if(j != undefined) {
                    options[key] = j;
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
        return pos+1 < this.parent.children.length - 1;
    }
    preload(p) {
        this.children.forEach(child => {
            child.preload(p);
        });
        this.addableChildren.forEach(child => {
            child.preload(p);
        });
    }
    async processJSON(json, refreshNode = false) {
        for(let i = 0; i < Object.keys(json).length; i ++) {
            let key = Object.keys(json)[i];
            if (key == "children") {
                for(let j = 0; j < json.children.length; j ++) {
                    let child = json.children[j];
                    let newChild;
                    if(child.hasOwnProperty("image")) {
                        newChild = new Element();
                    } else {
                        newChild = new ElementContainer();
                    }
                    await newChild.init(child);
                    this.addChild(newChild);
                }
            } else if (key == "addableChildren") {
                for(let j = 0; j < json.addableChildren.length; j ++) {
                    let child = json.addableChildren[j];
                    let newChild;
                    if(child.hasOwnProperty("image")) {
                        newChild = new Element();
                    } else {
                        newChild = new ElementContainer();
                    }
                    await newChild.init(child, false);
                    this.addableChildren.push(newChild);
                }
            } else if (Object.hasOwn(this.options, key)) {
                this.options[key].applyJSON(json[key]);
            } else if (this.hasOwnProperty(key)) {
                this[key] = json[key];
            }
        }
        this.saveOptions();
        if(refreshNode) {
            this.refreshNode();
        }
    }
    // recalculateParentMask() {
    //     let parent = this.getFirstElementParent();
    //     if(parent != undefined) {
    //         this.applyTransforms(maskBuffer);
    //         parent.calculateMask(maskBuffer);
    //         p.resetMatrix();
    //     }
    // }
    refreshDisplay() {
        this.getOption("transform").revert();
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
            if(!element.base) {
                addedElements.splice(addedElements.indexOf(element), 1);
            }
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
    removeSelf() {
        if(this.parent != undefined) {
            this.parent.removeChild(this);
        } else {
            console.error("Tried to remove parentless element "+this.name);
        }
    }
    saveDisplayTransform() {
        this.getOption("transform").save();
    }
    saveOptions() {
        Object.keys(this.options).forEach(key => {
            this.options[key].save();
        });
    }
    set(option, op1, op2) {
        if(op2 == undefined) {
            this.options[option].setValue("value", op1);
        } else {
            this.options[option].setValue(op1, op2);
        }
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
}