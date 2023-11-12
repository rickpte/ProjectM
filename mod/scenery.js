import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let models = [];

projectm.addMod(
    'scenery',
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

    if (models.length == 0) {
        models = [
            {
                "use": true,
                "loaded": false,
                "filename": 'data/models/cybertruck2.glb',
                "position": [4, 0, -4],
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
                "position": [8, 0, -4],
                "center": false,
                "flipX": false,
                "flipY": true,
                "shadows": false,
                "scale": 0.0099
            },
            {
                "use": true,
                "loaded": false,
                "filename": 'data/models/home.glb',
                "position": [-14, 0, -4],
                "center": false,
                "flipX": false,
                "flipY": false,
                "shadows": false,
                "scale": 1
            },
        ];
    }

    for (let i = 0; i < models.length; i++) {
        if (!models[i].loaded) loadModel(models[i]);
    }

}

function cleanup() {

    for (let i = 0; i < models.length; i++) {

        if (models[i].group) {

            models[i].group.remove(models[i].model);
            projectm.scene.remove(models[i].group);

            models[i].model = null;
            models[i].group = null;
            models[i].loaded = false;
        }
    }    

}

function loadModel(obj) {
    if (!obj.use) return;
    obj.loading = true;

    const loader = new GLTFLoader();

    loader.load(obj.filename, function (gltf) {
        let model = gltf.scene;
        // model.rotation.order = "XYZ";
        if (obj.scale != 1) model.scale.set(obj.scale, obj.scale, obj.scale);
        model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
            if (object.material) {
                object.material.metalness = 0;
            }
            if (projectm.settings.shadows) 
                if (obj.shadows) object.receiveShadow = shadows;
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

        const group = new THREE.Group();
        group.rotation.order = "ZXY";
        group.add(model);
        group.position.set(obj.position[0], obj.position[1], obj.position[2]);

        projectm.log('loaded: ' + obj.filename.slice(obj.filename.lastIndexOf('/') + 1));
        if (projectm.settings.boxes) {
            obj.box = new THREE.Box3().setFromObject(model);
            const boxHelper = new THREE.Box3Helper(obj.box, 0xffff00);
            group.add(boxHelper);

            projectm.log('(' + (obj.box.max.x - obj.box.min.x) + ', ' + (obj.box.max.y - obj.box.min.y) + ', ' + (obj.box.max.z - obj.box.min.z) + ')');
        }

        projectm.scene.add(group);

        obj.model = model;
        obj.group = group;

        obj.loaded = true;
    });
}

function update(dt) {

}

function getHeight() {
    return 0;
}