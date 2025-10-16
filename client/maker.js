let selectedElement = undefined;
let toggledButton = undefined;
let trashedButton = undefined;
function cancelButton(button) {
    toggledButton = button;
    toggledButton.style = "background-color:red;";
    toggledButton.innerHTML = "<img class='icon' src='assets/cancel.png' style='filter:invert(1);'>";
    toggledButton.onclick = function() {
        hideControls();
    }
}
function refreshTrashedButton() {
    trashedButton.hidden = false;
    trashedButton.innerHTML = trashedButton.defaultInnerHTML;
    trashedButton.onclick = trashedButton.defaultOnclick;
    trashedButton = undefined;
}
function showColorPicker() {
    const picker = document.getElementById("color_controls");
    picker.hidden = false;
}
function refreshColorPicker() {
    const container = document.getElementById("color_controls");
    container.childNodes.forEach(node => {
        if(node.classList != undefined) {
            if(node.color == container.selectedColor && node.color != undefined) {
                console.log(node.color);
                console.log(container.selectedColor);
                node.classList.add("selected");
            } else {
                node.classList.remove("selected");
            }
        }
    });
}
function showMovementControls() {
    const controls = document.getElementById("movement_controls");
    controls.hidden = false;
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
function showResetPopup() {
    document.getElementById("popup").style = "";
    document.getElementById("confirm_reset").hidden = false;
}
function hidePopups() {
    document.getElementById("popup").style = "display:none;";
    document.getElementById("confirm_reset").hidden = true;
    document.getElementById("element_select").hidden = true;
}
function hideControls() {
    const picker = document.getElementById("color_controls");
    picker.hidden = true;
    const controls = document.getElementById("movement_controls");
    controls.hidden = true;

    if(toggledButton != undefined) {
        toggledButton.style = "";
        toggledButton.innerHTML = toggledButton.defaultInnerHTML;
        toggledButton.onclick = toggledButton.defaultOnclick;
        toggledButton = undefined;
    }
}
function addElements(elements) {
    const workspace = document.getElementById("elements");
    elements.forEach(element => {
        workspace.appendChild(element.createNode());
        if(element.canHaveChildren()) {
            workspace.appendChild(element.createChildrenNode());
        }
    });
}
function removeElement(element) {
    if(element.removable) {
        document.getElementById("elements").removeChild(element.node);
        if(element.childrenNode != undefined) {
            document.getElementById("elements").removeChild(element.childrenNode);
        }
        element.parent.splice(element.parent.indexOf(element), 1);
    }
}
function selectColor(button) {
    document.getElementById("color_controls").selectedColor = button.color;
    refreshColorPicker();
}

class Element {
    constructor(parent) {
        this.parent = parent;
        this.parent.push(this);
        this.name = "Element";
        this.thumbnail = "assets/smile.png";
        this.images = ["assets/smile.png"];
        this.currentImage = 0;
        this.colorable = false;
        this.moveable = false;
        this.hideable = false;
        this.hidden = false;
        this.removable = false;
        this.children = [];
        this.canAddChildren = false;
    }
    canHaveChildren() {
        return this.children.length > 0 || this.canAddChildren;
    }
    getCurrentImage() {
        return this.images[this.currentImage];
    }
    getOptionAmount() {
        let num = 1;
        if(this.colorable) {num ++;}
        if(this.moveable) {num ++;}
        if(this.hideable) {num ++;}
        if(this.deletable) {num ++;}
        return num;
    }
    createNode() {
        const element = document.createElement("div");
        element.classList.add("element");
        switch(this.getOptionAmount()) {
            case 1: element.classList.add("singular"); break;
            case 2: element.classList.add("dual"); break;
            case 3: element.classList.add("tri"); break;
        }
        if(this.name != "") {
            const span = document.createElement("span");
            span.innerText = this.name;
            element.appendChild(span);
        }
        const mainDiv = document.createElement("div");
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
        if(this.colorable) {
            const button = document.createElement("button");
            button.classList.add("extrude");
            button.innerHTML = "<img class='icon' src='assets/color-picker.png'>";
            button.defaultInnerHTML = button.innerHTML;
            button.onclick = function() {
                selectedElement = emnt;
                hideControls();
                cancelButton(button);
                showColorPicker();
            };
            button.defaultOnclick = button.onclick;
            mainDiv.appendChild(button);
        }
        if(this.moveable) {
            const button = document.createElement("button");
            button.classList.add("extrude");
            button.innerHTML = "<img class='icon' src='assets/move.png'>";
            button.defaultInnerHTML = button.innerHTML;
            button.onclick = function() {
                selectedElement = emnt;
                hideControls();
                cancelButton(button);
                showMovementControls();
            };
            button.defaultOnclick = button.onclick;
            mainDiv.appendChild(button);
        }
        if(this.hideable) {
            const button = document.createElement("button");
            button.classList.add("extrude");
            button.innerHTML = "<img class='icon' src='assets/eye.png'>";
            const emnt = this;
            button.onclick = function() {
                emnt.hidden = !emnt.hidden;
                if(emnt.hidden) {
                    button.innerHTML = "<img class='icon' src='assets/visibility.png'>";
                } else {
                    button.innerHTML = "<img class='icon' src='assets/eye.png'>";
                }
            }
            mainDiv.appendChild(button);
        }
        if(this.removable) {
            const button = document.createElement("button");
            button.classList.add("extrude");
            button.innerHTML = "<img class='icon' src='assets/delete.png'>";
            button.defaultInnerHTML = button.innerHTML;
            const emnt = this;
            button.onclick = function() {
                this.style = "background-color:red;";
                this.innerHTML = "<img class='icon' src='assets/check.png' style='filter:invert(1);'>";
                this.onclick = function() {
                    removeElement(emnt);
                }
                trashedButton = this;
            }
            button.defaultOnclick = button.onclick;
            mainDiv.appendChild(button);
        }
        element.appendChild(mainDiv);
        this.node = element;
        return element;
    }
    createChildrenNode() {
        const div = document.createElement("div");
        div.classList.add("element_children");
        this.children.forEach(child => {
            div.appendChild(child.createNode());
            if(child.canHaveChildren()) {
                div.appendChild(child.createChildrenNode());
            }
        });
        if(this.canAddChildren) {
            const button = document.createElement("button");
            button.classList.add("add_element", "extrude");
            button.innerHTML = '<img class="icon" src="assets/plus.png">';
            div.appendChild(button);
        }
        this.childrenNode = div;
        return div;
    }
}

const elements = [];
const e1 = new Element(elements);
e1.canAddChildren = true;
    const e2 = new Element(e1.children);
    e2.colorable = true;
        const e3 = new Element(e2.children);
        e3.colorable = true;
        e3.moveable = true;
const e4 = new Element(elements);
e4.colorable = true;
e4.moveable = true;
e4.hideable = true;
e4.removable = true;

document.addEventListener("DOMContentLoaded", function() {
    addElements(elements);
});
document.addEventListener("click", function(event) {
    if(trashedButton != undefined && !trashedButton.contains(event.target)) {
        //refreshTrashedButton();
    }
});