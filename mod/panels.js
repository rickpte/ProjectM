import * as THREE from 'three';
import { Text } from 'troika-three-text';

let text1;
let idx = 0, lines = [];

projectm.addMod(
    'panels',
    init,
    cleanup,
    update,
    getHeight,
    null,
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
);

function init() {

    var geometry = new THREE.PlaneGeometry(2, 2);
	var material = new THREE.MeshStandardMaterial({
		color: 0x444444,
		roughness: 1.0,
        metalness: 0.0,
        transparent: true,
        opacity: 0.4
	});
    var wall = new THREE.Mesh(geometry, material);
    wall.position.x = 0;
    wall.position.y = 1;
    wall.position.z = -4.01;
    projectm.scene.add(wall);

    text1 = new Text()
    projectm.scene.add(text1)
    
    // Set properties to configure:
    text1.text = s;
    text1.fontSize = 0.05;
    text1.position.x = -1 + .05;
    text1.position.y = 2 - .05;
    text1.position.z = -4;
    text1.color = 0xFFFFFF;
    text1.maxWidth = 1.8;
    
    // Update the rendering:
    text1.sync()
}

function cleanup() {

}

function update(dt) {
    if (idx != projectm.logstate.idx) {
        console.log('Log updated');
        idx = projectm.logstate.idx;

        let s = '';
        for (let i = 0; i < idx; i++) {
            s += projectm.logstate.lines[i] + '\n';
        }
        text1.text = s;
    }
}

function getHeight() {
    return 0;
}