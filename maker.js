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
    return `hsl(${selectedHSL.h}, ${selectedHSL.s}%, ${selectedHSL.l}%)`;
}
function hexR(color) {
    return Math.floor(sketchInstance.red(color)).toString(16).padStart(2, '0');
}
function hexG(color) {
    return Math.floor(sketchInstance.green(color)).toString(16).padStart(2, '0');
}
function hexB(color) {
    return Math.floor(sketchInstance.blue(color)).toString(16).padStart(2, '0');
}
function showColorPicker() {
    if (selectedElement != undefined) {
        selectedHSL = {
            h:sketchInstance.hue(selectedElement.getDisplayColor()),
            s:sketchInstance.saturation(selectedElement.getDisplayColor()),
            l:sketchInstance.lightness(selectedElement.getDisplayColor())
        };
        document.getElementById("color_preview").value = `#${hexR(selectedElement.getDisplayColor())}${hexG(selectedElement.getDisplayColor())}${hexB(selectedElement.getDisplayColor())}`;
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
    if(sketchInstance != undefined && currentPack != undefined) {
        sketchInstance.saveCanvas(currentPack.name, "png");
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
function showPopup(id) {
    hideControls(true);
    document.getElementById("popup").style = "";
    document.getElementById(id).hidden = false;
}
function showImageSelectPopup(element, deleteOnCancel=false) {
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

    if(deleteOnCancel) {
        document.getElementById("element_select_cancel").onclick = function() {
            console.log("CANCEL, DELETE");
            element.removeSelf();
            clearExtraCanvases();
            hidePopups();
            updateDraw = true;
            document.getElementById("element_select_cancel").onclick = function() {
                clearExtraCanvases();
                hidePopups();
            }
        };
    }

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
                child.cloneTo(element).then(clone => showImageSelectPopup(clone, true));
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
function showPackConfirmationPopup(pack) {
    document.getElementById("popup").style = "";
    document.getElementById("pack_confirmation").hidden = false;
    document.getElementById("pack_confirmation_name").innerText = pack.name;
    pack.description.replaceAll("<script>", "<div>");//Pack description can have HTML, but NO SCRIPTS
    pack.description.replaceAll("</script>", "</div>");
    document.getElementById("pack_confirmation_description").innerHTML = pack.description;
    document.getElementById("pack_confirmation_img").src = pack.URL + pack.icon;
    document.getElementById("pack_confirmation_button").onclick = function() {
        hidePopups();
        applyPack(pack, true).then(onLoad);
    };
}
async function tryLoadPack() {
    let url = document.getElementById("maker_url").value;
    console.log("FETCHING NEW PACK");
    fetch(url+"pack.json").then(result => {
        localStorage.removeItem("changes");
        getPackJSON(url).then(pack => showPackConfirmationPopup(pack));
    })
    .catch(error => {
        console.log("ERROR FETCHING PACK:");
        //ERROR LOADING PACK POPUP
        console.error(error)
    });
}
function tryReset(button) {
    button.style = "background-color:red;";
    button.defaultInnerHTML = button.innerHTML;
    button.defaultOnclick = button.onclick;
    button.innerHTML = "<img class='icon' src='assets/check.png' style='filter:invert(1);'>";
    button.onclick = function() {
        if(currentPack != undefined) {
            localStorage.removeItem("changes");
            applyPack(currentPack, true).then(onLoad);
            refreshTrashedButton();
        }
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
function updateSelectedColor(fromTextBox = false) {
    if(selectedElement != undefined) {
        let color;
        if(fromTextBox) {
            color = document.getElementById("color_preview").value;
            selectedHSL = {
                h:sketchInstance.hue(color),
                s:sketchInstance.saturation(color),
                l:sketchInstance.lightness(color)
            };
        } else {
            let h = document.getElementById("color_picker_hue").value;
            let s = document.getElementById("color_picker_saturation").value;
            let l = document.getElementById("color_picker_lightness").value;
            selectedHSL = {h: h, s: s, l: l};
            color = `hsl(${selectedHSL.h}, ${selectedHSL.s}%, ${selectedHSL.l}%)`;
            document.getElementById("color_preview").value = `#${hexR(color)}${hexG(color)}${hexB(color)}`;
        }
        selectedElement.setDisplayColor(color);
        document.getElementById("color_preview").style = `background-color:${color};`;
        setSliderColors(selectedHSL);
    }
    updateDraw = true;
}
function hidePopups() {
    document.getElementById("popup").style = "display:none;";
    document.getElementById("popup").childNodes.forEach(node => {
        node.hidden = true;
    });
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
async function getPackJSON(url) {
    console.log("LOADING PACK: "+url);
    if(url[url.length-1] != "/") {
        url += "/";
    }
    let response = await fetch(url+"pack.json");
    let json = await response.json();
    json.URL = url;
    return json;
}
async function applyPack(json, addDefaultElements=false) {
    console.log("APPLYING PACK: "+json.name, json.URL);
    if(sketchInstance != undefined) {
        sketchInstance.remove();
    }
    elementLookupTable = {};
    addedElements = [];
    document.getElementById("canvas_container").innerHTML = "<p id='p5_loading' class='loadingclass'>Loading Pack Images...</p>";
    document.getElementById("elements").innerHTML = "";
    currentPack = json;
    if(currentPack.defaultPalette == undefined) {
        currentPack.defaultPalette = ["white", "black", "tan", "brown", "red", "orange", "yellow", "green", "blue", "purple"];
    }
    root = new ElementContainer();
    await root.init(json.root, true, true);
    let transform = root.get("transform");
    if(transform.translation.x == 0 && transform.translation.y == 0) {
        transform.translation = {x:json.canvasWidth/2, y:json.canvasHeight/2};
    }
    if(addDefaultElements && json.hasOwnProperty("addedElements")) {
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
        console.error("Error when loading changes:", error);
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
    sketchInstance.save(getJSON(), "exported.json");
}
function saveChangesToLocalStorage() {
    localStorage.setItem("packURL", currentPack.URL);
    localStorage.setItem("changes", JSON.stringify(getJSON()));
}

document.addEventListener("click", function(event) {
    if(trashedButton != undefined && document.activeElement != trashedButton) {
        refreshTrashedButton();
    }
});

let urlParams;

document.addEventListener("DOMContentLoaded", function(event) {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);
  
    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
    //https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
    
    let baseURL = localStorage.getItem("packURL");
    let changes = localStorage.getItem("changes") !== "null";
    if(urlParams.p != undefined) {
        if(baseURL != urlParams.p) {
            changes = false;
        }
        baseURL = urlParams.p;
    }
    if(urlParams.pack != undefined) {
        if(baseURL != urlParams.pack) {
            changes = false;
        }
        baseURL = urlParams.pack;
    }
    console.log("FETCHING PACK: "+baseURL);
    getPackJSON(baseURL).then(pack => applyPack(pack, !changes).then(onLoad)).catch(error => {
        console.log("Error Loading. Is your pack.json in the directory specified?", error);
        console.log("LOADING DEFAULT INSTEAD");
        getPackJSON("examplePack/").then(pack => applyPack(pack, !changes).then(onLoad));
    });
});

window.addEventListener("beforeunload", function(e){
    saveChangesToLocalStorage();
});

let buffers;
let sketchInstance;
let currentPack;
let root;
let maskBuffer;
let elementLookupTable = {};
let addedElements = [];
let updateDraw = true;
let dragging = false;
let dragStart = {};

async function onLoad() {
    if(localStorage.getItem("changes") !== null && localStorage.getItem("packURL") == currentPack.URL) {
        await loadChanges(localStorage.getItem("changes"));
    }
    root.addNodesTo(document.getElementById("elements"));
    document.getElementById("canvas_container").style = `aspect-ratio:${currentPack.canvasWidth}/${currentPack.canvasHeight};`;
    sketchInstance = new p5(p => {
        p.preload = function() {
            root.preload(p);
        }
        p.setup = function() {
            p.angleMode(p.DEGREES);
            p.imageMode(p.CENTER);
            p.rectMode(p.CENTER);
            let c = p.createCanvas(currentPack.canvasWidth, currentPack.canvasHeight);
            c.removeAttribute("style");
            c.parent('canvas_container');
            buffers = new Buffers(p, currentPack.canvasWidth, currentPack.canvasHeight);
            root.setup(p);
            document.getElementsByClassName("controls_container").forEach(element => {
                element.style = `aspect-ratio:${currentPack.canvasWidth}/${currentPack.canvasHeight};`;
            });
            updateDraw = true;
        }
        p.draw = function() {
            if(updateDraw) {
                updateDraw = false;
                buffers.clear();
                root.render(buffers);
            }
            p.clear();
            p.image(buffers.get(0), p.width/2, p.height/2);
            if(dragging) {
                if(!p.mouseIsPressed) {
                    dragging = false;
                    //console.log("END DRAG", p.mouseX - dragStart.x, p.mouseY - dragStart.y);
                }
            }
            if(selectedElement == undefined) {
                p.cursor(p.ARROW);
            } else {
                if(selectedElement.getGlobalOrigin().y > buffers.height*0.75) {
                    document.getElementsByClassName("controls").forEach(element => {
                        element.style = "";
                    });
                } else {
                    document.getElementsByClassName("controls").forEach(element => {
                        element.style = "bottom:0;";
                    });
                }
                selectedElement.drawBoundingBox(p);
                if(selectedElement.isPointInBoundingBox({x: p.mouseX, y:p.mouseY}) && !document.getElementById("movement_controls").hidden) {
                    if(p.mouseIsPressed && !dragging) {
                        dragging = true;
                        dragStart = {x: p.mouseX, y:p.mouseY};
                        //console.log("START DRAG");
                    }
                }
            }
        }
    });
}
