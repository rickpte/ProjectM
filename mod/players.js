import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

let firstUpdate = true;
let lastplayerchange = 0;
let players = [], myplayer;
let modelYBot, idleAnimY, walkingAnimY;
let modelXBot, idleAnimX, walkingAnimX;

projectm.addModule(
    'players',
    init,
    cleanup,
    update
);

function init() {
    loadPlayerModels();

    if (!projectm.settings.network) {
        addPlayer();
        myplayer = players[0];
        myplayer.position[2] = -2;
    }
}

function cleanup() {

}

function update(dt) {

    if (projectm.settings.network) {
        if (projectm.netstate.lastplayerchange != lastplayerchange) {
            lastplayerchange = projectm.netstate.lastplayerchange;

            let added = [];
            let deleted = [];

            for (let i = 0; i < players.length; i++) {
                let found = false;
                for (let j = 0; j < projectm.netstate.players.length; j++) {
                    if (players[i].id == projectm.netstate.players[j].id) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    deleted.push(i);
                }
            }

            for (let i = 0; i < projectm.netstate.players.length; i++) {
                let found = false;
                for (let j = 0; j < players.length; j++) {
                    if (projectm.netstate.players[i].id == players[j].id) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    added.push(i);
                }
            }

            // let added = projectm.netstate.players.filter(p => !players.some(x => x.id === p.id)).map(p => p.id);
            // let deleted = players.filter(p => !projectm.netstate.players.some(x => x.id === p.id)).map(p => p.id);

            for (let k = 0; k < deleted.length; k++) {
                projectm.log('deleting player ' + players[deleted[k]].id + ' ' + players[deleted[k]].name);

                players[k].group.remove(players[deleted[k]].model);
                projectm.three.scene.remove(players[deleted[k]].group);
                players.splice(deleted[k], 1);
            }
            for (let k = 0; k < added.length; k++) {
                projectm.log('adding player ' + projectm.netstate.players[added[k]].id + ' ' + projectm.netstate.players[added[k]].name);

                let idx = addPlayer();
                players[idx].id = projectm.netstate.players[added[k]].id;
                players[idx].name = projectm.netstate.players[added[k]].name;
                players[idx].modelname = projectm.netstate.players[added[k]].modelname;
            }
        }
    }

    if (!myplayer) {
        for (let i = 0; i < players.length; i++) {
            if (players[i].id == projectm.netplayer.player.id) {
                myplayer = players[i];
                projectm.log('found myplayer ' + myplayer.id);
            }
        }
    }

    if (projectm.gamestate.networkUpdate2) {
        for (let i = 0; i < projectm.netstate.players.length; i++) {

            for (let j = 0; j < players.length; j++) {
                if (players[j].id == projectm.netstate.players[i].id) {

                    players[j].time = projectm.netstate.players[i].time;
                    players[j].chat = projectm.netstate.players[i].chat;
                    players[j].chattime = projectm.netstate.players[i].chattime;
                    players[j].vehicleid = projectm.netstate.players[i].vehicleid;

                    if (myplayer && players[j].id == myplayer.id) {

                        if (firstUpdate) {
                            players[j].position[0] = projectm.netstate.players[i].x;
                            players[j].position[1] = projectm.netstate.players[i].y;
                            players[j].position[2] = projectm.netstate.players[i].z;
                            players[j].yaw = projectm.netstate.players[i].yaw;
                            firstUpdate = false;
                        }

                        projectm.netplayer.player.time = myplayer.time;

                    } else {
                        players[j].position[0] = projectm.netstate.players[i].x;
                        players[j].position[1] = projectm.netstate.players[i].y;
                        players[j].position[2] = projectm.netstate.players[i].z;
                        players[j].yaw = projectm.netstate.players[i].yaw;
                        players[j].walking = projectm.netstate.players[i].walking;
                        players[j].speed = projectm.netstate.players[i].speed;
                        players[j].turning = projectm.netstate.players[i].turning;
                        players[j].turnrate = projectm.netstate.players[i].turnrate;
                    }

                    break;
                }
            }
        }
        
        projectm.gamestate.networkUpdate2 = false;
    }

    checkControlMode();
    handleInput(dt);
    updatePlayers(dt);
    setNetplayer();
    setViewPivot(dt);
}

function setViewPivot(dt) {
    if (myplayer && projectm.gamestate.controlMode == 2) {
        projectm.three.viewPivot.position.x = myplayer.position[0];
        projectm.three.viewPivot.position.z = myplayer.position[2] + 4;
        projectm.three.viewPivot.rotation.y = 0;
    }
}

function checkControlMode() {
    if (myplayer && projectm.gamestate.controlMode == 1) {
        let dx = myplayer.position[0] - projectm.three.viewPivot.position.x;
        let dz = myplayer.position[2] - projectm.three.viewPivot.position.z;
        let dd = dx * dx + dz * dz;
        if (dd < 1) {
            projectm.setControlMode(2);
        }
    }
}

function handleInput(dt) {
    if (!myplayer) return;
    if (!myplayer.loaded) return;

    if (projectm.gamestate.controlMode == 2) {

        if (projectm.input.forwardAxis > .1 || projectm.input.forwardAxis < -.1) {
            myplayer.walking = true;
            myplayer.speed = projectm.input.forwardAxis * 1.7;
        } else {
            myplayer.walking = false;
            myplayer.speed = 0;
        }

        if (projectm.input.steerAxis > .1 || projectm.input.steerAxis < -.1) {
            myplayer.turning = true;
            myplayer.turnrate = projectm.input.steerAxis * 2;
        } else {
            myplayer.turning = false;
            myplayer.turnrate = 0;
        }
    } else {
        
        myplayer.walking = false;
        myplayer.speed = 0;
        myplayer.turning = false;
        myplayer.turnrate = 0;
    }
}

