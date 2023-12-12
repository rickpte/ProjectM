import * as THREE from 'three';

projectm.addModule(
    'empty',
    init,
    cleanup,
    update);

function init() {
    projectm.gamestate.modReadyCount++;
}

function cleanup() {

}

function update(dt) {

}
