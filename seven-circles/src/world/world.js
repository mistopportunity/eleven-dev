import CollisionMaker from "./collision-maker.js";
import Constants from "../constants.js";
import ScriptBook from "../scripts/script-book.js";
import ZIndexBook from "./z-indices.js";
import FaderList from "./fader-list.js";
import GetDecorator from "../dynamic-map/get-decorator.js";
import Decorators from "../dynamic-map/decorators.js";
import SQContainer from "../sequence/sq-container.js";

import FadeTransition from "../scripts/helper/other/fade-transition.js";
import Lifetime from "../scripts/lifetime.js";
import LevelChain from "../scripts/level-chain.js";

import FadeMe from "./extensions/fade-me.js";
import ItemHelper from "./extensions/item-helper.js";
import Messaging from "./extensions/messaging.js";
import Particles from "./extensions/particles.js";
import SpatialSound from "./extensions/spatial-sound.js";
import Sprites from "./extensions/sprites.js";
import TileEditor from "./extensions/tile-editor.js";
import TriggerHandler from "./extensions/trigger-handler.js";
import InputProxy from "./extensions/input-proxy.js";
import PlayerRadio from "./extensions/player-radio.js";

const WORLD_EXTENSIONS = [
    FadeMe,
    ItemHelper,
    Messaging,
    Particles,
    SpatialSound,
    Sprites,
    TileEditor,
    TriggerHandler,
    InputProxy,
    PlayerRadio
];

const {
    CanvasManager,
    ResourceManager,
    Grid2D,
    SpriteLayer,
    SpriteFollower,
    UVTCLighting,
    DispatchRenderer,
    TileCollision
} = Eleven;

const BASE_TILE_SIZE = 16;
const DEFAULT_CAMERA_SCALE = Constants.DefaultCameraScale;

const BACKGROUND_LAYER = 0;
const SUPER_FOREGROUND_LAYER = 2;
const COLLISION_LAYER = 3;
const INTERACTION_LAYER = 4;
const LIGHTING_LAYER = 5;

const TILESET_NAME = "world-tileset";
const MAPS_NAME = "maps";
const IMAGE_MAPS_FOLDER = "maps";

const NO_LIGHTING_FILL = [1,1,1,1,1,0];

const BAD_SCRIPT = () => {
    console.warn("Bad script! The script object is not a constructor (Check for script book warnings?)");
};
const LEVEL_CHANGE_IN_PROGRESS = () => {
    throw Error("A level is already being set. You cannot set levels in a nested pattern!");
};
const ILLEGAL_SCRIPT_METHOD = () => {
    throw Error("This method is only for use during the initial script sequencing!");
};
const MISSING_DECORATOR = decoratorName => {
    console.warn(`Unknown decorator '${decoratorName}'!`);
};

function World(callback) {
    const {Inventory,SaveState} = SVCC.Runtime;
    this.inventory = Inventory;
    this.saveState = SaveState;
    this.lifetime = Lifetime;

    this.messageLock = false;
    this.messageResolveStack = new Array();

    this.tileSize = BASE_TILE_SIZE;

    this.scriptData = null;
    this.inputDisabled = false;

    this.soundEffects = {};

    this.tileset = null, this.maps = null, this.defaultTileset = null;

    this.sqContainer = null;

    this.load = async () => {
        this.defaultTileset = ResourceManager.getImage(TILESET_NAME);

        this.tileset = this.defaultTileset;
        this.maps = ResourceManager.getJSON(MAPS_NAME);

        if(callback) await callback(this);
    };

    Object.defineProperties(this,{
        tilesetColumns: {
            get: () => this.tileset.width / BASE_TILE_SIZE,
            enumerable: true
        }
    });

    const {InputServer} = SVCC.Runtime;
    const managedGamepad = InputServer.managedGamepad;
    const {keyBind} = InputServer;

    this.inputGamepad = managedGamepad.poll;

    this.managedGamepad = managedGamepad;
    this.keyBind = keyBind;

    const grid = new Grid2D(BASE_TILE_SIZE);
    const camera = grid.camera;

    this.grid = grid;
    this.camera = camera;

    this.spriteFollower = new SpriteFollower(camera,null,false);

    this.script = null; this.scriptData = null;

    const dispatchRenderer = new DispatchRenderer();
    this.dispatchRenderer = dispatchRenderer;
    const faderList = new FaderList(dispatchRenderer);
    this.faderList = faderList;
    this.clearFaders = faderList.clear;
    this.popFader = faderList.pop;

    this.tileRenderer = null;
    this.directionalMessage = null;

    this.lightingLayer = null;
    this.tileCollision = null;
    this.interactionLayer = null;
    this.collisionLayer = null;
    this.spriteLayer = null;
    this.highSpriteLayer = null;
    this.pendingScriptData = null;

    this.playerController = null;
    this.player = null;
    this.playerImpulse = null;
    this.keyDown = null;
    this.keyUp = null;

    this.lastScript = null;

    this.textMessage = null;
    this.textMessageStack = new Array();

    this.refreshInput = null;

    this.collisionChangePending = false;
    this.interactionChangePending = false;
    this.lightingChangePending = false;

    grid.bindToFrame(this);
    this.resize = data => {
        data.context.imageSmoothingEnabled = false;
        grid.resize(data);
    };
}

