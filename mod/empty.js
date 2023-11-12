import * as THREE from 'three';

projectm.addMod(
    'world',
    init,
    cleanup,
    update,
    getHeight,
    null,
    [0, 0, 0],  // mins
    [0, 0, 0],  // maxs
    [0]   // drawdistances
);

function init() {

}

function cleanup() {

}

function update(dt) {

}

function getHeight() {
    return 0;
}