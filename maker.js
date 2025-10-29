let selectedElement = undefined;
let toggledButton = undefined;
let trashedButton = undefined;
let selectingSketches = [];
let selectedHSL = {h:0, s:0, l:0};
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
        document.getElementById("palette_container").innerHTML = "";
        selectedElement.getColorPalette().forEach(color => {
            const button = document.createElement("button");
            button.classList.add("color", "extrude");
            if(color == selectedElement.getDisplayColor()) {
                button.classList.add("selected");
            }
            button.color = color;
            button.style = `background-color: ${color};`;
            //button.style = `background-color: rgb(${red(color)}, ${green(color)}, ${blue(color)})`;
            button.onclick = function() {
                selectedElement.setDisplayColor(button.color);
                updateDraw = true;
                refreshColorPalette();
            };
            document.getElementById("palette_container").appendChild(button);
        });
        picker.getElementsByClassName("custom").forEach(node => {
            node.hidden = !selectedElement.controls.colors.customColorsAllowed;
        });
    }
    updateDraw = true;
}
function getPickedColor() {
    if(selectedElement.get("colors", "mode") == "tint") {
        return `hsl(${selectedHSL.h}, ${selectedHSL.s}%, ${selectedHSL.l}%)`;
    } else {
        return selectedHSL;
    }
}
function showColorPicker() {
    if (selectedElement != undefined) {
        if(selectedElement.get("colors", "mode") == "tint") {
            selectedHSL = getDisplayColorAsHSL(selectedElement.getDisplayColor());
        } else {
            selectedHSL = selectedElement.getDisplayColor();
        }
        document.getElementById("color_preview").style = `background-color:${selectedElement.getDisplayColor()};`;
        document.getElementById("color_picker_hue").value = selectedHSL.h;
        document.getElementById("color_picker_saturation").value = selectedHSL.s;
        document.getElementById("color_picker_lightness").value = selectedHSL.l;
        setSliderColors(selectedHSL);
    }
    hideControls(false);
    document.getElementById("color_picker").hidden = false;
}
function refreshColorPalette() {
    const container = document.getElementById("palette_container");
    container.childNodes.forEach(button => {
        if(button.color == selectedElement.getDisplayColor() && button.color != undefined) {
            button.classList.add("selected");
        } else {
            button.classList.remove("selected");
        }
    });
    updateDraw = true;
}
function showMovementControls() {
    const controls = document.getElementById("movement_controls");
    controls.hidden = false;
    document.getElementsByClassName("translation").forEach(button => {
        button.hidden = !selectedElement.get("transform", "allowTranslation");
    });
    document.getElementsByClassName("rotation").forEach(button => {
        button.hidden = !selectedElement.get("transform", "allowRotation");
    });
    document.getElementsByClassName("scale").forEach(button => {
        button.hidden = !selectedElement.get("transform", "allowScale");
    });
}
function moveElement(x, y) {
    if(selectedElement != undefined && selectedElement.get("transform", "allowTranslation")) {
        selectedElement.get("transform").translate(x * selectedElement.get("transform", "increment").translation.x, y * selectedElement.get("transform", "increment").translation.y);
    }
    updateDraw = true;
}
function saveCanvas() {
    if(p != undefined && pack != undefined) {
        p.saveCanvas(pack.name, "png");
    }
}
function scaleElement(x, y) {
    if(selectedElement != undefined && selectedElement.get("transform", "allowScale")) {
        selectedElement.get("transform").addScale(x * selectedElement.get("transform", "increment").scale.x, y * selectedElement.get("transform", "increment").scale.x);
    }
    updateDraw = true;
}
function rotateElement(r) {
    if(selectedElement != undefined && selectedElement.get("transform", "allowRotation")) {
        selectedElement.get("transform").rotate(r * selectedElement.get("transform", "increment").rotation);
    }
    updateDraw = true;
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
    hideControls(true);
    const container = document.getElementById("selectable_elements");
    container.innerHTML = "";
    //container.selectedImage = element.getCurrentImage();
    element.images.forEach(image => {
        selectingSketches.push(new p5(image.getSketch(image == element.getCurrentImage(), new ImageSettings().tint(element.getDisplayColor()).recolorMode(element.get("colors", "mode")), function() {
            element.selectImage(image);
            clearExtraCanvases();
            hidePopups();
            updateDraw = true;
        })));
    });
    //refreshElementSelect();

    document.getElementById("popup").style = "";
    document.getElementById("element_select").hidden = false;
}
function showElementSelectPopup(element) {
    hideControls(true);
    const container = document.getElementById("selectable_elements");
    container.innerHTML = "";
    selectedElement = element;
    if(element.addableChildren.length > 1) {
        element.addableChildren.forEach(child => {
            selectingSketches.push(new p5(child.getCurrentImage().getSketch(false, new ImageSettings().tint(child.getDisplayColor()).recolorMode(child.get("colors", "mode")), function() {
                clearExtraCanvases();
                hidePopups();
                updateDraw = true;
                child.cloneTo(element).then(clone => showImageSelectPopup(clone));
            })));
        });
    } else {
        clearExtraCanvases();
        hidePopups();
        element.addableChildren[0].cloneTo(element).then(clone => showImageSelectPopup(clone));
    }

    document.getElementById("popup").style = "";
    document.getElementById("element_select").hidden = false;
}
function showMakerSelectPopup(element) {
    hideControls(true);
    document.getElementById("popup").style = "";
    document.getElementById("maker_select").hidden = false;
}
let packURL = "examplePack/";
function changeMaker() {
    let value = document.getElementById("maker_url").value;
    fetch(value+"pack.json").then(result => loadPack(value, true).then(onLoad))
    .catch(error => console.error(error));
}
function tryReset(button) {
    button.style = "background-color:red;";
    button.defaultInnerHTML = button.innerHTML;
    button.defaultOnclick = button.onclick;
    button.innerHTML = "<img class='icon' src='assets/check.png' style='filter:invert(1);'>";
    button.onclick = function() {
        localStorage.setItem("changes", undefined);
        loadPack(packURL, true).then(onLoad);
        refreshTrashedButton();
    }
    if(trashedButton != undefined) {
        refreshTrashedButton();
    }
    hidePopups();
    hideControls();
    trashedButton = button;
    // document.getElementById("popup").style = "";
    // document.getElementById("confirm_reset").hidden = false;
}
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    let max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return {h: h * 360, s: s * 100, l: l * 100}; // Return HSL as [degrees, percentage, percentage]
}
function getDisplayColorAsHSL(color) {
    document.getElementById("color_preview").style = `background-color:${color};`;
    let nums = [...window.getComputedStyle(document.getElementById("color_preview")).getPropertyValue('background-color').matchAll(/(\d+)/g)];
    return rgbToHsl(nums[0][0], nums[1][0], nums[2][0]);
}
function setSliderColors(hsl) {
    let gradient = `background:linear-gradient(to right, hsl(0, ${hsl.s}%, ${hsl.l}%)`;
    for(let i = 10; i < 360; i += 10) {
        gradient += `, hsl(${i}, ${hsl.s}%, ${hsl.l}%)`;
    }
    gradient += ");"
    document.getElementById("color_picker_hue").style = gradient;
    document.getElementById("color_picker_saturation").style = `background:linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%));`;
    document.getElementById("color_picker_lightness").style = `background:linear-gradient(to right, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 50%), hsl(${hsl.h}, ${hsl.s}%, 100%));`;
}
function updateSelectedColor() {
    if(selectedElement != undefined) {
        let h = document.getElementById("color_picker_hue").value;
        let s = document.getElementById("color_picker_saturation").value;
        let l = document.getElementById("color_picker_lightness").value;
        selectedHSL = {h: h, s: s, l: l};
        let color = `hsl(${selectedHSL.h}, ${selectedHSL.s}%, ${selectedHSL.l}%)`;
        if(selectedElement.get("colors", "mode") == "tint") {
            selectedElement.setDisplayColor(color);
        } else {
            selectedElement.setDisplayColor(selectedHSL);
        }
        document.getElementById("color_preview").style = `background-color:${color};`;
        setSliderColors(selectedHSL);
    }
    updateDraw = true;
}
function hidePopups() {
    document.getElementById("popup").style = "display:none;";
    document.getElementById("element_select").hidden = true;
    document.getElementById("element_export").hidden = true;
    document.getElementById("maker_select").hidden = true;
}
function hideControls(clear = true) {
    document.getElementById("color_controls").hidden = true;
    document.getElementById("color_picker").hidden = true;
    document.getElementById("movement_controls").hidden = true;

    if(clear) {
        if(toggledButton != undefined) {
            if(toggledButton.hasOwnProperty("getStyle")) {
                toggledButton.style = toggledButton.getStyle(selectedElement);
            } else {
                toggledButton.style = "";
            }
            toggledButton.innerHTML = toggledButton.defaultInnerHTML;
            toggledButton.onclick = toggledButton.defaultOnclick;
            toggledButton = undefined;
        }

        if(selectedElement != undefined) {
            selectedElement.refreshDisplay();
        }
        selectedElement = undefined;
    }
    updateDraw = true;
}
function hideColorControls(save) {
    if(save) {
        selectedElement.saveDisplayColor();
    }
    hideControls();
}
function hideColorPicker(save) {
    if(save) {
        if(selectedElement.get("colors", "mode") == "tint") {
            selectedElement.addColorToPalette(getPickedColor());
        }
        selectedElement.setDisplayColor(getPickedColor());
    }
    hideControls(false);
}
function hideMovementControls(save) {
    if(save) {
        selectedElement.saveDisplayTransform();
    }
    hideControls();
}
function removeSelectedColor() {
    const container = document.getElementById("palette_container");
    container.childNodes.forEach(button => {
        if(button.color == selectedElement.getDisplayColor()) {
            container.removeChild(button);
        }
    });

    selectedElement.removeColorOption(selectedElement.getDisplayColor());
}
async function loadPack(url, addElements=false) {
    packURL = url;
    if(p != undefined) {
        p.remove();
    }
    elementLookupTable = {};
    addedElements = [];
    document.getElementById("canvas_container").innerHTML = "";
    document.getElementById("elements").innerHTML = "";
    let json = await fetch(url+"pack.json").then((response) => response.json());
    pack = {
        name: json.name,
        canvasWidth: json.canvasWidth,
        canvasHeight: json.canvasHeight,
        defaultPalette: json.defaultPalette || ["white", "black", "tan", "brown", "red", "orange", "yellow", "green", "blue", "purple"]
    };
    root = new ElementContainer();
    await root.init(json.root, true, true);
    let transform = root.get("transform");
    if(transform.translation.x == 0 && transform.translation.y == 0) {
        transform.translation = {x:json.canvasWidth/2, y:json.canvasHeight/2};
    }
    if(addElements && json.hasOwnProperty("addedElements")) {
        for(let i = 0; i < json.addedElements.length; i ++) {
            let element = json.addedElements[i];
            element.removeable = true;
            if(elementLookupTable.hasOwnProperty(element.name) && elementLookupTable.hasOwnProperty(element.parentName)) {
                let newElement = await elementLookupTable[element.name].getClone(elementLookupTable[element.name].exportOptions());
                await newElement.processJSON(element, false);
                elementLookupTable[element.parentName].addChild(newElement);
            }
        }
    }
    updateDraw = true;
}
async function loadChanges(changes) {
    try {
        let parsed = JSON.parse(changes);
        parsed.editedElements.forEach(element => {
            if(elementLookupTable.hasOwnProperty(element.name)) {
                elementLookupTable[element.name].processJSON(element, true);
            }
        });
        for(let i = 0; i < parsed.addedElements.length; i ++) {
            let element = parsed.addedElements[i];
            element.removeable = true;
            if(elementLookupTable.hasOwnProperty(element.name) && elementLookupTable.hasOwnProperty(element.parentName)) {
                let newElement = await elementLookupTable[element.name].getClone(elementLookupTable[element.name].exportOptions());
                await newElement.processJSON(element, false);
                elementLookupTable[element.parentName].addChild(newElement);
            }
        }
        updateDraw = true;
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
            let j = elementLookupTable[key].exportJSON();
            if(Object.keys(j).length > 1) {
                json.editedElements.push(j);
            }
        }
    });
    addedElements.forEach(element => {
        let j = element.exportJSON();
        if(Object.keys(j).length > 1) {
            json.addedElements.push(j);
        }
    });
    return json;
}
function showElementExportPopup() {
    hideControls(true);
    //console.log(JSON.stringify(getJSON()));
    document.getElementById("popup").style = "";
    document.getElementById("element_export").hidden = false;
    document.getElementById("export_json").innerHTML = JSON.stringify(getJSON());
}
function copyChanges(button) {
    navigator.clipboard.writeText(JSON.stringify(getJSON()));
    button.innerHTML = "<img class='icon' src='assets/check.png'>";
    setTimeout(function() {
        button.innerHTML = "<img class='icon' src='assets/clone.png'>";
    }, 1000);
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
    let changes = localStorage.getItem("changes") != undefined && localStorage.getItem("changes") != "undefined";
    loadPack(packURL, !changes).then(onLoad)
    .catch(error => {
        console.error(error);
        packURL = document.getElementById("maker_url").value;
        loadPack(packURL, !changes).then(onLoad);
    });
});