const cache = (world,layerCount,layerStart,isTop,location) => {
    const {grid, tileRenderer, dispatchRenderer} = world;

    const cacheMethod = isTop ? grid.cacheTop : grid.cache;
    grid.renderer = tileRenderer;

    tileRenderer.setLayerRange(layerStart,layerCount);

    if(location) {
        cacheMethod.call(grid,location.x,location.y,1,1);
    } else {
        cacheMethod.call(grid);
    }

    grid.renderer = dispatchRenderer;
};
const installMapLayers = (world,customTileCollision,disableLighting) => {
    const {grid, tileRenderer, dispatchRenderer} = world;

    world.lightingLayer = disableLighting ? null : new UVTCLighting(
        grid,tileRenderer,LIGHTING_LAYER
    );

    world.tileCollision = customTileCollision ? customTileCollision : new TileCollision(
        grid,tileRenderer,COLLISION_LAYER,CollisionMaker
    );

    world.interactionLayer = new TileCollision(
        grid,tileRenderer,INTERACTION_LAYER
    );

    world.spriteLayer = new SpriteLayer(world.grid);
    world.highSpriteLayer = new SpriteLayer(world.grid);
    world.collisionLayer = world.spriteLayer.getCollisionLayer();

    dispatchRenderer.addUpdate(world.collisionLayer.update);
    dispatchRenderer.addUpdate(world.spriteLayer.update);

    dispatchRenderer.addRender(world.spriteLayer.render);
    if(world.lightingLayer && world.lightingLayer.hasLighting) {
        dispatchRenderer.addRender(world.lightingLayer.render);
    }

    const highSpriteZIndex = ZIndexBook.HighSpriteLayer;
    dispatchRenderer.addFinalize(
        world.highSpriteLayer.update,highSpriteZIndex
    );
    dispatchRenderer.addFinalize(
        world.highSpriteLayer.render,highSpriteZIndex
    );
};
const hasSuperForeground = tileRenderer => {
    const superForeground = tileRenderer.readLayer(SUPER_FOREGROUND_LAYER);

    for(let i = 0;i<superForeground.length;i++) {
        if(superForeground[i] >= 1) return true;
    }
    return false;
};
const unloadScript = world => {
    const {script} = world;
    if(script && script.unload) script.unload();
    world.script = null;
};
World.prototype.unload = function() {
    unloadScript(this);
}

