import * as THREE from 'three';

let skyDome, water;

projectm.addMod(
    'world',
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
    setupSkydome(true);
}

function setupSkydome(addWater) {
    new THREE.TextureLoader().load('data/images/sky1.jpg', function (t1) {
        t1.minFilter = THREE.LinearFilter; // Texture is not a power-of-two size; use smoother interpolation.
        skyDome = new THREE.Mesh(
            new THREE.SphereGeometry(4000, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
            new THREE.MeshBasicMaterial({ map: t1, side: THREE.BackSide, fog: false })
        );
        skyDome.position.y = -50;
        projectm.three.scene.add(skyDome);
    });
    
    new THREE.TextureLoader().load('data/images/sand1.jpg', function (t2) {
        if (addWater) {
            t2.minFilter = THREE.LinearFilter; // Texture is not a power-of-two size; use smoother interpolation.
            t2.wrapS = t2.wrapT = THREE.RepeatWrapping;
            t2.repeat.set(100, 100);

            var geometry = new THREE.PlaneGeometry(8000, 8000, 4, 4);
            var material = new THREE.MeshStandardMaterial({
                color: 0xcccccc,
                roughness: 1.0,
                metalness: 0.0,
                map: t2 
            });
            
            water = new THREE.Mesh(geometry, material);
            water.position.y = 0;
            water.rotation.x = -Math.PI / 2;
            if (projectm.settings.shadows) water.receiveShadow = true;
            projectm.three.scene.add(water);
        }
    });
}

function cleanup() {

}

function update(dt) {

}

function getHeight() {
    return 0;
}