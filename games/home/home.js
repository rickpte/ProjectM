import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const x = -20, y = 0, z = 0;
let group;
let models = [];

projectm.addGame(
    'home',
    init,
    cleanup,
    update,
    getHeight,
    viewLevel,
    [x - 13, y, z - 10],
    [x + 10, y + 4, z + 12],
    [10]
);

function init() {

    if (models.length == 0) {
        models = [
            {
                "use": true,
                "loaded": false,
                "filename": 'data/models/home.glb.jpg',
                "position": [0, 0, 0],
                "center": false,
                "flipX": false,
                "flipY": false,
                "shadows": true,
                "scale": 1
            },
            {
                "use": false,
                "loaded": false,
                "filename": 'data/models/cybertruck2.glb',
                "position": [8, 0, 8],
                "center": true,
                "flipX": false,
                "flipY": true,
                "shadows": false,
                "scale": 1.8
            },
            {
                "use": false,
                "loaded": false,
                "filename": 'data/models/teslay.glb',
                "position": [12, 0, 8],
                "center": false,
                "flipX": false,
                "flipY": true,
                "shadows": false,
                "scale": 0.0099
            },
        ];
    }

    group = new THREE.Group();
    group.position.x = x;
    group.position.y = y;
    group.position.z = z;

    for (let i = 0; i < models.length; i++) {
        if (!models[i].loaded) loadModel(models[i]);
    }

    projectm.three.scene.add(group);
}

function cleanup() {

    for (let i = 0; i < models.length; i++) {

        if (models[i].group) {

            models[i].group.remove(models[i].model);
            projectm.three.scene.remove(models[i].group);

            models[i].model = null;
            models[i].group = null;
            models[i].loaded = false;
        }
    }    

    projectm.three.scene.remove(group);
    group = null;
}

function loadModel(obj) {
    if (!obj.use) return;
    obj.loading = true;

    const loader = new GLTFLoader();

    loader.load(obj.filename, function (gltf) {
        let model = gltf.scene;
        if (obj.scale != 1) model.scale.set(obj.scale, obj.scale, obj.scale);
        model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
            if (object.material) {
                object.material.metalness = 0;
            }
            if (projectm.settings.shadows) 
                if (obj.shadows) object.receiveShadow = true;
        });

        const box = new THREE.Box3().setFromObject(model);
        const c = box.getCenter(new THREE.Vector3());

        if (obj.flipX && obj.flipY) {
            model.rotation.y = Math.PI;
            model.rotation.x = Math.PI / 2;
            if (obj.center) model.position.set(c.x, -c.y, -c.z);
        } else if (obj.flipX) {
            model.rotation.x = Math.PI / 2;
            if (obj.center) model.position.set(-c.x, c.z, -c.y);
        } else if (obj.flipY) {
            model.rotation.y = Math.PI;
            if (obj.center) model.position.set(c.x, -c.y, c.z);
        } else {
            if (obj.center) model.position.set(-c.x, -c.y, -c.z);
        }

        if (obj.center) {
            const box2 = new THREE.Box3().setFromObject(model);
            model.position.y -= box2.min.y;
        }

        const grp = new THREE.Group();
        grp.add(model);
        grp.position.set(obj.position[0], obj.position[1], obj.position[2]);

        projectm.log('loaded: ' + obj.filename.slice(obj.filename.lastIndexOf('/') + 1));
        if (projectm.settings.boxes) {
            obj.box = new THREE.Box3().setFromObject(model);
            const boxHelper = new THREE.Box3Helper(obj.box, 0xffff00);
            grp.add(boxHelper);

            // projectm.log('(' + (obj.box.max.x - obj.box.min.x) + ', ' + (obj.box.max.y - obj.box.min.y) + ', ' + (obj.box.max.z - obj.box.min.z) + ')');
        }

        obj.model = model;
        obj.group = grp;

        obj.loaded = true;
        group.add(grp);

    });
}

function update(dt) {

}

function getHeight() {
    return 0;
}

function viewLevel(v) {

}