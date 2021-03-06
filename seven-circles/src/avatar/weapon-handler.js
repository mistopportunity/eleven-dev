function WeaponHandler() {
    let weapon = null, weaponUpdateID, weaponRenderID, weaponLocked = false;

    let weaponChangeWatchers = new Array();

    this.watchWeaponChange = handler => {
        weaponChangeWatchers.push(handler);
    };

    const sendWeaponChange = () => {
        for(let i = 0;i<weaponChangeWatchers.length;i++) {
            weaponChangeWatchers[i](weapon);
        }
    }

    this.setWeapon = (newWeapon,...parameters) => {
        if(weaponLocked) return false;
        if(weapon !== null) {
            this.clearWeapon();
        }

        if(typeof newWeapon === "function") {
            const weapon = {owner: this, world: this.world};
            newWeapon.apply(weapon,parameters);
            newWeapon = weapon;
        } else {
            newWeapon.owner = this;
            newWeapon.world = this.world;
        }

        const zIndex = this.zIndex;

        if(newWeapon.update) {
            weaponUpdateID = this.addUpdate(newWeapon.update,zIndex);
        }
        if(newWeapon.render) {
            weaponRenderID = this.addRender(newWeapon.render,zIndex);
        }

        if(newWeapon.load) newWeapon.load();

        weapon = newWeapon;

        sendWeaponChange();
        return true;
    };
    this.clearWeapon = () => {
        if(weaponLocked) return;

        if(weapon === null) return;

        this.removeUpdate(weaponUpdateID);
        this.removeRender(weaponRenderID);

        const oldWeapon = weapon;
        weapon = null;
        if(oldWeapon.unload) oldWeapon.unload();

        sendWeaponChange();
    };

    this.hasWeapon = () => {
        return weapon !== null;
    };

    this.attack = () => {
        if(!this.hasWeapon()) return;
        if(weapon.attack) weapon.attack();

    };

    this.getWeapon = () => {
        return weapon;
    };

    this.lockWeapon = () => {
        weaponLocked = true;
    };
    this.unlockWeapon = () => {
        weaponLocked = false;
    };

    this.weaponLocked = () => {
        return weaponLocked;
    };
}

export default WeaponHandler;
