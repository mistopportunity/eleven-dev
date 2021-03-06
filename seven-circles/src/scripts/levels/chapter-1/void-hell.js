import {
    GetTransitionTrigger,
    MessageChain,
    GetSwitchDoors,
    SaveStone,
    AntiPlayer
} from "../helper.js";

const {ResourceManager,UVTCReflection} = Eleven;

function VoidHell({world,lastScript,saveState,lastMap,nextMap}) {
    world.setMap("c1-void");
    const {dispatchRenderer,grid,spriteFollower} = world;

    const reflector = UVTCReflection.getScrollable(grid,null,null,-0.5);
    dispatchRenderer.addBackground(reflector.clear);
    dispatchRenderer.addResize(reflector.resize);
    dispatchRenderer.addFinalize(reflector.render);

    if(lastScript === nextMap) {
        const player = world.addPlayer(45,6);
        player.direction = "left";
    } else {
        const player = world.addPlayer(0,6.5);
        player.direction = "right";
    }

    const saveStone = new SaveStone(world,38,7);

    const {player,camera,playerController} = world;

    const antiPlayer = new AntiPlayer(world,20,6.5,"left",()=>{
        world.say("We'll be in touch.");
    });
    const NPCController = antiPlayer.controller;

    camera.horizontalPadding = true;

    const makeANewFriend = async () => {
        if(saveState.get("void-hell-script")) return;
        saveState.set("void-hell-script",true);

        playerController.lock();

        await delay(1000);

        await world.say("Ah, yes, the prodigal daughter arrives.");

        await delay(1000);

        spriteFollower.disable();
        const startX = camera.x;
        const startY = camera.y;

        const startScale = camera.scale;

        await Promise.all([
            camera.moveTo(antiPlayer,1000),
            camera.zoomTo(startScale+4,1000)
        ]);
        spriteFollower.target = antiPlayer;
        spriteFollower.enable();

        await delay(1000);
        antiPlayer.direction = "down";
        await delay(1000);
        await world.say("You have no idea how lucky you are.")
        await delay(500);
        antiPlayer.direction = "left";
        await delay(500);

        await NPCController.move(-2.75);

        await delay(1000);

        await MessageChain(world,[
            "How dare you.",
            "Who do you think you are?",
            "Do you think you're brave?",
            "Do you think you're smart?",
            "Strong?",
            "Clever?",
            "We'll see.",
            "We'll all see."
        ]);

        spriteFollower.disable();

        await NPCController.move(2.75);
        await NPCController.move(0,-2);
        await delay(800);
        antiPlayer.direction = "down";

        await delay(800);

        await world.say("Go. Leave. Do what you think you're supposed to do.");

        await Promise.all([
            camera.zoomTo(startScale,800),
            camera.moveTo(startX,startY,800)
        ]);

        spriteFollower.target = player;
        spriteFollower.enable();
        playerController.unlock();
    };

    const switchDoors = GetSwitchDoors(world,[[42,5,"red",false]],[[40,4,"red"]]);
    this.interact = data => {
        if(data.value === 18) {
            world.sayNamed("I don't think everyone here wants to be your friend.","Mysterious Lamp","r");
        } else if(data.value === 16) {
            world.say(Math.random() > 0.5 ? "What are you looking at, punk?" : "Take a picture, it'll last longer.");
            return;
        }
        if(saveStone.tryInteract(data)) return;
        if(switchDoors.tryInteract(data)) return;
    };

    world.setTriggers([
        GetTransitionTrigger(world,1,lastMap,"left"),
        GetTransitionTrigger(world,2,nextMap,"right"),
        [3,makeANewFriend,true]
    ]);
}
export default VoidHell;
