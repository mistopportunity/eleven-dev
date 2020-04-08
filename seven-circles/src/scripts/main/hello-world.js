import Lifetime from "../helper/lifetime.js";

const BACKGROUND_COLOR = `rgb(20,0,0)`;

const START_POSITION = {x:7,y:24.5,direction:0};

function HelloWorld(world,oldData) {

    if(oldData) {
        console.log("Serialization data:",oldData);
    }

    this.serialize = () => {
        return {NothingToSeeHere:"Move along"};
    };

    const {
        resumePosition
    } = Lifetime;

    world.setMap("hell");
    const player = world.addPlayer();

    resumePosition(player,START_POSITION);
    /*

    world.addTextSprite({
        world: world,
        text: "They can go anywhere!\n(And support multiple lines)",
        color: "white",
        center: true,
        x: player.x, y: player.y
    });
    
    world.addTextSprite({
        world: world,
        text: "The world can now have text sprites!",
        target: player,
        color: "white",
        y: -0.7,
        backgroundPadding: 2,
        backgroundColor: "black"
    });
    */

    world.dispatchRenderer.addBackground((context,{width,height})=>{
        context.fillStyle = BACKGROUND_COLOR;
        context.fillRect(0,0,width,height);
    });

    /*
    const {ParticleSystem} = Eleven;

    const emitterPool = ParticleSystem.getRainbowPool();

    world.addParticles(START_POSITION.x + 0.5,START_POSITION.y + 0.5,emitterPool);
    emitterPool.stream();


    (async()=>{
        const fader = world.whiteFader();
        await fader.fadeOut(1000);
        await fader.reverse();
        console.log("Done!"); world.removeFader(fader);
    })();

    */

    world.setTriggerHandlers([
        [2,firstTime=>console.log("2 triggered",firstTime)],
        [5,firstTime=>console.log("5 triggered",firstTime)],
    ]);

    this.load = () => {
        Lifetime.hardSerialize(player);
    };

    //world.fadeToWhite(1000).then(world.popFader);
}
export default HelloWorld;