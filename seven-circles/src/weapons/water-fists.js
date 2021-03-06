import ProjectileBase from "./projectile-base.js";
import AnimationPlayer from "../animation-player.js";

const NAME = "water-fists";

const PROJECTILE_Y_OFFSET = 0.2;
const PROJECTILE_FRAME_TIME = 80;
const PROJECTILE_IMPACT_SPEED_DAMPENING = 2;
const PROJECTILE_IMPACT_DECAY_TIME = 100;
const PROJECTILE_SIZE = 10 / 16;
const PROJECTILE_HORIZONTAL_OFFSET = 0.125;
const PROJECTILE_VELOCITY = 8;
const PROJECTILE_MAX_DISTANCE = 2;

const PARTICLE_DURATION = 100;

const PARTICLE_VELOCITY = 90;
const SPLASH_VELOCITY = 400;
const INNER_SPLASH_DISTANCE = 0.1;

const PARTICLE_SIZE = 8;
const PARTICLE_COUNT = 12;
const PARTICLE_POOL_COUNT = 3;

const WEAPON_FIRE_RATE = 125;
const LEFT_RIGHT_PARTICLE_OFFSET = 0.125;

const PARTICLE_COLORS = ["#7DD1E0AF","#8EECFFAF","rgba(255,255,255,0.1)"];

function WaterBlast(image,world,owner,x,y,terminate) {

    y += PROJECTILE_Y_OFFSET;

    const animationPlayer = new AnimationPlayer({
        frameTime: PROJECTILE_FRAME_TIME,looping: false,
        horizontal: false,image
    });

    const baseTerminate = terminate;
    let terminating = false;
    terminate = async () => {
        this.velocity /= PROJECTILE_IMPACT_SPEED_DAMPENING;
        terminating = true;
        await frameDelay(PROJECTILE_IMPACT_DECAY_TIME);
        baseTerminate();
    };

    const render = animationPlayer.render;

    const onCollision = (target,hitBox) => {
        if(terminating) return;
        let px, py, horizontalSplash;
        switch(this.direction) {
            case 0: //up
                horizontalSplash = true;
                px = this.x + this.width / 2;
                py = hitBox.y + hitBox.height - INNER_SPLASH_DISTANCE;
                break;
            case 1: //right
                horizontalSplash = false;
                py = this.y + this.height / 2;
                px = hitBox.x + INNER_SPLASH_DISTANCE;
                break;
            case 2: //down
                horizontalSplash = true;
                px = this.x + this.width / 2;
                py = hitBox.y + INNER_SPLASH_DISTANCE;
                break;
            case 3: //left
                horizontalSplash = false;
                py = this.y + this.height / 2;
                px = hitBox.x + hitBox.width - INNER_SPLASH_DISTANCE;
                break;
        }
        waterBurstEffect(world,px,py,horizontalSplash);
        if(target.extinguish) target.extinguish();
    };

    const width = PROJECTILE_SIZE;
    const height = width;

    switch(owner.direction) {
        case 1: x += PROJECTILE_HORIZONTAL_OFFSET; break;
        case 3: x -= PROJECTILE_HORIZONTAL_OFFSET; break;
    }

    ProjectileBase({
        x,y, target: this, world, owner,
        width,height,
        terminate,render,onCollision,
        velocity: PROJECTILE_VELOCITY,
        maxDistance: PROJECTILE_MAX_DISTANCE
    });
}

const {ParticleSystem} = Eleven;

const SUPER_PARTICLE_BASE = {
    duration: PARTICLE_DURATION,
    color: (() => {
        let colorIndex = 0;
        const colors = PARTICLE_COLORS;
        return () => colors[colorIndex++ % colors.length];
    })(),
    scale: t => 1 + t,
    size: PARTICLE_SIZE,
    count: PARTICLE_COUNT,
    xv: PARTICLE_VELOCITY,
    yv: PARTICLE_VELOCITY
};

const PARTICLE_BASE_X = ParticleSystem.getType(
    "Base",Object.assign(Object.assign(new Object(),SUPER_PARTICLE_BASE),{yv:SPLASH_VELOCITY})
);
const PARTICLE_BASE_Y = ParticleSystem.getType(
    "Base",Object.assign(Object.assign(new Object(),SUPER_PARTICLE_BASE),{xv:SPLASH_VELOCITY})
);

function waterBurstEffect(world,x,y,horizontalSplash) {
    const pool = ParticleSystem.getPool(
        horizontalSplash ? PARTICLE_BASE_Y : PARTICLE_BASE_X,PARTICLE_POOL_COUNT
    );
    const particleSprite = world.addParticles(x,y,pool);

    pool.fire(()=>{
        world.removeParticles(particleSprite);
    });
}

function WaterFists() {
    const image = Eleven.ResourceManager.getImage("weapon/water-fists");
    this.name = NAME;

    this.render = (context,x,y,width,height) => {
        const {directionMatrix, direction} = this.owner;
        const textureX = directionMatrix[direction];
        context.drawImage(
            image,textureX,0,16,16,x,y,width,height
        );
    };

    const waterImage = Eleven.ResourceManager.getImage("effects/water");

    let shotsFired = 0;
    const shoot = () => {
        shotsFired += 1;
        const {camX,camY,width,height} = this.owner;
        let x = camX + width / 2, y = camY + height / 2;

        let zIndex = this.owner.direction === 0 ? this.owner.zIndex - 1 : this.owner.zIndex;

        if(this.owner.direction % 2 === 0) {
            const polarity = shotsFired % 2 === 0 ? 1 : -1;
            x += LEFT_RIGHT_PARTICLE_OFFSET * polarity;
        }

        const projectileID = this.world.spriteLayer.add(
            new WaterBlast(waterImage,this.world,this.owner,x,y,()=>{
                this.world.spriteLayer.remove(projectileID);
            }),zIndex
        );
    };

    const fireRate = WEAPON_FIRE_RATE;
    let firing = false;
    const fireTimeout = () => firing = false;

    this.attack = () => {
        if(firing) return;
        setTimeout(fireTimeout,fireRate);
        firing = true;
        shoot();
    };
}

Object.defineProperty(WaterFists,"name",{value:NAME,enumerable:true});

export default WaterFists;
