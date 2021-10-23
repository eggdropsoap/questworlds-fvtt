/**
* In [arr], move the element at [from] before element at [to]
* @param {Array} arr    array to mutate
* @param {Number} from  index of array item to move
* @param {Number} to    index of new location
*/
export function moveIndex(arr,from,to) {
    const entry = arr[from];    // save entry to move
    arr.splice(from,1);         // delete entry
    arr.splice(to,0,entry);     // splice entry ahead of "to"
}
