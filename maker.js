let selectedElement = undefined;
let toggledButton = undefined;
let trashedButton = undefined;
let selectingSketches = [];
function cancelButton(button) {
    toggledButton = button;
    toggledButton.style = "background-color:red;";
    toggledButton.innerHTML = "<img class='icon' src='assets/cancel.png' style='filter:invert(1);'>";
    toggledButton.onclick = function() {
        hideControls();
    }
    selectedElement.refreshDisplay();
}
function clearExtraCanvases() {
    selectingSketches.forEach(sketch => {
        sketch.remove();
    });
    document.getElementById("selectable_elements").innerHTML = "";
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
            node.hidden = !selectedElement.controls.colors.customColorsAllowed;
        });
    }
}
function showColorPicker() {
    if (selectedElement != undefined) {
        document.getElementById("color_picker_input").value = selectedElement.getDisplayColor();
    }
    hideControls(false);
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
    document.getElementsByClassName("translation").forEach(button => {
        button.hidden = !selectedElement.controls.moveable.translation;
    });
    document.getElementsByClassName("rotation").forEach(button => {
        button.hidden = !selectedElement.controls.moveable.rotation;
    });
    document.getElementsByClassName("scale").forEach(button => {
        button.hidden = !selectedElement.controls.moveable.scale;
    });
}
function moveElement(x, y) {
    if(selectedElement != undefined) {
        selectedElement.displayTransform.translate(x * selectedElement.incrementTransform.translation.x, y * selectedElement.incrementTransform.translation.y);
    }
}
function saveCanvas() {
    if(p != undefined && pack != undefined) {
        p.saveCanvas(pack.name, "png");
    }
}
function scaleElement(x, y) {
    if(selectedElement != undefined) {
        selectedElement.displayTransform.addScale(x * selectedElement.incrementTransform.scale.x, y * selectedElement.incrementTransform.scale.x);
    }
}
function rotateElement(r) {
    if(selectedElement != undefined) {
        selectedElement.displayTransform.rotate(r * selectedElement.incrementTransform.rotation);
    }
}
// function refreshElementSelect() {
//     const container = document.getElementById("selectable_elements");
//     container.childNodes.forEach(node => {
//         if(node.imageSrc == container.selectedImage) {
//             node.classList.add("selected");
//         } else {
//             node.classList.remove("selected");
//         }
//     });
// }
function showImageSelectPopup(element) {
    const container = document.getElementById("selectable_elements");
    container.innerHTML = "";
    //container.selectedImage = element.getCurrentImage();
    element.images.forEach(image => {
        selectingSketches.push(new p5(image.getSketch(image == element.getCurrentImage(), element.getDisplayColor(), p => function() {
            if(p.mouseX > 0 && p.mouseX < p.canvasSize && p.mouseY > 0 && p.mouseY < p.canvasSize) {
                element.selectImage(image);
                clearExtraCanvases();
                hidePopups();
            }
        })));
    });
    //refreshElementSelect();

    document.getElementById("popup").style = "";
    document.getElementById("element_select").hidden = false;
}
function showElementSelectPopup(element) {
    const container = document.getElementById("selectable_elements");
    container.innerHTML = "";
    selectedElement = element;
    element.addableChildren.forEach(child => {
        selectingSketches.push(new p5(child.getCurrentImage().getSketch(false, child.getDisplayColor(), p => function() {
            if(p.mouseX > 0 && p.mouseX < p.canvasSize && p.mouseY > 0 && p.mouseY < p.canvasSize) {//onclick
                child.cloneTo(element);
                clearExtraCanvases();
                hidePopups();
            }
        })));
    });

    document.getElementById("popup").style = "";
    document.getElementById("element_select").hidden = false;
}
function showMakerSelectPopup(element) {
    document.getElementById("popup").style = "";
    document.getElementById("maker_select").hidden = false;
}
function showElementLoadPopup() {
    document.getElementById("popup").style = "";
    document.getElementById("element_load").hidden = false;
}
let packURL = "examplePack/";
function changeMaker() {
    let value = document.getElementById("maker_url").value;
    fetch(value+"pack.json").then(result => loadPack(value).then(elements => onLoad(elements)))
    .catch(error => console.error(error));
}
function tryReset(button) {
    button.style = "background-color:red;";
    button.defaultInnerHTML = button.innerHTML;
    button.defaultOnclick = button.onclick;
    button.innerHTML = "<img class='icon' src='assets/check.png' style='filter:invert(1);'>";
    button.onclick = function() {
        localStorage.setItem("changes", undefined);
        loadPack(packURL).then(elements => onLoad(elements));
        refreshTrashedButton();
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
    document.getElementById("element_load").hidden = true;
    document.getElementById("element_export").hidden = true;
    document.getElementById("maker_select").hidden = true;
}
function hideControls(clear = true) {
    document.getElementById("color_controls").hidden = true;
    document.getElementById("color_picker").hidden = true;
    document.getElementById("movement_controls").hidden = true;

    if(clear) {
        if(toggledButton != undefined) {
            toggledButton.style = "";
            toggledButton.innerHTML = toggledButton.defaultInnerHTML;
            toggledButton.onclick = toggledButton.defaultOnclick;
            toggledButton = undefined;
        }

        if(selectedElement != undefined) {
            selectedElement.refreshDisplay();
        }
        selectedElement = undefined;
    }
}
function hideColorControls(save) {
    if(save) {
        selectedElement.saveDisplayColor();
    }
    hideControls();
}
function hideColorPicker(save) {
    if(save) {
        const color = document.getElementById("color_picker_input").value;
        selectedElement.addColorOption(color);
        selectedElement.setDisplayColor(color);
    }
    hideControls(false);
    showColorPalette();
}
function hideMovementControls(save) {
    if(save) {
        selectedElement.saveDisplayTransform();
    }
    hideControls();
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
function loadPack(url) {
    if(p != undefined) {
        p.remove();
    }
    elementLookupTable = {};
    addedElements = [];
    document.getElementById("canvas_container").innerHTML = "";
    document.getElementById("elements").innerHTML = "";
    return fetch(url+"pack.json")
        .then((response) => response.json())
        .then((json) => {
            pack = {
                name: json.name,
                canvasWidth: json.canvasWidth,
                canvasHeight: json.canvasHeight
            };
            root = new ElementContainer(json.root, true, true);
        });
}
function loadChanges(changes) {
    try {
        let parsed = JSON.parse(changes);
        parsed.editedElements.forEach(element => {
            if(elementLookupTable.hasOwnProperty(element.name)) {
                elementLookupTable[element.name].processJSON(element, true);
            }
        });
        parsed.addedElements.forEach(element => {
            if(elementLookupTable.hasOwnProperty(element.name) && elementLookupTable.hasOwnProperty(element.parentName)) {
                let newElement = elementLookupTable[element.name].getClone(elementLookupTable[element.name].exportOptions());
                newElement.processJSON(element, false);
                elementLookupTable[element.parentName].addChild(newElement);
            }
        });
    } catch(error) {
        console.error(error);
    }
}
function getJSON() {
    let json = {
        editedElements: [],
        addedElements: []
    };
    Object.keys(elementLookupTable).forEach(key => {
        if(elementLookupTable[key].base) {
            json.editedElements.push(elementLookupTable[key].exportJSON());
        }
    });
    addedElements.forEach(element => {
        json.addedElements.push(element.exportJSON());
    });
    return json;
}
function showElementExportPopup() {
    console.log(JSON.stringify(getJSON()));
    document.getElementById("popup").style = "";
    document.getElementById("element_export").hidden = false;
    document.getElementById("export_json").innerHTML = JSON.stringify(getJSON());
}
function downloadChanges() {
    p.save(getJSON(), "exported.json");
}
function saveChangesToLocalStorage() {
    localStorage.setItem("packURL", packURL);
    localStorage.setItem("changes", JSON.stringify(getJSON()));
}

document.addEventListener("click", function(event) {
    if(trashedButton != undefined && document.activeElement != trashedButton) {
        refreshTrashedButton();
    }
});

document.addEventListener("DOMContentLoaded", function(event) {
    if(localStorage.getItem("packURL") != undefined) {
        packURL = localStorage.getItem("packURL");
    } else {
        packURL = document.getElementById("maker_url").value;
    }
    loadPack(packURL).then(elements => onLoad(elements)).catch(error => {
        packURL = document.getElementById("maker_url").value;
        loadPack(packURL).then(elements => onLoad(elements))
    });
});

window.addEventListener("beforeunload", function(e){
    saveChangesToLocalStorage();
});

let p;
let pack;
let root;
let elementLookupTable = {};
let addedElements = [];

function onLoad() {
    if(localStorage.getItem("changes") != undefined) {
        loadChanges(localStorage.getItem("changes"));
    }
    root.addNodesTo(document.getElementById("elements"));
    p = new p5(p => {
        p.preload = function() {
            root.preload(p);
        }
        p.setup = function() {
            let canvas = p.createCanvas(pack.canvasWidth, pack.canvasHeight);
            canvas.parent('canvas_container');
            p.angleMode(p.DEGREES);
            p.imageMode(p.CENTER);
            p.rectMode(p.CENTER);
            root.setup(p);
            document.getElementById("canvas_container").childNodes[0].style = "";
        }
        p.draw = function() {
            p.clear();
            root.draw(p);
            if(selectedElement != undefined) {
                let top = selectedElement.getGlobalTranslation().y > pack.canvasHeight*0.75;
                document.getElementById("controls_position").style = `left: 0vh; top:${top ? 0 : 70}vh; transform:translate(0, ${top ? 0 : -5}em);`;
                document.getElementById("movement_controls").style = `width: ${70 * (pack.canvasWidth/pack.canvasHeight)}vh;`;
                document.getElementById("color_controls").style = `width: ${70 * (pack.canvasWidth/pack.canvasHeight)}vh;`;
                document.getElementById("color_picker").style = `width: ${70 * (pack.canvasWidth/pack.canvasHeight)}vh;`;
                selectedElement.drawBoundingBox(p);
            }
        }
    });
}
