import * as THREE from 'three';
import { Text } from 'troika-three-text';

let text1;
let idx = 0, max = 0, lines = [], changed = false;

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
    
    for (let i = 0; i < 10; i++) {
        lines[i] = "line" + (i + 1);
        max++;
    }
    changed = true;

    // Update the rendering:
    text1.sync()

    document.addEventListener('keydown', onKeyDown, false);

    projectm.gamestate.modHasInput = true;
}

function onKeyDown(evt) {
    evt.preventDefault();
    // lines[0] += evt.code;

    if (evt.code == "ArrowLeft") {

    } else if (evt.code == "ArrowRight") {

    } else if (evt.code == "ArrowUp") {
        if (idx > 0) idx--;
    } else if (evt.code == "ArrowDown") {
        idx++;
        if (idx >= max) {
            lines[idx] = "";
            max++;
        }
    } else if (evt.code == "Enter") {
        idx++;
        if (idx >= max) {
            lines[idx] = "";
            max++;
        }

    } else if (evt.code == "Backspace") {
        lines[idx] = lines[idx].slice(0, lines[idx].length - 1);
    } else {
        if (evt.key == 'Unidentified') {
            // projectm.log(evt.code);
        } else if (evt.key == "Shift") {
        } else {
            lines[idx] += evt.key;
        }
    }

    changed = true;
}

function cleanup() {

}

function update(dt) {
    if (false && idx != projectm.logstate.idx) {
        console.log('Log updated');
        idx = projectm.logstate.idx;

        let s = '';
        for (let i = 0; i < idx; i++) {
            s += projectm.logstate.lines[i] + '\n';
        }
        text1.text = s;
    }

    if (changed) {
        let line = '';
        for (let i = 0; i < lines.length; i++) {
            line += lines[i];
            if (i == idx) line += '_';
            line += '\n';
        }
        text1.text = line;
        changed = false;
    }
}

function getHeight() {
    return 0;
}