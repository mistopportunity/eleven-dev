import InputCodes from "./input-codes.js";
import Constants from "../constants.js";

const DOM_MAX_COLUMNS = 5;
const SELECTED_CLASS = "selected";
const MENU_CLASS = "inventory center";
const CLOSE_BUTTON_CLASS = "close-button";
const ITEM_CLASS = "item";

const TITLE_CLASS = "title";
const TITLE = "Items";
const NO_ITEMS_TEXT = "You don't have any items.";
const NO_ITEMS_CLASS = "no-items";

const AUTO_SELECT = Constants.AutoSelectInventory;

const AUTO_SCROLL_SETTINGS = {
    behavior: "smooth", block: "center", inline: "center"
};

function getNamedDiv(name) {
    const div = document.createElement("div");
    div.className = name;
    return div;
}

function InstallInventoryItems(
    uiExit,managedGamepad,proxyFrame,menu,keyDownBase,keyUpBase
) {
    let itemsList = this.getDisplayItems();
    const itemCount = itemsList.length;
    const columns = DOM_MAX_COLUMNS;

    const rowCount = Math.ceil(itemCount / columns);
    const lastRowLength = columns - (rowCount * columns - itemCount);
    const lastRowStart = itemCount - lastRowLength;

    let selected, selectedID, itemAction;

    const clearHover = () => {
        if(selected) {
            selected.classList.remove(SELECTED_CLASS);
        }
        selected = null, selectedID = null, itemAction = null;
    };
    clearHover();

    const setHover = ([uiItem,ID,action],fromKey) => {
        clearHover();
        selected = uiItem, selectedID = ID;
        itemAction = action;
        selected.classList.add(SELECTED_CLASS);
        if(!fromKey) return;
        selected.scrollIntoView(AUTO_SCROLL_SETTINGS);
    };

    const trySetSelection = difference => {
        if(selectedID === null) {
            setHover(itemsList[0],true);
            return false;
        }
        if(difference) {
            const index = selectedID + difference;
            if(index >= 0 && index < itemCount) {
                setHover(itemsList[index],true);
            }
        }
        return true;
    };

    const horizontalMove = positive => {
        if(!trySetSelection()) return;

        let length, column;
        if(selectedID >= lastRowStart) {
            length = lastRowLength;
            column = selectedID - lastRowStart;
        } else {
            length = columns;
            column = selectedID % columns;
        }
        if(positive) {
            if(column + 1 < length) {
                trySetSelection(1);
            }
        } else {
            if(column - 1 >= 0) {
                trySetSelection(-1);
            }
        }
    };

    const verticalMove = positive => {
        if(!trySetSelection() || rowCount < 1) return;

        const onLastRow = selectedID >= lastRowStart;
        const halfDifference = (columns - lastRowLength) / 2;

        if(positive) {
            if(onLastRow) {
                return;
            } else if(selectedID >= lastRowStart - columns) {
                const column = selectedID % columns;
                if(halfDifference === 0.5 && column === 0) {
                    trySetSelection(columns);
                    return;
                }
                if(column < halfDifference || column >= columns - halfDifference) return;
    
                const index = selectedID + columns - halfDifference;
                trySetSelection(Math.floor(index-selectedID));
            } else {
                trySetSelection(columns);
            }
        } else {
            if(onLastRow) {
                trySetSelection(-columns + Math.floor(halfDifference));
            } else {
                trySetSelection(-columns);
            }
        }
    };

    const hasItemFilter = (target,...parameters) => {
        return () => {
            if(itemCount) target.apply(null,parameters);
        };
    };

    const uiUp = hasItemFilter(verticalMove,false);
    const uiDown = hasItemFilter(verticalMove,true);
    const uiLeft = hasItemFilter(horizontalMove,false);
    const uiRight = hasItemFilter(horizontalMove,true);

    const uiAccept = () => {
        if(itemCount && !selected) {
            trySetSelection(); return false;
        }
        if(!itemAction) return false;
        if(itemAction()) {
            uiExit();
            return true;
        }
        return false;
    };
    const actionTable = {
        [InputCodes.Inventory]: uiExit,
        [InputCodes.Exit]: uiExit,
        [InputCodes.Up]: uiUp,
        [InputCodes.Down]: uiDown,
        [InputCodes.Left]: uiLeft,
        [InputCodes.Right]: uiRight,
        [InputCodes.Click]: uiAccept
    };

    const keyDown = key => {
        let action = null;
        if(!key.repeat) {
            action = actionTable[key.impulse];
        }
        let actionResult = null;
        if(action) actionResult = action();
        if(action === uiAccept) {
            if(actionResult !== true) {
                keyDownBase(key);
            }
        } else if(action !== uiExit) {
            keyDownBase(key);
        }
    };

    const keyUp = keyUpBase;

    const {keyBind} = SVCC.Runtime.InputServer;

    proxyFrame.keyDown = keyBind.impulse(keyDown);
    proxyFrame.keyUp = keyBind.impulse(keyUp);

    proxyFrame.inputGamepad = managedGamepad.poll;

    managedGamepad.keyDown = keyDown;
    managedGamepad.keyUp = keyUp;

    if(!itemCount) {
        const noItems = document.createElement("p");
        noItems.className = NO_ITEMS_CLASS;
        noItems.appendChild(document.createTextNode(NO_ITEMS_TEXT));
        menu.appendChild(noItems);
        return;
    }

    const tryAccept = event => {
        if(event.button === 0) uiAccept();
    };

    itemsList = itemsList.map((item,index)=>{
        const [name,imageData,action] = item;

        const uiItem = getNamedDiv(ITEM_CLASS);

        const image = new Image();
        image.setAttribute("draggable",false);
        image.src = imageData;
        uiItem.appendChild(image);

        const label = document.createElement("p");
        label.appendChild(document.createTextNode(name));
        uiItem.appendChild(label);

        const hoverData = [uiItem,index,action];

        uiItem.onpointerover = setHover.bind(null,hoverData,false);
        uiItem.onpointerout = clearHover;
        uiItem.onclick = tryAccept;

        menu.appendChild(uiItem);

        return hoverData;
    });

    if(AUTO_SELECT) trySetSelection();
}

function InventoryMenu({terminate,proxyFrame},keyDown,keyUp,callback) {

    const {InputServer} = SVCC.Runtime;
    const managedGamepad = InputServer.managedGamepad;
    managedGamepad.save();

    const uiExit = () => {
        managedGamepad.restore(); terminate(); callback();
    };

    const menu = getNamedDiv(MENU_CLASS);
    
    const title = document.createElement("h1");
    title.className = TITLE_CLASS;
    title.appendChild(document.createTextNode(TITLE));
    menu.appendChild(title);

    InstallInventoryItems.call(
        this,uiExit,managedGamepad,proxyFrame,menu,keyDown,keyUp
    );

    const closeButton = getNamedDiv(CLOSE_BUTTON_CLASS);
    menu.appendChild(closeButton);

    closeButton.onclick = event => {
        if(event.button === 0) uiExit();
    };

    return menu;
}

export default InventoryMenu;
