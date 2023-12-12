import * as THREE from 'three';
import { Text } from 'troika-three-text';

let viewLevel = -1;
let text1, text2;
let group;
let idx1 = 0, max1 = 28, lines1 = [], changed1 = false;
let idx2 = 0, max2 = 28, lines2 = [], changed2 = false;

projectm.addModule(
    'panels',
    init,
    cleanup,
    update);

function init() {
    group = new THREE.Group();
    group.position.x = -4;
    group.rotation.y = .5;
    group.position.z = -2;

    text1 = createPanel(0, 0);
    text2 = createPanel(2.1, 0);

    projectm.three.scene.add(group);
    
    projectm.gamestate.modReadyCount++;
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
    wall.position.z = z -.04;
    group.add(wall);

    let text = new Text()
    
    // Set properties to configure:
    text.fontSize = 0.05;
    text.position.x = x + .05;
    text.position.y = 2 - .05;
    text.position.z = z;
    text.color = 0xFFFFFF;
    text.maxWidth = 1.8;

    // text.text = 'panel';

    // Update the rendering:
    text.sync();
    group.add(text);

    return text;
}

function onKeyDown(evt) {
    if (viewLevel != 0) return;

    evt.preventDefault();
    // lines[0] += evt.code;

    if (evt.code == "ArrowLeft") {

    } else if (evt.code == "ArrowRight") {

    } else if (evt.code == "ArrowUp") {
        if (idx2 > 0) idx2--;
    } else if (evt.code == "ArrowDown") {
        idx2++;
        if (idx2 >= max2) {
            lines2[idx2] = "";
            max2++;
        }
    } else if (evt.code == "Enter") {
        idx2++;
        if (idx2 >= max2) {
            lines2[idx2] = "";
            max2++;
        }

    } else if (evt.code == "Backspace") {
        lines2[idx2] = lines2[idx2].slice(0, lines2[idx2].length - 1);
    } else {
        if (evt.key == 'Unidentified') {
            // projectm.log(evt.code);
        } else if (evt.key == "Shift") {
        } else {
            if (!lines2[idx2]) lines2[idx2] = '';
            lines2[idx2] += evt.key;
        }
    }

    changed2 = true;
}

function cleanup() {

}

function update(dt) {

    if (idx1 != projectm.logstate.idx) {
        idx1 = projectm.logstate.idx;

        let start = 0;
        if (idx1 >= max1) {
            start = idx1 - max1;
        }
        let s = '';
        for (let i = start; i < idx1; i++) {
            s += projectm.logstate.lines[i] + '\n';
        }
        text1.text = s;
    }

    if (idx2 != projectm.chatstate.idx) {
        idx2 = projectm.chatstate.idx;

        let start = 0;
        if (idx2 >= max2) {
            start = idx2 - max2;
        }
        let s = '';
        for (let i = start; i < idx2; i++) {
            s += projectm.chatstate.lines[i] + '\n';
        }
        text2.text = s;
    }

    // if (changed2) {
    //     let line = '';
    //     for (let i = 0; i < lines2.length; i++) {
    //         line += lines2[i];
    //         if (i == idx2) line += '_';
    //         line += '\n';
    //     }
    //     text2.text = line;
    //     changed2 = false;
    // }
}

function setViewLevel(v) {

    if (v == -1) {
        text1.visible = false;
        text2.visible = false;
    } else if (v == 1) {
        text1.visible = true;
        text2.visible = true;
    } 
    
    if (v == 0) {
        if (projectm.gamestate.controlMode != 1) {
            projectm.log('panels taking keyboard control');
            document.addEventListener('keydown', onKeyDown, false);
            projectm.gamestate.modHasInput = true;
        }
    } else if (viewLevel == 0) {
        if (projectm.gamestate.controlMode != 1) {
            projectm.log('panels releasing keyboard control');
            projectm.gamestate.modHasInput = false;
        }
    }

    viewLevel = v;
}