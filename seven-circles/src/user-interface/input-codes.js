const MOVE_UP = "MoveUp";
const MOVE_LEFT = "MoveLeft";
const MOVE_RIGHT = "MoveRight";
const MOVE_DOWN = "MoveDown";
const CLICK = "Enter";
const EXIT = "Escape";
const INVENTORY = "Inventory";

const InputCodes = Object.freeze({
    Click: CLICK,
    Exit: EXIT,
    Inventory: INVENTORY,
    Up: MOVE_UP,
    Down: MOVE_DOWN,
    Left: MOVE_LEFT,
    Right: MOVE_RIGHT
});

export default InputCodes;
