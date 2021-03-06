import Constants from "../../constants.js";

const BACKGROUND_LAYER = 0;
const FOREGROUND_LAYER = 1;
const SUPER_FOREGROUND_LAYER = 2;
const COLLISION_LAYER = 3;
const INTERACTION_LAYER = 4;
const LIGHTING_LAYER = 5;

const LOG_CHANGES = Constants.LogTileUpdates;

const batchedLayers = {
    [LIGHTING_LAYER]: true,
    [COLLISION_LAYER]: true,
    [INTERACTION_LAYER]: true
};

function getTile(layer,x,y) {
    if(!this.tileRenderer) return null;
    return this.tileRenderer.getTile(x,y,layer);
}
function setTile(layer,x,y,value) {
    if(!this.tileRenderer) return;
    this.tileRenderer.setTile(x,y,value,layer);
    if(batchedLayers[layer]) return;
    switch(layer) {
        case BACKGROUND_LAYER:
        case FOREGROUND_LAYER:
            this.cacheBackgroundForeground({x,y});
            break;
        case SUPER_FOREGROUND_LAYER:
            this.cacheSuperForeground({x,y});
            break;
    }
}
function setCollisionTile(x,y,value) {
    this.setTile(COLLISION_LAYER,x,y,value);
    this.collisionChangePending = true;
}
function setInteractionTile(x,y,value) {
    this.setTile(INTERACTION_LAYER,x,y,value);
    this.interactionChangePending = true;
}
function setLightingTile(x,y,value) {
    this.setTile(LIGHTING_LAYER,x,y,value);
    this.lightingChangePending = true;
}
function pushCollisionChanges() {
    if(!this.collisionChangePending) return;

    this.tileCollision.reset();
    this.collisionChangePending = false;
    if(LOG_CHANGES) console.log("World performance: Tile collision layer reset!");
}
function pushInteractionChanges() {
    if(!this.interactionChangePending) return;

    this.interactionLayer.reset();
    this.interactionChangePending = false;
    if(LOG_CHANGES) console.log("World performance: Tile interaction layer reset!");
}
function pushLightingChanges() {
    if(!this.lightingChangePending) return;

    this.lightingLayer.refresh();
    this.lightingChangePending = false;
    if(LOG_CHANGES) console.log("World performance: Tile lighting layer refreshed!");
}
function pushTileChanges() {
    this.pushCollisionChanges();
    this.pushInteractionChanges();
    this.pushLightingChanges();
}
function getBackgroundTile(x,y) {
    return this.getTile(BACKGROUND_LAYER,x,y);
}
function setBackgroundTile(x,y,value) {
    this.setTile(BACKGROUND_LAYER,x,y,value);
}
function getForegroundTile(x,y) {
    return this.getTile(FOREGROUND_LAYER,x,y);
}
function setForegroundTile(x,y,value) {
    this.setTile(FOREGROUND_LAYER,x,y,value);
}
function getSuperForegroundTile(x,y) {
    return this.getTile(SUPER_FOREGROUND_LAYER,x,y);
}
function setSuperForegroundTile(x,y,value) {
    this.setTile(SUPER_FOREGROUND_LAYER,x,y,value);
}
function getCollisionTile(x,y) {
    return this.getTile(COLLISION_LAYER,x,y);
}
function getInteractionTile(x,y) {
    return this.getTile(INTERACTION_LAYER,x,y);
}
function getLightingTile(x,y) {
    return this.getTile(LIGHTING_LAYER,x,y);
}

function stamp(x,y,tileID,width,height,layer) {
    const {textureColumns,textureRows} = this.tileRenderer;
    for(let stampX = 0;stampX < width;stampX++) {
        for(let stampY = 0;stampY < height;stampY++) {
            const value = tileID + stampX + textureRows * stampY;
            this.setTile(layer,stampX+x,stampY+y,value);
        }
    }
}
function stampForeground(x,y,tileID,width,height) {
    stamp.call(this,x,y,tileID,width,height,FOREGROUND_LAYER);
}
function stampBackground() {
    stamp.call(this,x,y,tileID,width,height,BACKGROUND_LAYER);
}

export default {
    getLightingTile, getInteractionTile, getCollisionTile,
    setSuperForegroundTile, getSuperForegroundTile,
    setForegroundTile, getForegroundTile, setBackgroundTile, getBackgroundTile,
    pushTileChanges, pushLightingChanges, pushInteractionChanges, pushCollisionChanges,
    getTile, setTile, setLightingTile, setInteractionTile, setCollisionTile,
    stampForeground, stampBackground
};
