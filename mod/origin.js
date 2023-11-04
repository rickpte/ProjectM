import * as THREE from 'three';

const groundSize = 50;

projectm.addMod(
    'origin',
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
    setupPlatform();
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
	projectm.scene.add(floor);

    const grid = new THREE.GridHelper(groundSize, groundSize);
    projectm.scene.add(grid);

}

function cleanup() {

}

function update(dt) {

}

function getHeight() {
    return 0;
}