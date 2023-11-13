import * as THREE from 'three';
import { Text } from 'troika-three-text';

let text1, text2;
let idx1 = 0, max1 = 0, lines1 = [], changed1 = false;
let idx2 = 0, max2 = 0, lines2 = [], changed2 = false;

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
    text1 = createPanel(0, -4);
    text2 = createPanel(3, -4);


    // document.addEventListener('keydown', onKeyDown, false);
    // projectm.gamestate.modHasInput = true;
}

function createPanel(x, z) {
    var geometry = new THREE.PlaneGeometry(2, 2);
	var material = new THREE.MeshStandardMaterial({
		color: 0x444444,
		roughness: 1.0,
        metalness: 0.0,
        transparent: true,
        opacity: 0.4
	});
    var wall = new THREE.Mesh(geometry, material);
    wall.position.x = x + 1;
    wall.position.y = 1;
    wall.position.z = z -.01;
    projectm.scene.add(wall);

    let text = new Text()
    
    // Set properties to configure:
    text.text = s;
    text.fontSize = 0.05;
    text.position.x = x + .05;
    text.position.y = 2 - .05;
    text.position.z = z;
    text.color = 0xFFFFFF;
    text.maxWidth = 1.8;

    text.text = 'panel';

    // Update the rendering:
    text.sync();
    projectm.scene.add(text);

    return text;
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
    if (idx1 != projectm.logstate.idx) {
        idx1 = projectm.logstate.idx;

        let s = '';
        for (let i = 0; i < idx1; i++) {
            s += projectm.logstate.lines[i] + '\n';
        }
        text1.text = s;
    }

    if (changed2) {
        let line = '';
        for (let i = 0; i < lines2.length; i++) {
            line += lines2[i];
            if (i == idx2) line += '_';
            line += '\n';
        }
        text2.text = line;
        changed2 = false;
    }
}

function getHeight() {
    return 0;
}