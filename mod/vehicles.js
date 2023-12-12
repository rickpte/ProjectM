import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let vehicles = [], myvehicle;
let ready = false;
let modelCybertruck;
let maxSteerAngle = .6;
let maxTurnRate = 1;
let prevControlMode = 0;

projectm.addModule(
    'vehicles',
    init,
    cleanup,
    update
);

function init() {
    loadVehicleModels();

    if (!projectm.settings.network) {
        addVehicle();
    }
}

function cleanup() {

}

function update(dt) {

    if (projectm.gamestate.controlMode == 3 && prevControlMode != 3) {

        if (vehicles.length > 0) {
            projectm.netplayer.vehicle.x = vehicles[0].position[0];
            projectm.netplayer.vehicle.y = vehicles[0].position[1];
            projectm.netplayer.vehicle.z = vehicles[0].position[2];
            projectm.netplayer.vehicle.yaw = vehicles[0].yaw;

            projectm.netplayer.player.vehicleid = vehicles[0].id;
        }

        prevControlMode = projectm.gamestate.controlMode;
    } else if (projectm.gamestate.controlMode != 3 && prevControlMode == 3) {

        projectm.netplayer.player.vehicleid = 0;

        prevControlMode = projectm.gamestate.controlMode;
    }

    if (ready && projectm.settings.network) {
        if (projectm.netstate.vehicles.length != vehicles.length) {
            projectm.log('updating vehicles, server: ' + projectm.netstate.vehicles.length + ' client: ' + vehicles.length);

            if (projectm.netstate.vehicles.length == 0) {
                vehicles.length = 0;
            } else {
                // TODO this should be handled differently
                for (let i = vehicles.length; i < projectm.netstate.vehicles.length; i++) {
                    let idx = addVehicle();
                    vehicles[idx].id = projectm.netstate.vehicles[i].id;
                }
            }
        }
    }

    if (!myvehicle) {
        for (let i = 0; i < vehicles.length; i++) {
            if (vehicles[i].driverid == projectm.netplayer.player.id) {
                myvehicle = vehicles[i];
                projectm.log('started driving vehicle ' + myvehicle.id);
            }
        }
    } else {
        if (myvehicle.driverid != projectm.netplayer.player.id) {
            projectm.log('stopped driving vehicle ' + myvehicle.id);
            projectm.netplayer.vehicle.speed = 0;
            myvehicle.speed = 0;
            myvehicle = null;
        }
    }

    if (ready && projectm.gamestate.networkUpdate3) {
        for (let i = 0; i < projectm.netstate.vehicles.length; i++) {
            if (myvehicle && vehicles[i].id == myvehicle.id) {

                vehicles[i].driverid = projectm.netstate.vehicles[i].driverid;

            } else {
                vehicles[i].driverid = projectm.netstate.vehicles[i].driverid;
                vehicles[i].driving = projectm.netstate.vehicles[i].driving;
                vehicles[i].turning = projectm.netstate.vehicles[i].turning;
                vehicles[i].position[0] = projectm.netstate.vehicles[i].x;
                vehicles[i].position[1] = projectm.netstate.vehicles[i].y;
                vehicles[i].position[2] = projectm.netstate.vehicles[i].z;
                vehicles[i].speed = projectm.netstate.vehicles[i].speed;
                vehicles[i].turnrate = projectm.netstate.vehicles[i].turnrate;
                vehicles[i].yaw = projectm.netstate.vehicles[i].yaw;
                vehicles[i].pitch = projectm.netstate.vehicles[i].pitch;
                vehicles[i].roll = projectm.netstate.vehicles[i].roll;
                vehicles[i].steerAngle = projectm.netstate.vehicles[i].steerAngle;
            }
        }

        projectm.gamestate.networkUpdate3 = false;
    }

    checkControlMode();
    handleInput(dt);
    updateVehicles(dt);
    setNetplayer();
    setViewPivot(dt);
}

function setViewPivot(dt) {
    if (projectm.gamestate.controlMode == 3) {
        for (let i = 0; i < vehicles.length; i++) {
            if (projectm.netplayer.player.vehicleid == vehicles[i].id) {
                projectm.three.viewPivot.position.x = vehicles[i].position[0];
                projectm.three.viewPivot.position.z = vehicles[i].position[2] + 10;
                projectm.three.viewPivot.rotation.y = 0;
            }
        }
    }
}