World.prototype.cacheBackgroundForeground = function(location) {
    cache(this,2,BACKGROUND_LAYER,false,location);
}
World.prototype.cacheSuperForeground = function(location) {
    cache(this,1,SUPER_FOREGROUND_LAYER,true,location);
}
World.prototype.disableSuperForeground = function() {
    this.grid.decacheTop();
}
World.prototype.whoAmI = function() {
    console.log(`The level you are currently on is most likely named '${world.script.constructor.name}'.`);
}
World.prototype.setLevel = async function(script,data,runStartScript=true) {
    if(this.pendingScriptData) LEVEL_CHANGE_IN_PROGRESS();

    if(!data) data = new Object();

    if(this.script) {
        data.lastScript = this.script.constructor.name;
    } else {
        if(!data.lastScript) data.lastScript = null;
    }
    this.lastScript = data.lastScript;

    if(data.fromFade && this.playerController) {
        this.inputCopyState = this.playerController.getInputHandler().copyState();
    }

    let scriptName = null;
    if(script === null || typeof script === "string") {
        scriptName = script;
        script = ScriptBook.Get(script);
    } else {
        scriptName = script.name;
    }
    if(typeof script !== "function") {
        BAD_SCRIPT();
        const fallbackMap = Constants.ErrorLevel;
        script = ScriptBook.Get(fallbackMap);
        scriptName = fallbackMap;
    }

    const processPauseSequencing = CanvasManager.frame && !CanvasManager.paused;

    if(processPauseSequencing) {
        CanvasManager.markLoading();
        CanvasManager.paused = true;
    }

    unloadScript(this);

    //This is so the script lifetime can figure out what script called the lifetime request
    this.script = script;

    this.pendingScriptData = new Object();

    //So each script doesn't require their own import copies
    data.inventory = this.inventory;
    data.saveState = this.saveState;
    data.lifetime = Lifetime;

    const lastMap = LevelChain.getLast(scriptName);
    const nextMap = LevelChain.getNext(scriptName);

    data.lastMap = lastMap;
    data.nextMap = nextMap;
    data.currentMap = scriptName;
    data.fromNextMap = data.lastScript === data.nextMap;
    data.fromLastMap = data.lastScript === data.lastMap;
    data.world = this;

    this.scriptData = data;

    if(script.sqContainer) {
        await this.loadSQLevel(script.sqContainer);
    }

    script = new script(data); this.script = script;

    if(this.playerController) this.playerController.lock();

    Object.assign(this.script,this.pendingScriptData);
    this.pendingScriptData = null;

    if(script.load) await script.load();
    await this.trySongPreload(scriptName);
    await this.playScriptSong(scriptName);

    this.pushTileChanges(); this.dispatchRenderer.resize();

    if(processPauseSequencing) {
        CanvasManager.markLoaded();
        CanvasManager.paused = false;
    }

    if(this.inputCopyState && this.playerController) {
        this.playerController.getInputHandler().setState(this.inputCopyState);
    }
    Object.values(CanvasManager.downKeys).forEach(key => {
        const proxyEvent = Object.assign({},key); proxyEvent.repeat = false;
        if(this.keyDown) this.keyDown(proxyEvent);
    });

    this.inputCopyState = null;

    if(runStartScript) this.startScript();
}
World.prototype.startScript = function() {
    //If the value returned from script.start is truthy, the player controller is not automatically unlocked.
    const {script} = this;
    let startLocked = false;
    if(script.start) {
        startLocked = script.start();
    }
    if(!startLocked && this.playerController) {
        this.playerController.unlock();
    }
}
World.prototype.transitionNext = function(data,fadeTime) {
    this.transition(this.scriptData.nextMap,data,fadeTime);
}
World.prototype.transitionLast = function(data,fadeTime) {
    this.transition(this.scriptData.lastMap,data,fadeTime);
}
World.prototype.transition = function(script,data,fadeTime) {
    FadeTransition(this,script,data,fadeTime);
}
World.prototype.transitionSelf = function(data,fadeTime) {
    this.transition(this.scriptData.currentMap,data,fadeTime);
}
World.prototype.disableInput = function() {
    this.inputDisabled = true;
}
World.prototype.enableInput = function() {
    this.inputDisabled = false;
}