window.addEventListener("beforeunload", function(e){
    saveChangesToLocalStorage();
});

let buffers;
let p;
let pack;
let root;
let maskBuffer;
let elementLookupTable = {};
let addedElements = [];
let updateDraw = true;

async function onLoad() {
    if(localStorage.getItem("changes") != undefined && localStorage.getItem("changes") != "undefined") {
        await loadChanges(localStorage.getItem("changes"));
    }
    root.addNodesTo(document.getElementById("elements"));
    p = new p5(p => {
        p.preload = function() {
            root.preload(p);
        }
        p.setup = function() {
            let c = p.createCanvas(pack.canvasWidth, pack.canvasHeight);
            c.removeAttribute("style");
            c.parent('canvas_container');
            buffers = new Buffers(p, pack.canvasWidth, pack.canvasHeight);
            root.setup(p);
            document.getElementsByClassName("controls_container").forEach(element => {
                element.style = `aspect-ratio:${pack.canvasWidth}/${pack.canvasHeight};`;
            });
            updateDraw = true;
        }
        p.draw = function() {
            if(updateDraw) {
                updateDraw = false;
                buffers.clear();
                root.render(buffers);
                p.clear();
                p.image(buffers.get(0), 0, 0);
                if(selectedElement != undefined) {
                    if(selectedElement.getGlobalTranslation().y > buffers.height*0.75) {
                        document.getElementsByClassName("controls").forEach(element => {
                            element.style = "";
                        });
                    } else {
                        document.getElementsByClassName("controls").forEach(element => {
                            element.style = "bottom:0;";
                        });
                    }
                    selectedElement.drawBoundingBox(buffers.get(0));
                }
            }
        }
    });
}