function checkControlMode() {
    if (projectm.gamestate.controlMode == 2) {
        if (vehicles.length > 0) {
            let dxf = Math.sin(vehicles[0].yaw) * 3;
            let dzf = Math.cos(vehicles[0].yaw) * 3;

            let doorx = vehicles[0].position[0] + dxf;
            let doorz = vehicles[0].position[2] + dzf;
            let dx = doorx - projectm.netplayer.player.x;
            let dz = doorz - projectm.netplayer.player.z;
            let dd = dx * dx + dz * dz;
            // console.log('dxf: ' + dxf + ' dzf: ' + dzf + ' dd: ' + dd);
            if (dd < 4) {
                projectm.setControlMode(3);
                if (!projectm.settings.network) {
                    myvehicle = vehicles[0];
                }
            }
        }
    } else if (projectm.gamestate.controlMode == 3) {
        if (!projectm.settings.network) {
            myvehicle = vehicles[0];
            myvehicle.driverid = projectm.netplayer.player.id;
        }
    }
}

function handleInput(dt) {
    if (!myvehicle) return;
    if (!myvehicle.loaded) return;

    if (projectm.gamestate.controlMode == 3) {

        let a = projectm.input.forwardAxis * 10;
        myvehicle.speed += a * dt;
        if (myvehicle.speed > .1 || myvehicle.speed < -.1) {
            myvehicle.driving = true;
            myvehicle.speed *= .99; 
        } else {
            myvehicle.driving = false;
            myvehicle.speed = 0;
        }

        myvehicle.steerAngle = projectm.input.steerAxis * maxSteerAngle;
        if (myvehicle.steerAngle > .1 || myvehicle.steerAngle < -.1) {
            myvehicle.turning = true;
            myvehicle.turnrate = myvehicle.steerAngle * myvehicle.speed * .4;
            if (myvehicle.turnrate > maxTurnRate) myvehicle.turnrate = maxTurnRate;
            if (myvehicle.turnrate < -maxTurnRate) myvehicle.turnrate = -maxTurnRate;

        } else {
            myvehicle.turning = false;
            myvehicle.turnrate = 0;
        }
    } 
}

function updateVehicles(dt) {

    for (let i = 0; i < vehicles.length; i++) {
        if (!vehicles[i].loaded) {

            setVehicleModel(i);
        
        } else {
            if (vehicles[i].turning) {
                vehicles[i].yaw += dt * vehicles[i].turnrate;
            }
            if (vehicles[i].driving) {
                vehicles[i].position[0] += Math.sin(vehicles[i].yaw) * dt * vehicles[i].speed;
                vehicles[i].position[2] += Math.cos(vehicles[i].yaw) * dt * vehicles[i].speed;
            }

            vehicles[i].group.position.x = vehicles[i].position[0];
            vehicles[i].group.position.y = vehicles[i].position[1];
            vehicles[i].group.position.z = vehicles[i].position[2];
            vehicles[i].group.rotation.y = vehicles[i].yaw;

            if (vehicles[i].wheelRL) {
                // r = Math.max(PI_2 - maxPolarAngle, Math.min(PI_2 - minPolarAngle, r));

                vehicles[i].wheelRL.rotation.x += dt * vehicles[i].speed * 1.4;
                vehicles[i].wheelRR.rotation.x += dt * vehicles[i].speed * 1.4;
                vehicles[i].wheelFL.rotation.x += dt * vehicles[i].speed * 1.4;
                vehicles[i].wheelFR.rotation.x += dt * vehicles[i].speed * 1.4;

                vehicles[i].wheelFL.rotation.y = vehicles[i].steerAngle;
                vehicles[i].wheelFR.rotation.y = vehicles[i].steerAngle;
            }

            // let h = projectm.getHeight(obj.group.position.x, obj.group.position.y);

            // obj.group.position.z = h;
            // obj.group.rotation.z = obj.yaw;
        
            // let dxf = -Math.sin(obj.yaw) * 3;
            // let dyf = Math.cos(obj.yaw) * 3;
        
            // let dxs = -Math.sin(obj.yaw + 0.785) * 1;
            // let dys = Math.cos(obj.yaw + 0.785) * 1;
        
            // let hf = projectm.getHeight(obj.group.position.x - dxf, obj.group.position.y - dyf);
            // let hs = projectm.getHeight(obj.group.position.x - dxs, obj.group.position.y - dys);
        
            // // obj.testPos = new THREE.Vector3(obj.group.position.x + dxs, obj.group.position.y + dys, obj.group.position.z);
        
            // let tpitch = (hf - h) / -3;
            // obj.pitch += (tpitch - obj.pitch) * dt * 10; 
            // obj.group.rotation.x = obj.pitch;
        
            // let troll = (hs - h) / -1;
            // obj.roll += (troll - obj.roll) * dt * 10;
            // obj.group.rotation.y = obj.roll;
        
        }
    }
}

