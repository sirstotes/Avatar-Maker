function vec(x, y) {
    return {x:x, y:y};
}
class Transform {
    constructor(translation = vec(0, 0), scale = vec(1, 1), rotation = 0) {
        this.translation = translation;
        this.scale = scale;
        this.rotation = rotation;
    }
    getJSON() {
        const json = {};
        if(!(this.translation.x == 0 && this.translation.y == 0)) {
            json.translation = this.translation;
        }
        if(this.rotation != 0) {
            json.rotation = this.rotation;
        }
        if(!(this.scale.x == 1 && this.scale.y == 1)) {
            json.scale = this.scale;
        }
        return json;
    }
    apply(p) {
        if(p instanceof DOMMatrix) {
            p.rotateSelf(this.rotation);
            p.scaleSelf(this.scale.x, this.scale.y);
            p.translateSelf(this.translation.x, this.translation.y);
        } else {
            p.rotate(this.rotation);
            p.scale(this.scale.x, this.scale.y);
            p.translate(this.translation.x, this.translation.y);
        }
    }
    translate(x, y) {
        this.translation.x += x;
        this.translation.y += y;
    }
    addScale(x, y) {
        this.scale.x += x;
        this.scale.y += y;
    }
    rotate(r) {
        this.rotation += r;
    }
    getCopy() {
        return new Transform({x:this.translation.x, y:this.translation.y}, {x:this.scale.x, y:this.scale.y}, this.rotation);
    }
}
class ConstrainedTransform extends Transform {
    constructor(translation = vec(0, 0), scale = vec(1, 1), rotation = 0) {
        super(translation, scale, rotation);
        this.combineJSON = true;
    }
    getJSON() {
        const json = super.getJSON();
        // if(this.translationMax != undefined) {//I don't think there's a scenario where you can change the max and min transforms
        //     if(!json.hasOwnProperty("translation")) {json.translation = {};}
        //     json.translation.max = this.translationMax;
        // }
        // if(this.translationMin != undefined) {
        //     if(!json.hasOwnProperty("translation")) {json.translation = {};}
        //     json.translation.min = this.translationMin;
        // }
        // if(this.rotationMax != undefined) {
        //     if(!json.hasOwnProperty("rotation")) {json.rotation = {};}
        //     json.rotation.max = this.rotationMax;
        // }
        // if(this.rotationMin != undefined) {
        //     if(!json.hasOwnProperty("rotation")) {json.rotation = {};}
        //     json.rotation.min = this.rotationMin;
        // }
        // if(this.scaleMax != undefined) {
        //     if(!json.hasOwnProperty("scale")) {json.scale = {};}
        //     json.scale.max = this.scaleMax;
        // }
        // if(this.scaleMin != undefined) {
        //     if(!json.hasOwnProperty("scale")) {json.scale = {};}
        //     json.scale.min = this.scaleMin;
        // }
        return json;
    }
    translate(x, y) {
        super.translate(x, y);
        if(this.translationMax != undefined) {
            this.translation.x = Math.min(this.translation.x, this.translationMax.x);
            this.translation.y = Math.min(this.translation.y, this.translationMax.y);
        }
        if(this.translationMin != undefined) {
            this.translation.x = Math.max(this.translation.x, this.translationMin.x);
            this.translation.y = Math.max(this.translation.y, this.translationMin.y);
        }
    }
    addScale(x, y) {
        super.addScale(x, y);
        if(this.scaleMax != undefined) {
            this.scale.x = Math.min(this.scale.x, this.scaleMax.x);
            this.scale.y = Math.min(this.scale.y, this.scaleMax.y);
        }
        if(this.scaleMin != undefined) {
            this.scale.x = Math.max(this.scale.x, this.scaleMin.x);
            this.scale.y = Math.max(this.scale.y, this.scaleMin.y);
        }
    }
    rotate(r) {
        super.rotate(r);
        if(this.rotationMax != undefined) {
            this.rotation = Math.min(this.rotation, this.rotationMax);
        }
        if(this.rotationMin != undefined) {
            this.rotation = Math.max(this.rotation, this.rotationMin);
        }
    }
    getCopy() {
        const copy = new ConstrainedTransform({x:this.translation.x, y:this.translation.y}, {x:this.scale.x, y:this.scale.y}, this.rotation);
        copy.translationMax = this.translationMax;
        copy.translationMin = this.translationMin;
        copy.scaleMax = this.scaleMax;
        copy.scaleMin = this.scaleMin;
        copy.rotationMax = this.rotationMax;
        copy.rotationMin = this.rotationMin;
        return copy;
    }
}