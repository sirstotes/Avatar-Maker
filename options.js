class Option {
    constructor(element, name, icon) {
        this.element = element;
        this.name = name;
        this.icon = `<img class='icon' src='${icon}'>`;
        this.allowEdit = false;
        this.requiresConfirmation = false;
        this.shouldSave = {};
        this.properties = {};
        this.altIcons = {};
        this.defaultValues = {};
        this.onclick = function(element, button) {};
        this.getStyle = e => "";
    }
    addIcon(property, value, icon) {
        if(this.altIcons[property] == undefined) {
            this.altIcons[property] = {};
        }
        this.altIcons[property][value] = `<img class='icon' src='${icon}'>`;
        return this;
    }
    click(func) {
        this.onclick = func;
        return this;
    }
    property(name, value, o = {}) {
        let options = Object.assign({split: false, save:true}, o);
        this.defaultValues[name] = value;
        this.defaultKey = name;
        if(options.split) {
            this.properties[name] = {
                display: value,
                saved: value
            };
        } else {
            this.properties[name] = value;
        }
        this.shouldSave[name] = options.save;
        return this;
    }
    randomFunction(func) {
        this.randomValue = func;
        return this;
    }
    requireConfirmation() {
        this.requiresConfirmation = true;
        return this;
    }
    style(fun) {
        this.getStyle = fun;
        return this;
    }

    isDefault() {
        for(let i = 0; i < Object.keys(this.properties).length; i ++) {
            let key = Object.keys(this.properties)[i];
            if(this.getValue(key) != this.defaultValues[key]) {
                return false;
            }
        }
        return true;
    }
    getIcon(property = "value") {
        if(Object.hasOwn(this.altIcons, property) && this.altIcons[property][this.properties[property]] != undefined) {
            return this.altIcons[property][this.properties[property]];
        }
        return this.icon;
    }
    getJSON(all = false) {
        let json = {};
        Object.keys(this.properties).forEach(key => {
            if(all || (this.getValue(key) != this.defaultValues[key] && this.shouldSave[key])) {
                let val = this.getValue(key);
                console.log(key, val);
                if(val != undefined && typeof val.getJSON == "function") {
                    if(val.combineJSON) {
                        Object.assign(json, val.getJSON());
                    } else {
                        json[key] = val.getJSON();
                    }
                } else {
                    json[key] = this.getValue(key);
                }
            }
        });
        return json;
    }
    getOnclick(element, button) {
        let thisInstance = this;
        if(this.requiresConfirmation) {
            return function() {
                button.style = "background-color:red;";
                button.innerHTML = "<img class='icon' src='assets/check.png' style='filter:invert(1);'>";
                button.onclick = function() {
                    thisInstance.onclick(element, button);
                };
                if(trashedButton != undefined) {
                    refreshTrashedButton();
                }
                trashedButton = button;
            }
        }
        return function() {
            thisInstance.onclick(element, button);
        }
    }
    getValue(name = "value") {
        let prop = this.properties[name];
        
        if(prop != undefined && Object.hasOwn(prop, "display")) {
            return prop.display;
        }
        return prop;
    }
    hasDefinedProperty(property) {
        return Object.hasOwn(this.properties, property) && this.properties[property] != undefined;
    }

    applyJSON(json) {
        if(typeof json === "boolean") {
            this.allowEdit = json;
        } else if(json instanceof Object) {
            if(!Object.hasOwn(json, "allowEdit")) {
                this.allowEdit = true;
            }
            Object.keys(json).forEach(key => {
                if(key == "default") {
                    this.defaultValues["value"] = json[key];
                    this.setValue("value", json[key]);
                } else if(key == "copy") {
                    if(Object.hasOwn(elementLookupTable, json[key])) {
                        this.element.replaceOptionReference(this.name, elementLookupTable[json[key]].getOption(this.name));
                    } else {
                        console.error(`Tried to copy option from unknown element ${json[key]}`);
                    }
                } else if(Object.hasOwn(this.properties, key)) {
                    this.setValue(key, json[key]);
                } else if(Object.hasOwn(this, key)) {
                    this[key] = json[key];
                } else {
                    console.error(`Unknown key '${key}' given for option '${this.name}'`);
                }
            });
        }
    }
    clone() {
        return this;
    }
    randomValue(property) {
        // let type = typeof this.defaultValues[this.property];
        // if(type === "boolean") {
        //     return Math.random() >= 0.5;
        // } else if(type == "number") {
        //     return Math.random();
        // } else {
            console.error(`Unable to generate a random value for property ${this.name}:${property}`);
        // }
    }
    revert() {
        Object.keys(this.properties).forEach(key => {
            if(this.properties[key] instanceof Object && Object.hasOwn(this.properties[key], "display")) {
                if(typeof this.properties[key].saved.getCopy == "function") {
                    this.properties[key].display = this.properties[key].saved.getCopy();
                } else {
                    this.properties[key].display = this.properties[key].saved;
                }
            }
        });
    }
    save() {
        Object.keys(this.properties).forEach(key => {
            if(this.properties[key] instanceof Object && Object.hasOwn(this.properties[key], "display")) {
                if(typeof this.properties[key].display.getCopy == "function") {
                    this.properties[key].saved = this.properties[key].display.getCopy();
                } else {
                    this.properties[key].saved = this.properties[key].display;
                }
            }
        });
    }
    setValue(property = "value", value, all = false) {
        if(!Object.hasOwn(this.properties, property)) {
            console.error(`Tried to set unknown property ${this.name}:${property}`);
            return;
        }

        if(value instanceof Object && Object.hasOwn(value, "copy")) {
            if(Object.hasOwn(elementLookupTable, value.copy)) {
                value = elementLookupTable[value.copy].get(this.name, property);
            } else {
                console.error(`Tried to copy property ${this.name}:${property} from unknown element ${json[key]}`);
            }
        } else if (value == "random") {
            value = this.randomValue(property);
            all = true;
        }

        if(this.properties[property] != undefined && Object.hasOwn(this.properties[property], "display")) {
            this.properties[property].display = value;
            if(all) {
                this.properties[property].saved = value;
            }
        } else {
            this.properties[property] = value;
        }
    }
}
class TransformOption extends Option {
    applyJSON(json) {
        let transformationTypes = ["translation", "rotation", "scale"];
        transformationTypes.forEach(transformationType => {
            let capitalized = "allow"+(transformationType[0].toUpperCase() + transformationType.slice(1));
            if(json.hasOwnProperty(transformationType)) {
                if(json[transformationType].hasOwnProperty("x") || json[transformationType].hasOwnProperty("r")) {
                    this.getValue()[transformationType] = json[transformationType];
                } else {
                    if(json[transformationType].hasOwnProperty("default")) {
                        this.getValue()[transformationType] = json[transformationType].default;
                    }
                    if(json[transformationType].hasOwnProperty("min")) {
                        this.getValue()[transformationType+"Min"] = json[transformationType].min;
                    }
                    if(json[transformationType].hasOwnProperty("max")) {
                        this.getValue()[transformationType+"Max"] = json[transformationType].max;
                    }
                    if(json[transformationType].hasOwnProperty("increment")) {
                        this.getValue("increment")[transformationType] = json[transformationType].increment;
                    }
                    if(json[transformationType].hasOwnProperty("allowEdit")) {
                        this.setValue(capitalized, json[transformationType].allowEdit);
                    }
                }
            }
            if(json.hasOwnProperty(capitalized)) {
                this.setValue(capitalized, json[capitalized]);
            }
        });
        if(json.hasOwnProperty("allowEdit")) {
            this.allowEdit = json.allowEdit;
        }
        this.save();
    }
}