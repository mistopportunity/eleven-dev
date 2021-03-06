import DeserializeAsync from "./container/deserialize.js";
import Serialize from "./container/serialize.js";
import GetObject from "./objects.js";

const MapChanged = "map-changed";
const DecoratorChanged = "decorator-changed";

function SQContainer(world,isEditor = false) {
    const objects = new Object();
    Object.assign(this,{
        world: world,
        isEditor: isEditor,
        objects: objects,
        IDCounter: 0,
        map: null,
        decorator: null,
        eventHandlers: {},
        frozenEventBuffer: {},
        eventsFrozen: false
    });
    AddMapDecoratorProperties(this);
}

function AddMapDecoratorProperties(target) {
    let map = null, decorator = null;
    Object.defineProperties(target,{
        map: {
            get: () => map,
            set: value => {
                map = value;
                target.fireEvent(MapChanged,value);
                return value;
            }
        },
        decorator: {
            get: () => decorator,
            set: value => {
                decorator = value;
                target.fireEvent(DecoratorChanged,value);
                return value;
            }
        }
    });
}

SQContainer.prototype.freezeEvents = function() {
    this.eventsFrozen = true;
};
SQContainer.prototype.unfreezeEvents = function() {
    this.eventsFrozen = false;
    const {frozenEventBuffer} = this;

    for(const key in frozenEventBuffer) {
        this.fireEvent(key,frozenEventBuffer[key]);
        delete frozenEventBuffer[key];
    }
};
SQContainer.prototype.fireEvent = function(name,data) {
    if(this.eventsFrozen) {
        this.frozenEventBuffer[name] = data;
        return;
    }
    const handlers = this.eventHandlers[name];
    if(!handlers) return;
    for(const handler of handlers) handler(data);
};
SQContainer.prototype.on = function(eventName,handler) {
    let container = this.eventHandlers[eventName];
    if(!container) {
        container = new Array();
        this.eventHandlers[eventName] = container;
    }
    container.push(handler);
};
SQContainer.prototype.getID = function() {
    return this.IDCounter++;
};
SQContainer.prototype.export = function() {
    return Serialize(this);
};
SQContainer.prototype.import = async function(data) {
    this.freezeEvents();
    await DeserializeAsync(this,data);
    this.unfreezeEvents();
};
SQContainer.prototype.clear = function() {
    for(const ID in this.objects) {
        this.objects[ID].delete();
    }
    this.IDCounter = 0;
};
SQContainer.prototype.getObject = function(ID) {
    const object = this.objects[ID];
    return object ? object : null;
};
SQContainer.prototype.getObjects = function() {
    return Object.values(this.objects);
};
SQContainer.prototype.addObject = async function(name,data) {
    const object = GetObject(this,name);
    await object.loadFiles();
    object.create(data);
};
export default SQContainer;
