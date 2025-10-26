class Option {
    constructor(name, icon) {
        this.name = name;
        this.icon = `<img class='icon' src='${icon}'>`;
        this.allowEdit = false;
        this.requiresConfirmation = false;
        this.properties = {};
        this.altIcons = {};
        this.defaultValues = {};
        this.onclick = function(e) {};
        this.getStyle = e => "";
    }
    icon(property, value, icon) {
        if(this.altIcons[property] == undefined) {
            this.altIcons[property] = {};
        }
        this.altIcons[property][value] = icon;
    }
    onclick(fun) {
        this.onclick = fun;
        return this;
    }
    property(name, value, split = false) {
        this.defaultValues[name] = value;
        this.defaultKey = name;
        if(split) {
            this.properties[name] = {
                display: value,
                saved: value
            };
        } else {
            this.properties[name] = value;
        }
        return this;
    }
    requireConfirmation() {
        this.requireConfirmation = true;
        return this;
    }
    style(fun) {
        this.getStyle = fun;
    }
    getIcon(property) {
        if(this.altIcons[property][this.properties[property]] != undefined) {
            return this.altIcons[property][this.properties[property]];
        }
        return this.icon;
    }
    getJSON() {
        return {};
    }
    getValue(name = undefined) {
        if(name == undefined) {
            return this.properties[name].display;
        }
        return this.properties.value.display;
    }
    applyJSON(json) {

    }
    clone() {
        return this;
    }
    revert() {
        Object.keys(this.properties).forEach(key => {
            if(this.properties[key] instanceof Object && Object.hasOwn(this.properties[key], "display")) {
                this.properties[key].display = this.properties[key].saved;
            }
        });
    }
    save() {
        Object.keys(this.properties).forEach(key => {
            if(this.properties[key] instanceof Object && Object.hasOwn(this.properties[key], "display")) {
                this.properties[key].saved = this.properties[key].display;
            }
        });
    }
}
const Transform = new Option("transform", "assets/move.png")
.property("value", new ConstrainedTransform(vec(0, 0)), true)
.property("increment", new Transform(vec(1, 1), vec(0.01, 0.01), 1))
.property("allowTranslation", true)
.property("allowRotation", true)
.property("allowScale", true)
.onclick(function(element) {
    hideControls();
    selectedElement = element;
    cancelButton(this);
    showMovementControls();
});
const HFlip = new Option("horizontalFlip", "assets/horizontal.png").property("value", 1)
.onclick(function(element) {
    element.setOptionValue("horizontalFlip", element.getOptionValue("horizontalFlip") * -1);
});
const VFlip = new Option("verticalFlip", "assets/vertical.png").property("value", 1)
.onclick(function(element) {
    element.setOptionValue("verticalFlip", element.getOptionValue("verticalFlip") * -1);
});
const Hide = new Option("hide", "assets/shown.png").property("value", false).altIcon("hidden", true, "assets/hidden.png")
.onclick(function(element) {
    updateDraw = true;
    element.setOptionValue("hide", !element.getOptionValue("hide"));
    this.innerHTML = element.getOption("Hide").getIcon();
});
const Clone = new Option("Clone", "assets/clone.png")
.onclick(function(element) {
    updateDraw = true;
    element.clone();
});
// function() {
//     this.style = "background-color:red;";
//     this.innerHTML = "<img class='icon' src='assets/check.png' style='filter:invert(1);'>";
//     this.onclick;
//     if(trashedButton != undefined) {
//         refreshTrashedButton();
//     }
//     trashedButton = this;
// }
const Remove = new Option("Remove", "assets/delete.png").requireConfirmation()
.onclick(function(element) {
    element.parent.removeChild(element);
    updateDraw = true;
});
const Clip = new Option("Clip", "assets/mask.png").property("value", false)
.onclick(function(element) {
    return function() {
        element.toggleClip();
        updateDraw = true;
    }
});
const RECOLOR_MODE = {
    TINT: 0,
    SHIFT: 1
};
const Colors = new Option("Colors", "assets/color-picker.png")
.property("mode", RECOLOR_MODE.TINT)
.property("palette", undefined)
.property("allowCustomColors", true)
.property("value", "white", true)
.style(function(element) {
    if(element.getDisplayColor() != "white") {
        return `background-color:${element.getDisplayColor()};`;
    }
    return "";
})
.onclick(function() {
    hideControls();
    selectedElement = element;
    cancelButton(this);
    if(element.controls.colors.mode == "tint") {
        showColorPalette();
    } else {
        showHueShift();
    }
});