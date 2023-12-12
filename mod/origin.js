import * as THREE from 'three';

const groundSize = 50;
const h = -0.02;

projectm.addModule(
    'origin',
    init,
    cleanup,
    null
);

function init() {
    setupPlatform();
    // setupBox();
    projectm.gamestate.modReadyCount++;
}

function setupPlatform() {
    var geometry = new THREE.PlaneGeometry(groundSize, groundSize);
	var material = new THREE.MeshStandardMaterial({
		color: 0xcbcbcb,
		roughness: 1.0,
		metalness: 0.0
	});
	var floor = new THREE.Mesh(geometry, material);
	floor.rotation.x = -Math.PI / 2;
    if (projectm.settings.shadows) floor.receiveShadow = true;
    floor.position.y = h;
	projectm.three.scene.add(floor);

    const grid = new THREE.GridHelper(groundSize, groundSize);
    grid.position.y = h;
    projectm.three.scene.add(grid);
}

function setupBox() {
    const geometry = new THREE.BoxGeometry(groundSize, 20,  groundSize);
    const material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    var box = new THREE.Mesh(geometry, material);
    box.material.side = THREE.DoubleSide;
    box.position.y = h + 8;
    box.visible = true;
    projectm.three.scene.add(box);
}


function cleanup() {
}