function updatePlayers(dt) {

    for (let i = 0; i < players.length; i++) {
        if (!players[i].loaded) {

            setPlayerModel(i);
        
        } else {

            if (players[i].vehicleid != 0) {
                players[i].group.visible = false;
            } else {
                players[i].group.visible = true;

                if (players[i].turning) {
                    players[i].yaw += dt * players[i].turnrate;
                }
                if (players[i].walking) {
                    players[i].position[0] += Math.sin(players[i].yaw) * dt * players[i].speed;
                    players[i].position[2] += Math.cos(players[i].yaw) * dt * players[i].speed;
                }

                players[i].group.position.x = players[i].position[0];
                players[i].group.position.y = players[i].position[1];
                players[i].group.position.z = players[i].position[2];
                players[i].group.rotation.y = players[i].yaw;

                if (players[i].mixer) {

                    if (players[i].walking) {
                        if (players[i].animation != 1)
                            setPlayerAnimation(players[i], 1);
                    } else {
                        if (players[i].animation != 0)
                            setPlayerAnimation(players[i], 0);
                    }

                    players[i].mixer.update(dt);
   
                    if (players[i].walking)
                        players[i].model.position.z = players[i].actions[1].time * -1.7;
                    else
                        players[i].model.position.z = 0;

                }
            }
        }
    }
}

function setNetplayer() {
    if (myplayer) {
        projectm.netplayer.player.x = myplayer.position[0];
        projectm.netplayer.player.y = myplayer.position[1];
        projectm.netplayer.player.z = myplayer.position[2];
        projectm.netplayer.player.yaw = myplayer.yaw;
        projectm.netplayer.player.walking = myplayer.walking;
        projectm.netplayer.player.speed = myplayer.speed;
        projectm.netplayer.player.turning = myplayer.turning;
        projectm.netplayer.player.turnrate = myplayer.turnrate;
    }
}

function setPlayerAnimation(player, anim) {
    if (player.loaded) {
        for (let i = 0; i < player.actions.length; i++) {
            if (i == anim) player.actions[i].play();
        }
        for (let i = 0; i < player.actions.length; i++) {
            if (i != anim)  player.actions[i].stop();
        }
        player.animation = anim;
    }
}

function addPlayer() {

    let player = {
        "id": 0,
        "name": "",
        "use": true,
        "loaded": false,
        "modelname": 'YBot',
        "position": [0, 0, 0],
        "actions": [],
        "animation": -1,
    };

    player.walking = false;
    player.speed = 0;
    player.turning = false;
    player.turnrate = 0;
    player.yaw = 0;
    player.chat = "";
    player.vehicleid = 0;

    let i = players.length;
    players[i] = player;

    return i;
}

function loadPlayerModels() {
    const loader1 = new FBXLoader();
    const loader2 = new GLTFLoader();

    loader1.load('data/models/Idle.fbx', function (fbx1) {

        projectm.log('loading Idle.fbx');
        idleAnimY = fbx1.animations[0];

        loader1.load('data/models/Walking.fbx', function (fbx2) {

            projectm.log('loading Walking.fbx');
            walkingAnimY = fbx2.animations[0];
            
            loader1.load('data/models/YBot.fbx', function (fbx3) {

                projectm.log('loading YBot.fbx');

                let model = fbx3;

                model.traverse( function ( object ) {
                    if ( object.isMesh ) object.castShadow = true;
                });

                model.scale.set(.01, .01, .01);
                // model.rotation.y = Math.PI;

                modelYBot = model;

                loader2.load('data/models/XBot.glb', function (gltf) {

                    projectm.log('loading XBot.glb');
            
                    let model = gltf.scene;
            
                    model.traverse(function (object) {
                        if (object.isMesh) object.castShadow = true;
                    });
            
                    // model.rotation.y = Math.PI;
            
                    modelXBot = model;
            
                    idleAnimX = gltf.animations[0];
                    walkingAnimX = gltf.animations[6];  
                
                    projectm.gamestate.modReadyCount++;
                });
            });
        });
    });

}

function setPlayerModel(i) {
    if (!(modelYBot && modelXBot)) return;

    if (players[i].modelname == "XBot") {
        players[i].model = SkeletonUtils.clone(modelXBot);
    } else {
        players[i].model = SkeletonUtils.clone(modelYBot);
    }

    const group = new THREE.Group();
    group.add(players[i].model);
    group.position.set(players[i].position[0], players[i].position[1], players[i].position[2]);

    players[i].group = group;
    players[i].mixer = new THREE.AnimationMixer(players[i].model);

    if (players[i].modelname == "XBot") {
        players[i].actions[0] = players[i].mixer.clipAction(idleAnimX);
        players[i].actions[1] = players[i].mixer.clipAction(walkingAnimX);
    } else {
        players[i].actions[0] = players[i].mixer.clipAction(idleAnimY);
        players[i].actions[1] = players[i].mixer.clipAction(walkingAnimY);
    }

    players[i].actions[0].play();
    players[i].animation = 0;
    players[i].mixer.update(0.01);
    players[i].loaded = true;

    projectm.three.scene.add(group);
}