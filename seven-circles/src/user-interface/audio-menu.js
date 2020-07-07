import GetExitButton from "./exit-button.js";
import ManagedBase from "./managed-base.js";
import Constants from "../constants.js";

const MENU_CLASS = "menu-interface audio-menu";
const VOLUME_CONTROL_CLASS = "volume-control";

const BUTTON_DIFFERENCE = 0.1;
const DOWN_SYMBOL = "🔈";
const UP_SYMBOL = "🔊";
const MUTE_SYMBOL = "🔇";

const MAX_VOLUME = Constants.MaxVolume;
const MIN_VOLUME = Constants.MinVolume;

function GetVolumeControl(getVolume,setVolume,name) {
    const div = document.createElement("div");
    div.className = VOLUME_CONTROL_CLASS;

    const down = document.createElement("button");
    down.appendChild(document.createTextNode(DOWN_SYMBOL));

    const up = document.createElement("button");
    up.appendChild(document.createTextNode(UP_SYMBOL));

    const mute = document.createElement("button");
    mute.appendChild(document.createTextNode(MUTE_SYMBOL));

    const status = document.createElement("p");
    const updateStatus = () => {
        status.textContent = `${name} Volume: ${(getVolume()*100).toFixed(0)}%`;
    };
    updateStatus();

    const updateVolume = difference => {
        const startVolume = getVolume();
        let volume = startVolume + difference;
        volume = Math.min(Math.max(volume,MIN_VOLUME),MAX_VOLUME);
        if(volume !== startVolume) {
            setVolume(volume); updateStatus();
        }
    };

    down.onclick = event => {
        if(event.button === 0) updateVolume(-BUTTON_DIFFERENCE);
    };
    up.onclick = event => {
        if(event.button === 0) updateVolume(BUTTON_DIFFERENCE);
    };
    mute.onclick = event => {
        if(event.button !== 0) return;
        const currentVolume = getVolume();
        updateVolume(currentVolume !== MIN_VOLUME ? -currentVolume : MAX_VOLUME);
    };

    div.appendChild(down);
    div.appendChild(up);
    div.appendChild(mute);
    div.appendChild(status);

    return div;
}

function AudioMenu({terminate,proxyFrame},proxyFrameRenderer) {
    if(proxyFrameRenderer) {
        proxyFrame.render = proxyFrameRenderer;
        proxyFrame.opaque = true;
    }
    const menu = document.createElement("div");
    menu.className = MENU_CLASS; menu.classList.add("center");

    const exit = ManagedBase(proxyFrame,terminate,({impulse})=>{
        switch(impulse) {
            case "Escape": return "exit";
        }
    });

    menu.appendChild(GetExitButton(exit));

    const runtime = SVCC.Runtime;

    const getSound = () => runtime.soundVolume;
    const setSound = value => runtime.soundVolume = value;

    const getMusic = () => runtime.musicVolume;
    const setMusic = value => runtime.musicVolume = value;

    menu.appendChild(GetVolumeControl(getSound,setSound,"Sound"));
    menu.appendChild(GetVolumeControl(getMusic,setMusic,"Music"));
   
    return menu;
}
export default AudioMenu;
