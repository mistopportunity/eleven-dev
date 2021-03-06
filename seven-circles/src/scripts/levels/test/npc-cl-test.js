import {AddColorBackground,AddFireSprite} from "../helper.js";
import WaterFists from "../../../weapons/water-fists.js";

const {ResourceManager} = Eleven;

function NPCCLTest({world}) {
    world.setMap("test-chamber");
    const player = world.addPlayer(5.660714285714286,12.464285714285714);
    player.direction = "down";
    world.camera.padding = true;
    AddColorBackground(world,"black");

    AddFireSprite(world,"Red",7,11);
    AddFireSprite(world,"Red",9,12);

    player.setWeapon(WaterFists);
    
    //AddFireSprite(world,"Red",5,12);

    /*
    const {grid} = world;
    for(let i = 0;i<20;i++) {
        const {animationPlayer} = AddFireSprite(world,"Red",Math.floor(Math.random()*(grid.width-1)),Math.floor(Math.random()*(grid.height-1)));
        animationPlayer.rowOffset += Math.floor(animationPlayer.rows * Math.random());
    }*/

    //world.player.velocity = 15;

    const npc = world.addNPC(13,7,ResourceManager.getImage("the-watcher"),2,2);
    npc.zIndex = player.zIndex + 1;
    //npc.velocity = player.velocity;
    npc.x += Math.random() * 2;
    npc.y += Math.random() * 2;

    //player.showHitBox = true;
    npc.showHitBox = false;

    this.start = () => {
        (async () => {
            const {controller} = npc;
            let i = 0;
            while(true) {
                switch(i++%4) {
                    case 0: await controller.move(-5,0); break;
                    case 1: await controller.move(0,-5); break;
                    case 2: await controller.move(5,0); break;
                    case 3: await controller.move(0,5); break;
                }
            }
        })();
        return false;

    };
}
export default NPCCLTest;
