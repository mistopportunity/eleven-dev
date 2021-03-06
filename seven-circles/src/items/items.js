const ITEM_DATA = [
    ["Elf Rock","elf-rock"],
    ["Rock","rock"],
    ["Sink","sink"],
    ["Present","present"],
    ["Big Pill","big-pill"],
    ["Small Pill","small-pill"],
    ["Blaster","blaster"],
    ["Red Key","red-key"],
    ["Blue Key","blue-key"],
    ["Green Key","green-key"],
    ["Yellow Key","yellow-key"],
    ["Pink Key","pink-key"],
    ["Chocolate Key","chocolate-key"],
    ["Chocolate Milk","chocolate-milk"],
    ["Bomb","bomb"],
    ["Speed Pill","speed-pill"],
    ["Power Cell","power-cell"],
    ["Warp Crystal","warp-crystal"],
    ["Blueprint","blueprint-fragment"],
    ["White Key","white-key"],
    ["Ice Key","ice-key"],
    ["Fissure Token","fissure-token"],
    ["Cleaver","cleaver"],
    ["Bridge Piece","bridge-piece"],
    ["Shotgun","shotgun"],
    ["Shells","shells"]
];

const ItemLookup = new Object();

const getAction = safeID => {
    return () => {
        const {frame} = Eleven.CanvasManager;
        if(!frame) return false;
        if(frame.itemHandler) {
            return frame.itemHandler(safeID);
        }
        return false;
    };
};

const makeItem = ([name,safeID],ID) => {
    const item = {name,action:getAction(safeID),ID,safeID};
    ItemLookup[safeID] = item; return item;
};

const Items = Object.freeze(
    ITEM_DATA.map((value,index)=>makeItem(value,index))
);

Object.freeze(ItemLookup);

export default Items;
export {Items, ItemLookup};
 