function setNetplayer() {
    if (myvehicle && projectm.settings.network) {
        projectm.netplayer.vehicle.x = myvehicle.position[0];
        projectm.netplayer.vehicle.y = myvehicle.position[1];
        projectm.netplayer.vehicle.z = myvehicle.position[2];
        projectm.netplayer.vehicle.yaw = myvehicle.yaw;
        projectm.netplayer.vehicle.driving = myvehicle.driving;
        projectm.netplayer.vehicle.speed = myvehicle.speed;
        projectm.netplayer.vehicle.turning = myvehicle.turning;
        projectm.netplayer.vehicle.turnrate = myvehicle.turnrate;
        projectm.netplayer.vehicle.steerAngle = myvehicle.steerAngle;
    }
}

function addVehicle() {

    let vehicle = {
        "id": 0,
        "driverid": 0,
        "loaded": false,
        "modelname": 'cybertruck2',
        "steerAngle": 0,
        "driving": false,
        "turning": false,
        "position": [6, 0, -6],
        "speed": 0,
        "turnrate": 0,
        "yaw": 0,
    };

    let i = vehicles.length;
    vehicles[i] = vehicle;

    return i;
}

function loadVehicleModels() {

    const scale = 1.8;
    const loader2 = new GLTFLoader();

    loader2.load('data/models/cybertruck2.glb', function (gltf) {

        projectm.log('loading cybertruck2.glb');

        let model = gltf.scene;
        model.scale.set(scale, scale, scale);

        model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
            if (object.material) {
                object.material.metalness = 0;
            }
        });

        const box = new THREE.Box3().setFromObject(model);
        const c = box.getCenter(new THREE.Vector3());

        // model.rotation.y = Math.PI;
        // model.position.set(c.x, -c.y, c.z);
        model.position.set(-c.x, -c.y, -c.z);
        model.position.z += 1;

        const box2 = new THREE.Box3().setFromObject(model);
        model.position.y -= box2.min.y;

        modelCybertruck = model;
        ready = true;
        projectm.gamestate.modReadyCount++;
    });
}

function setVehicleModel(i) {
    if (!(modelCybertruck)) return;

    if (vehicles[i].modelname == "cybertruck2") {
        vehicles[i].model = modelCybertruck;
    }

    const group = new THREE.Group();
    group.add(vehicles[i].model);
    group.position.set(vehicles[i].position[0], vehicles[i].position[1], vehicles[i].position[2]);

    vehicles[i].group = group;
    vehicles[i].loaded = true;

    projectm.three.scene.add(group);
    carInitModel(vehicles[i]);
}

function carInitModel(obj) {
    if (!obj) return;

    if (obj.modelname == 'cybertruck2') {
        obj.wheelRL = obj.model.children[0].children[0].children[0].children[1];
        obj.wheelFL = obj.model.children[0].children[0].children[0].children[2];
        obj.wheelFR = obj.model.children[0].children[0].children[0].children[3];
        obj.wheelRR = obj.model.children[0].children[0].children[0].children[4];

        obj.wheelRL.rotation.order = "YXZ";
        obj.wheelFL.rotation.order = "YXZ";
        obj.wheelFR.rotation.order = "YXZ";
        obj.wheelRR.rotation.order = "YXZ";

        // console.log(obj);
    }
}