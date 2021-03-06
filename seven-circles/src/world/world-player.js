import InputCodes from "../user-interface/input-codes.js";
import Constants from "../constants.js";

const TRIGGER_TILES = Constants.TriggerTiles;

const {PlayerController,WorldImpulse} = Eleven;

function GetInteractivePlayerController(world,sprite) {
    const {collisionLayer,tileCollision,interactionLayer,grid} = world;

    const playerController = new PlayerController(
        grid,sprite,collisionLayer,tileCollision
    );
    playerController.triggerHandler = sprite => {
        const {script} = world; if(!script) return;
        const {trigger,noTrigger} = script;
        if(!trigger && !noTrigger) return;

        const result = interactionLayer.collides(sprite);

        if(!result || result.value > TRIGGER_TILES) {
            if(noTrigger) noTrigger();
        } else {
            if(trigger) trigger(result.value);
        }
    };

    const input = playerController.getInputHandler({
        [InputCodes.Down]: "down", [InputCodes.Right]: "right",
        [InputCodes.Up]: "up", [InputCodes.Left]: "left"
    });
    world.refreshInput = input.refresh;

    const {Inventory} = SVCC.Runtime;

    const playerImpulse = new WorldImpulse(sprite,collisionLayer,interactionLayer);
    playerImpulse.layerHandler = sprite => {
        if(sprite.isHitBox) sprite = sprite.target;
        const hasImpulse = sprite.interact;
        if(hasImpulse) {
            const impulseData = {
                source: playerImpulse.source,
                world,script: world.script,
                self: sprite, inventory: Inventory
            };
            sprite.interact(impulseData);
        }
    };
    playerImpulse.tileHandler = tile => {
        if(tile <= TRIGGER_TILES) return;
        if(!world.script || !world.script.interact) return;
        world.script.interact(tile);
    };
    world.playerImpulse = playerImpulse;
    world.spriteFollower.target = sprite;
    world.spriteFollower.enabled = true;

    const canSendNonDirectionalInput = () => !world.inputDisabled;

    let keyUp, keyDown;

    const tryOpenMenu = (event,target) => {
        if(!canSendNonDirectionalInput()) return;
        if(event.repeat) return;
        if(playerController.locked) {
            if(!world.canAdvanceMessage()) return;
            world.advanceMessage();
        } else {
            playerController.locked = true;
            world.refreshInput = null;
            target(keyDown,keyUp,data=>{
                if(data && data.refreshInput) input.refresh();
                if(!world.canAdvanceMessage() && !world.directionalMessage) {
                    playerController.locked = false;
                }
                world.refreshInput = input.refresh;
            });
        }
    };

    const processClick = event => {
        if(!canSendNonDirectionalInput()) return;
        if(event.repeat) return;
        if(world.directionalMessage) {
            world.directionalMessage.accept();
        }
        if(world.canAdvanceMessage()) {
            world.advanceMessage();
        } else if(!playerController.locked) {
            if(sprite.hasWeapon()) {
                sprite.attack(); return;
            }
            playerImpulse.impulse();
        }
    };

    keyUp = input.keyUp;
    keyDown = event => {
        if(event.impulse === InputCodes.Click) {
            processClick(event);
        } else if(event.impulse === InputCodes.Inventory) {
            tryOpenMenu(event,Inventory.show);
        } else if(event.impulse === InputCodes.Exit) {
            tryOpenMenu(event,SVCC.Runtime.OpenPauseMenu);
        } else {
            if(world.directionalMessage) {
                world.directionalMessage.move(event);
            }
            input.keyDown(event);
        }
    };

    world.inputGamepad = world.managedGamepad.poll;
    world.managedGamepad.keyDown = keyDown;
    world.managedGamepad.keyUp = keyUp;

    world.keyDown = world.keyBind.impulse(keyDown);
    world.keyUp = world.keyBind.impulse(keyUp);

    return playerController;
}
export default GetInteractivePlayerController;