World.prototype.reset = function() {
    this.validateParseOnlyMethod();

    this.player = null;
    this.playerController = null;
    this.playerImpulse = null;

    this.refreshInput = null;
    this.managedGamepad.keyDown = null;
    this.managedGamepad.keyUp = null;
    this.keyDown = null;
    this.keyUp = null;
    this.inputDisabled = false;

    this.spriteFollower.reset();

    this.clearMessages();

    this.grid.decache();
    this.grid.decacheTop();
    
    this.camera.reset();
    this.camera.scale = DEFAULT_CAMERA_SCALE;

    this.dispatchRenderer.clear();
    this.faderList.reload();

    this.lightingChangePending = false;
    this.collisionChangePending = false;
    this.interactionChangePending = false;
}
World.prototype.getGridTileRenderer = function(mapName) {
    return this.grid.getTileRenderer({
        tileset: this.tileset,
        setRenderer: false, setSize: true,
        map: this.maps[mapName],
        uvtcDecoding: true,
        fillEmpty: NO_LIGHTING_FILL
    });
};
World.prototype.getImageTileRenderer = function(
    image,decorator,tileMap
) {
    const decoratorData = decorator(image);
    image = decoratorData.image;

    const tileCollision = decoratorData.tileCollision;
    const cacheRenderer = this.grid.drawCache.bind(
        null,{data:{buffer:image}}
    );
    this.dispatchRenderer.addBackground(cacheRenderer,1);

    if(tileMap) return {
        tileCollision, tileRenderer: this.getGridTileRenderer(tileMap)
    };

    const tileRenderer = this.grid.getTileRenderer({
        tileset: this.tileset,
        skipZero: true,
        setRenderer: false, setSize: true,
        width: Math.ceil(image.width / this.tileSize),
        height: Math.ceil(image.height / this.tileSize),
        uvtcDecoding: false
    });

    return {tileRenderer,tileCollision,doNotCache: true};
};
World.prototype.setMap = function(mapName,data) {
    this.validateParseOnlyMethod();
    this.reset();

    if(!data) data = {dynamic:false};
    let {tileset,tileMap,dynamic,decorator} = data;
    if(tileset) {
        this.tileset = tileset;
    } else {
        this.tileset = this.defaultTileset;
    }

    let tileRenderer, tileCollision;
    let doCache = true;
    if(dynamic) {
        const data = this.getImageTileRenderer(
            mapName,decorator,tileMap
        );
        tileRenderer = data.tileRenderer;
        if(data.tileCollision) {
            tileCollision = data.tileCollision;
        }
        if(data.doNotCache) doCache = false;
    } else {
        tileRenderer = this.getGridTileRenderer(mapName);
    }

    tileRenderer.paused = true;
    this.tileRenderer = tileRenderer;

    installMapLayers(this,tileCollision,!doCache);

    if(!doCache) {
        this.grid.renderer = this.dispatchRenderer;
        return;
    }

    this.cacheBackgroundForeground();
    if(hasSuperForeground(tileRenderer)) {
        this.cacheSuperForeground();
    }
};
World.prototype.setDynamicMap = async function(image,decoratorName) {
    if(!decoratorName) decoratorName = "none";
    let operations = Decorators[decoratorName];
    if(!operations) {
        MISSING_DECORATOR(decoratorName);
        operations = Decorators.none;
    }
    operations = operations({
        world: this,
        image: this.defaultTileset
    });
    const decorator = GetDecorator(operations);
    this.setMap(image,{dynamic:true,decorator});
};
World.prototype.loadSQLevel = async function(containerName) {
    const file = `sq-containers/${containerName}`;
    await ResourceManager.queueJSON(file + ".json").load();
    if(!ResourceManager.hasJSON(file)) {
        throw Error(`SQ container for map '${containerName}' not found!`);
    }

    const data = ResourceManager.getJSON(file);
    const mapName = data.map;
    if(!mapName) {
        throw Error("SQ container does not contain a map!");
    }

    const imageFile = `${IMAGE_MAPS_FOLDER}/${mapName}`;
    await ResourceManager.queueImage(imageFile + ".png").load();
    const image = ResourceManager.getImage(imageFile);
    if(!image) {
        throw Error("SQ map image not found!");
    }

    const decoratorName = data.decorator;
    this.setDynamicMap(image,decoratorName);

    const sqContainer = new SQContainer(this);
    await sqContainer.import(data);

    this.sqContainer = sqContainer;
};
World.prototype.validateParseOnlyMethod = function() {
    if(this.pendingScriptData !== null) return; ILLEGAL_SCRIPT_METHOD();
};
World.prototype.getTextureXY = function(tileID,premultiply=true) {
    const {tilesetColumns} = this;
    let textureColumn = tileID % tilesetColumns;
    let textureRow = Math.floor(tileID / tilesetColumns);
    if(premultiply) {
        textureColumn *= this.tileSize;
        textureRow *= this.tileSize;
    }
    return [textureColumn,textureRow];
}

const installExtension = function(extension) {
    Object.entries(extension).forEach(([name,value])=>{
        World.prototype[name] = value;
    });
}
WORLD_EXTENSIONS.forEach(installExtension);

export default World;
