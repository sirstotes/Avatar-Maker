let selectedElement = undefined;
let toggledButton = undefined;
let trashedButton = undefined;
function cancelButton(button) {
    toggledButton = button;
    toggledButton.style = "background-color:red;";
    toggledButton.innerHTML = "<img class='icon' src='assets/cancel.png' style='filter:invert(1);'>";
    toggledButton.onclick = function() {
        hideControls();
        selectedElement = undefined;
    }
    selectedElement.refreshDisplay();
}
function refreshTrashedButton() {
    trashedButton.hidden = false;
    trashedButton.style = "";
    trashedButton.innerHTML = trashedButton.defaultInnerHTML;
    trashedButton.onclick = trashedButton.defaultOnclick;
    trashedButton = undefined;
}
function showColorPalette() {
    if(selectedElement != undefined) {
        const picker = document.getElementById("color_controls");
        picker.hidden = false;
        picker.getElementsByTagName("div")[0].innerHTML = "";
        selectedElement.getColorOptions().forEach(color => {
            const button = document.createElement("button");
            button.classList.add("color");
            if(color == selectedElement.getDisplayColor()) {
                button.classList.add("selected");
            }
            button.color = color;
            button.style = `background-color: ${color};`;
            //button.style = `background-color: rgb(${red(color)}, ${green(color)}, ${blue(color)})`;
            button.onclick = function() {
                selectedElement.setDisplayColor(button.color);
                refreshColorPalette();
            };
            picker.getElementsByTagName("div")[0].appendChild(button);
        });
        picker.getElementsByClassName("custom").forEach(node => {
            node.hidden = !selectedElement.options.color.customColorsAllowed;
        });
    }
}
function showColorPicker() {
    hideControls(false);
    document.getElementById("color_picker_input").value = selectedElement.getDisplayColor();
    document.getElementById("color_picker").hidden = false;
}
function refreshColorPalette() {
    const container = document.getElementById("color_controls").getElementsByTagName("div")[0];
    container.childNodes.forEach(button => {
        if(button.color == selectedElement.getDisplayColor() && button.color != undefined) {
            button.classList.add("selected");
        } else {
            button.classList.remove("selected");
        }
    });
}
function showMovementControls() {
    const controls = document.getElementById("movement_controls");
    controls.hidden = false;
}
function moveElement(x, y) {
    if(selectedElement != undefined) {
        selectedElement.getDisplayTransform().translate(x, y);
    }
}
function scaleElement(x, y) {
    if(selectedElement != undefined) {
        selectedElement.getDisplayTransform().scale(x, y);
    }
}
function rotateElement(r) {
    if(selectedElement != undefined) {
        selectedElement.getDisplayTransform().rotate(r);
    }
}
function refreshElementSelect() {
    const container = document.getElementById("selectable_elements");
    container.childNodes.forEach(node => {
        if(node.imageSrc == container.selectedImage) {
            node.classList.add("selected");
        } else {
            node.classList.remove("selected");
        }
    });
}
function showElementSelectPopup(element) {
    const container = document.getElementById("selectable_elements");
    container.innerHTML = "";
    container.selectedImage = element.getCurrentImage();
    element.images.forEach(image => {
        const button = document.createElement("button");
        button.classList.add("image");
        button.imageSrc = image;
        button.innerHTML = "<img src="+image+">";
        button.onclick = function() {
            container.selectedImage = image;
            refreshElementSelect();
        }
        container.appendChild(button);
    });
    refreshElementSelect();

    document.getElementById("popup").style = "";
    document.getElementById("element_select").hidden = false;
}
function tryReset(button) {
    button.style = "background-color:red;";
    button.defaultInnerHTML = button.innerHTML;
    button.defaultOnclick = button.onclick;
    button.innerHTML = "<img class='icon' src='assets/check.png' style='filter:invert(1);'>";
    button.onclick = function() {
        //RESET
    }
    if(trashedButton != undefined) {
        refreshTrashedButton();
    }
    trashedButton = button;
    // document.getElementById("popup").style = "";
    // document.getElementById("confirm_reset").hidden = false;
}
function updateSelectedColor(color) {
    if(selectedElement != undefined) {
        selectedElement.setDisplayColor(color);
    }
}
function hidePopups() {
    document.getElementById("popup").style = "display:none;";
    document.getElementById("element_select").hidden = true;
}
function hideControls(untoggle = true) {
    document.getElementById("color_controls").hidden = true;
    document.getElementById("color_picker").hidden = true;
    document.getElementById("movement_controls").hidden = true;

    if(toggledButton != undefined && untoggle) {
        toggledButton.style = "";
        toggledButton.innerHTML = toggledButton.defaultInnerHTML;
        toggledButton.onclick = toggledButton.defaultOnclick;
        toggledButton = undefined;
    }
}
function hideColorControls(save) {
    hideControls();
    if(save) {
        selectedElement.saveDisplayColor();
    }
    selectedElement = undefined;
}
function hideColorPicker(save) {
    hideControls(false);
    if(save) {
        const color = document.getElementById("color_picker_input").value;
        selectedElement.addColorOption(color);
        selectedElement.setDisplayColor(color);
    }
    showColorPalette();
}
function removeSelectedColor() {
    selectedElement.removeColorOption(selectedElement.getDisplayColor());

    const container = document.getElementById("color_controls").getElementsByTagName("div")[0];
    container.childNodes.forEach(button => {
        if(button.color == selectedElement.getDisplayColor()) {
            container.removeChild(button);
        }
    });
}
function vec(x, y) {
    return {x:x, y:y};
}
class ConstrainedTransformer {
    constructor(translation, scale, rotation) {
        this.translation = translation;
        this.scale = scale;
        this.rotation = rotation;
    }
    apply() {
        translate(this.translation.x, this.translation.y);
        rotate(this.rotation);
        scale(this.scale.x, this.scale.y);
    }
    translate(x, y) {
        this.translation.x += x;
        this.translation.y += y;
    }
    scale(x, y) {
        this.scale.x += x;
        this.scale.y += y;
    }
    rotate(r) {
        this.rotation += r;
    }
}
class LayeredImage {
    constructor(layers, layerOptions = undefined, thumbnailLayer = 0) {
        this.layers = layers;
        if(layerOptions instanceof Array) {
            this.layerOptions = layerOptions;
        } else {
            this.layerOptions = [];
            for(let i = 0; i < this.layers.length; i ++) {
                this.layerOptions.push({
                    tint:true
                });
            }
        }
        this.thumbnailLayer = thumbnailLayer;
        preload();
    }
    preload() {
        this.imgs = [];
        for(let i = 0; i < this.layers.length; i ++) {
            this.imgs.push(loadImage(this.layers[i]));
        }
    }
    draw(transformer, tintColor) {
        transformer.apply();
        for(let i = 0; i < this.imgs.length; i ++) {
            if(this.layerOptions[i].tint) {
                tint(tintColor);
            }
            image(this.imgs[i], 0, 0);
        }
        resetMatrix();
    }
    getWidth() {
        if(this.imgs[this.imgs.length-1] != undefined) {
            return this.imgs[this.imgs.length-1].width;
        }
        return 100;
    }
    getHeight() {
        if(this.imgs[this.imgs.length-1] != undefined) {
            return this.imgs[this.imgs.length-1].height;
        }
        return 100;
    }
}
class ElementContainer {
    constructor(canAddChildren = true, node = undefined) {
        this.name = "Container";
        this.children = [];
        if(node != undefined) {
            this.childrenNode = node;
        } else {
            this.childrenNode = document.getElementById("elements");
        }
        this.canAddChildren = canAddChildren;
        if(this.canAddChildren) {
            this.button = document.createElement("button");
            this.button.classList.add("add_element", "extrude");
            this.button.innerHTML = '<img class="icon" src="assets/plus.png">';
            this.childrenNode.appendChild(this.button);
        }
    }
    canHaveChildren() {
        return true;
    }
    addChild(element) {
        this.children.push(element);
        element.parent = this;
        if(this.canAddChildren) {
            this.childrenNode.insertBefore(element.node, this.button);
        } else {
            this.childrenNode.appendChild(element.node);
        }
    }
    preload() {
        this.children.forEach(child => {
            child.preload();
        });
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
    draw() {
        for(let i = 0; i < this.children.length; i ++) {
            this.children[i].draw();
        }
    }
}
class Element extends ElementContainer {
    constructor(options = {}) {
        super(false);
        this.name = "";
        this.thumbnail = "assets/category.png";
        this.images = [new LayeredImage(["assets/circle.png"]), new LayeredImage(["assets/square.png"])];
        this.currentImage = 0;
        this.canAddChildren = false;
        this.reorderable = false;
        this.options = {
            color: {
                enabled: false,
                displayTint: "white",
                savedTint: "white",
                customColorsAllowed: true,
                palette: [],
                exportOptions: ["displayTint", "savedTint", "customColorsAllowed", "palette"],
                defaultKeys: ["displayTint", "savedTint"],
                name: "Recolor",
                icon: "<img class='icon' src='assets/color-picker.png'>",
                getOnclick: function(element) {
                    return function() {
                        selectedElement = element;
                        hideControls();
                        cancelButton(this);
                        showColorPalette();
                    };
                }
            },
            transform: {
                enabled: false,
                displayTransform: new ConstrainedTransformer(vec(0, 0), vec(1, 1), 0),
                savedTransform: new ConstrainedTransformer(vec(0, 0), vec(1, 1), 0),
                exportOptions: ["displayTransform", "savedTransform"],
                defaultKeys: ["displayTransform", "savedTransform"],
                name: "Move",
                icon: "<img class='icon' src='assets/move.png'>",
                getOnclick: function(element) {
                    return function() {
                        selectedElement = element;
                        hideControls();
                        cancelButton(this);
                        showMovementControls();
                    }
                }
            },
            display: {
                enabled: false,
                hidden: false,
                exportOptions: ["hidden"],
                name: "Hide",
                icon: "<img class='icon' src='assets/shown.png'>",
                icon2: "<img class='icon' src='assets/hidden.png'>",
                getOnclick: function(element) {
                    return function() {
                        element.toggleHidden();
                        this.innerHTML = element.getIconForOption("display");
                    }
                }
            },
            clone: {
                enabled: false,
                name: "Clone",
                icon: "<img class='icon' src='assets/clone.png'>",
                getOnclick: function(element) {
                    return function() {
                        element.clone();
                    }
                }
            },
            remove: {
                enabled: false,
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
        this.parent = undefined;
        this.setOptions(options, false);
        this.node = this.createNode();
        this.childrenNode = undefined;
    }
    canHaveChildren() {
        return this.children.length > 0 || this.canAddChildren;
    }
    getDisplayColor() {
        return this.options.color.displayTint;
    }
    getDisplayTransform() {
        return this.options.transform.displayTransform;
    }
    getColorOptions() {
        return this.options.color.palette;
    }
    getDisplayPosition() {
        return {
            x: this.getDisplayTransform().translation.x,
            w: this.getCurrentImage().getWidth() * this.getDisplayTransform().scale.x,
            y: this.getDisplayTransform().translation.y,
            h: this.getCurrentImage().getHeight() * this.getDisplayTransform().scale.y
        }; 
    }
    getCurrentImage() {
        return this.images[this.currentImage];
    }
    getIconForOption(option) {
        if(option == "display" && this.isHidden()) {
            return this.options[option].icon2;
        }
        return this.options[option].icon;
    }
    getOptionAmount() {
        let num = 1;
        Object.keys(this.options).forEach(key => {
            if(this.options[key].enabled) {
                num ++;
            }
        });
        return num;
    }
    isHidden() {
        return this.options.display.hidden;
    }
    addChild(element) {
        if(this.childrenNode != undefined) {
            super.addChild(element);
        } else {
            this.children.push(element);
            element.parent = this;
            this.childrenNode = this.createChildrenNode();
            this.node.parentNode.insertBefore(this.childrenNode, this.node.nextSibling);
        }
    }
    addColorOption(color) {
        this.options.color.palette.push(color);
    }
    clone() {
        this.cloneTo(this.parent);
    }
    cloneTo(parentElementContainer) {
        const options = this.exportOptions();
        options.remove = true;
        if(this.name != "") {
            options.name = this.name + "(Clone)";
        }
        parentElementContainer.addChild(new Element(options));
    }
    createChildrenNode() {
        const div = document.createElement("div");
        div.classList.add("element_children");
        this.children.forEach(child => {
            div.appendChild(child.node);
        });
        if(this.canAddChildren) {
            const button = document.createElement("button");
            button.classList.add("add_element", "extrude");
            button.innerHTML = '<img class="icon" src="assets/plus.png">';
            div.appendChild(button);
        }
        return div;
    }
    createNode() {
        const element = document.createElement("div");
        element.classList.add("element");
        switch(this.getOptionAmount()) {
            case 1: element.classList.add("singular"); break;
            case 2: element.classList.add("dual"); break;
            case 3: element.classList.add("tri"); break;
            case 4: case 5: break;
            case 6: case 7: element.classList.add("sept"); break;
            default: element.classList.add("multi"); break;
        }
        if(this.name != "") {
            const span = document.createElement("span");
            span.innerText = this.name;
            element.appendChild(span);
        }
        const mainDiv = document.createElement("div");
        mainDiv.classList.add("options");
        const mainButton = document.createElement("button");
        mainButton.classList.add("image");
        mainButton.innerHTML = "<img src='"+this.thumbnail+"'>";
        const emnt = this;
        if(this.images.length > 1) {
            mainButton.classList.add("extrude");
            mainButton.onclick = function() {
                showElementSelectPopup(emnt);
            }
        }
        mainDiv.appendChild(mainButton);
        Object.keys(this.options).forEach(key => {
            const option = this.options[key];
            if(option.enabled) {
                const button = document.createElement("button");
                button.classList.add("extrude");
                button.innerHTML = this.getIconForOption(key);
                button.defaultInnerHTML = option.icon;
                if(option.getOnclick != undefined) {
                    button.onclick = option.getOnclick(emnt);
                    button.defaultOnclick = option.getOnclick(emnt);
                }
                mainDiv.appendChild(button);
            }
        });
        element.appendChild(mainDiv);
        if(this.reorderable) {
            const sideDiv = document.createElement("div");
            sideDiv.classList.add("side");
            const button1 = document.createElement("button");
            button1.classList.add("extrude");
            button1.innerHTML = "<img class='icon' src='assets/up.png'>";
            sideDiv.appendChild(button1);
            const button2 = document.createElement("button");
            button2.classList.add("extrude");
            button2.innerHTML = "<img class='icon' src='assets/down.png'>";
            sideDiv.appendChild(button2);
            element.appendChild(sideDiv);
        }
        return element;
    }
    draw() {
        if(!this.isHidden()) {
            this.getCurrentImage().draw(this.getDisplayTransform(), this.getDisplayColor());
            if(selectedElement == this) {
                noFill();
                drawingContext.setLineDash([5 + sin(frameCount/10)*2, 10 - sin(frameCount/10)*2])
                strokeWeight(3);
                stroke(255);
                rect(this.getDisplayTransform().translation.x, 
                this.getDisplayTransform().translation.y, 
                this.getCurrentImage().getWidth() * this.getDisplayTransform().scale.x, 
                this.getCurrentImage().getHeight() * this.getDisplayTransform().scale.y);
            }
            super.draw();
        }
    }
    exportOptions() {
        const options = {
            name: this.name,
            thumbnail: this.thumbnail,
            images: this.images,
            currentImage: this.currentImage
        };
        Object.keys(this.options).forEach(key => {
            const option = this.options[key];

            options[key] = {enabled:option.enabled};
            if(option.hasOwnProperty("exportOptions")) {
                for(let i = 0; i < option.exportOptions.length; i ++) {
                    options[key][option.exportOptions[i]] = option[option.exportOptions[i]];
                }
            }
        });
        return options;
    }
    preload() {
        this.images.forEach(image => {
            image.preload();
        });
        super.preload();
    }
    refreshDisplay() {
        this.resetDisplayColor();
    }
    refreshNode() {
        const node = this.createNode();
        this.node.replaceWith(node);
        this.node = node;
    }
    removeColorOption(color) {
        if(this.getColorOptions().includes(color)) {
            this.getColorOptions().splice(this.getColorOptions().indexOf(color), 1);
        }
    }
    resetDisplayColor() {
        this.options.color.displayTint = this.options.color.savedTint;
    }
    saveDisplayColor() {
        this.options.color.savedTint = this.options.color.displayTint;
    }
    setDisplayColor(color) {
        this.options.color.displayTint = color;
    }
    setOptions(options, refreshNode = true) {
        Object.keys(options).forEach(key => {
            const option = options[key];
            if(this.options.hasOwnProperty(key)) {
                if(typeof option === "boolean") {
                    this.options[key].enabled = option;
                } else if(option instanceof Object) {
                    if(!option.hasOwnProperty("enabled")) {
                        this.options[key].enabled = true;
                    }
                    Object.keys(option).forEach(key2 => {
                        if(key2 == "default" && this.options[key].hasOwnProperty("defaultKeys")) {
                            this.options[key].defaultKeys.forEach(defaultKey => {
                                this.options[key][defaultKey] = option[key2];
                            });
                        } else {
                            this.options[key][key2] = option[key2];
                        }
                    });
                }
            } else if (this.hasOwnProperty(key)) {
                this[key] = option;
            }
        });
        if(refreshNode) {
            this.refreshNode();
        }
    }
    toggleHidden() {
        this.options.display.hidden = !this.options.display.hidden;
    }
}

document.addEventListener("click", function(event) {
    if(trashedButton != undefined && document.activeElement != trashedButton) {
        refreshTrashedButton();
    }
});

let elements;
document.addEventListener("DOMContentLoaded", function(event) {
    elements = new ElementContainer(false);
    elements.addChild(new Element({
        color: {
            default: "red",
            palette: ["red", "orange", "yellow", "green", "blue", "purple", "white"]
        },
        transform: {
            default: new ConstrainedTransformer(vec(50, 50), vec(0.5, 0.5), 0)
        },
        display: true,
        clone: true
    }));
});

function preload() {
    elements.preload();
}

function setup() {
    let canvas = createCanvas(512, 512);
    canvas.parent('canvas_container');
}
function draw() {
    background(155);
    elements.draw();
    if(selectedElement != undefined) {
        let pos = selectedElement.getDisplayPosition();
        document.getElementById("controls_position").style = `left: ${pos.x}px; top:${pos.y+pos.h}px;`;
        document.getElementById("movement_controls").style = `width: ${pos.w}px;`;
        document.getElementById("color_controls").style = `width: ${pos.w}px;`;
        document.getElementById("color_picker").style = `width: ${pos.w}px;`;
    }
}