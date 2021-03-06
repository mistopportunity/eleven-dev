import OptionGen from "./option-gen.js";

const XProp = {
    type: "number",
    get: ({self}) => {
        return self.sprite.x;
    },
    set: ({self},value) => {
        self.sprite.x = value;
    }
};
const YProp = {
    type: "number",
    get: ({self}) => {
        return self.sprite.y;
    },
    set: ({self},value) => {
        self.sprite.y = value;
    }
};

const ColorProp = {
    get: ({self}) => {
        return self.sprite.color
    },
    set: ({self},value) => {
        self.sprite.color = value;
    }
};

const GetBoolProp = (name,displayName) => {
    const data = {
        type: "checkbox",
        get: ({self}) => {
            return self.sprite[name];
        },
        set: ({self},value) => {
            self.sprite[name]= value;
        }
    };
    if(displayName) data.name = displayName;
    return data;
};

const SpriteDeleter = ({world,self}) => {
    const {sprite} = self; if(!sprite) return;
    world.spriteLayer.remove(sprite.ID);
};

const XYDefaults = `{"x":0,"y":0}`;
const XYProp = {x:XProp,y:YProp};

const LowestSize = 0.5;

const WidthProp = {
    type: "number",
    get: ({self}) => self.sprite.width,
    set: ({self},value) => {
        self.sprite.width = Math.max(value,LowestSize);
    }
};

const HeightProp = {
    type: "number",
    get: ({self}) => self.sprite.height,
    set: ({self},value) => {
        self.sprite.height = Math.max(value,LowestSize);
    }
};

const DirectionProp = OptionGen("direction",{
    "Up": 0, "Right": 1, "Down": 2, "Left": 3
});

const Shorthand = {
    XProp,YProp,SpriteDeleter,XYProp,
    ColorProp,GetBoolProp,XYDefaults,
    WidthProp,HeightProp,DirectionProp,
    OptionGen
};

export default Shorthand;
