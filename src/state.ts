import { CreateBoxOptions, DEFAULT_CONFIG } from "./types";

const dragBoxList: CreateBoxOptions[] = [];
let boxId = 1;
let zIndex = 0;
let topIndex = 1;

export function createNewBox(): CreateBoxOptions {
    const newBoxItem: CreateBoxOptions = {
        config: DEFAULT_CONFIG,
        id: boxId , 
        zIndex: zIndex,
        position:{
            x:0,
            y:0
        }
    }
    boxId++;
    zIndex++;
    topIndex++;
    dragBoxList.push(newBoxItem);
    console.log(dragBoxList);
    return newBoxItem;
}

export function bringBoxToFront(id : number): number{
    const boxIndex = dragBoxList.findIndex(box => box.id === id);
    const newZIndex = dragBoxList[boxIndex].zIndex = topIndex;
    topIndex++;
    return newZIndex;
}

export function deleteBox(id : number) {
    const boxIndex = dragBoxList.findIndex(box => box.id === id);
    dragBoxList.splice(boxIndex, 1);
    console.log(dragBoxList);
}