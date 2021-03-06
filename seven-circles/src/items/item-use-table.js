import Pickup from "./scripts/pickup.js";
import Present from "./scripts/present.js";
import {BigPill,SmallPill,SpeedPill} from "./scripts/pills.js";
import Key from "./scripts/key.js";
import GetWeaponItem from "./scripts/weapon-item.js";
import Blaster from "../weapons/generic-blaster.js";
import Bomb from "../weapons/bomb-weapon.js";
import Shotgun from "../weapons/shotgun.js";

function Impulse() {
    this.retain = true;
    this.action = ({world}) => {
        if(world.playerController && world.playerController.locked) {
            world.playerController.unlock();
        }
        return world.playerImpulse.impulse();
    };
}

const ItemUseTable = {
    "elf-rock": [Pickup,27,"elf-rock"],
    "rock": [Pickup,28,"rock"],
    "sink": [Pickup,29,"sink"],
    "present": [Present,30],
    "big-pill": BigPill,
    "small-pill": SmallPill,
    "blaster": [GetWeaponItem(Blaster)],

    "red-key": [Key,"red"],
    "blue-key": [Key,"blue"],
    "yellow-key": [Key,"yellow"],
    "green-key": [Key,"green"],
    "pink-key": [Key,"pink"],
    "white-key": [Key,"white"],
    "ice-key": [Key,"ice"],
    "chocolate-key": [Key,"chocolate"],

    "bomb": [GetWeaponItem(Bomb)],
    "speed-pill": SpeedPill,
    "shotgun": [GetWeaponItem(Shotgun)],

    /* Impulse passthroughs... */
    "chocolate-milk": Impulse,
    "warp-crystal": Impulse,
    "power-cell": Impulse,
    "blueprint-fragment": Impulse,
    "fissure-token": Impulse,
    "cleaver": Impulse,
    "bridge-piece": Impulse
};

Object.entries(ItemUseTable).forEach(([key,values])=>{
    let useObject;
    if(Array.isArray(values)) {
        const sourceObject = values.shift();
        useObject = new sourceObject(...values);
    } else {
        useObject = new values();
    }
    ItemUseTable[key] = useObject;
});

Object.freeze(ItemUseTable);

export default ItemUseTable;
