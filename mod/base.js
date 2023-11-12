import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import {
	Euler,
	Vector3
} from 'three';

let inStartScreen = true;

let renderer, scene, camera, clock, stats;
let hemiLight, dirLight;
let canvasWidth, canvasHeight;
let playerPivot;

let playerStart = [0, 1.6, 0];
let camSpeed = [0, 0, 0];
let taskbarFocus = false;
let mouseLocked = false;
let camEuler = new Euler(0, 0, 0, 'YXZ');
let camVector = new Vector3();
const PI_2 = Math.PI / 2;
const minPolarAngle = 0; // radians
const maxPolarAngle = Math.PI; // radians
const pointerSpeed = 1.0;

let touchStartX, touchStartY, touchX, touchY;
let inTouchMove = false;

let controller1, controller2;
let controllerGrip1, controllerGrip2;
let cameraVector = new THREE.Vector3();
let prevGamePads = new Map();
let speedFactor = [0.2, 0.2, 0.2, 0.2];
let isSelecting = false;

let vrButtonStyle = 'position: absolute; bottom: 4px; left: calc(50% - 50px); width: 100px; padding: 12px 6px; border: 0px solid rgb(255, 255, 255); border-radius: 4px; background: rgba(0, 0, 0, 0.1); color: rgb(255, 255, 255); text-align: center; opacity: 0.5; outline: none; z-index: 30; cursor: pointer;';
let fsButtonStyle = 'position: absolute; bottom: 4px; left: calc(50% + 60px); width: 100px; padding: 12px 6px; border: 0px solid rgb(255, 255, 255); border-radius: 4px; background: rgba(0, 0, 0, 0.1); color: rgb(255, 255, 255); text-align: center; opacity: 0.5; outline: none; z-index: 30; cursor: pointer;';

const groundSize = 50;

function init() {
    setupGui();

    setupThree();
    setupMobile();
    setupVR();
    // setupPlatform();

    // projectm.addScript('origin');
    projectm.addScript('world');
    projectm.addScript('panels');
    projectm.addScript('dancer');
    projectm.addScript('scenery');
}

function logFunc(msg) {
    projectm.logstate.lines[projectm.logstate.idx++] = msg;
    
    document.getElementById('console-text').innerHTML += msg + '<br>';
    document.getElementById('console-view').scrollIntoView();
}

function setControlMode(mode) {
    switch (mode) {
        case 1:
            projectm.log('Switching to Desktop mode');
            break;
        case 2:
            projectm.log('Switching to Mobile mode');
            break;
        case 3:
            projectm.log('Switching to VR mode');
            break;
    }
    projectm.controlMode = mode;
}

function executeCommand(cmd) {
    projectm.log(cmd);
    const args = cmd.split(" ");

    if (args.length > 0) {
        switch (args[0]) {
            case "load":
                if (args.length > 1) {
                    projectm.log('loading ' + args[1]);
                    projectm.addScript(args[1]);
                }
                break;
            case "test":
                console.log('test command');
                break;
            default:
                projectm.log('command not found');
                break;
        }
    }
}

function setupGui() {
    const fsButton = document.createElement('button');
    fsButton.textContent = 'FULLSCREEN';
    fsButton.style = fsButtonStyle;
    fsButton.addEventListener('mouseenter', function () {
        this.style.opacity = 1;
    });
    fsButton.addEventListener('mouseleave', function () {
        this.style.opacity = .5;
    });
    fsButton.addEventListener('click', () => {
        setFullscreen();
    });
    document.body.appendChild(fsButton);

    instructions.addEventListener( 'click', function () {
        closeStartScreen();
    });  
    instructions.addEventListener( 'touchstart', function () {
        closeStartScreen();
    });  

    // setTimeout(checkXRButton, 100);
}

function checkXRButton() {
    for (let i = 0; i < document.body.children.length; i++) {
        if (document.body.children[i].innerHTML == "WEBXR NOT AVAILABLE") {
            document.body.children[i].innerHTML = "NO WEBXR";
            document.body.children[i].style.display = 'none';
        }
    }
}

function closeStartScreen() {
    instructions.style.display = 'none';
    blocker.style.display = 'none';
    inStartScreen = false;
}

// Three rendering

function setupThree() {
    projectm.logFunc = logFunc;
    clock = new THREE.Clock();
    let container = document.getElementById('three-div');

    projectm.log('Initializing Three');

    renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    stats = new Stats();
    stats.dom.style.cssText = 'position:absolute; bottom:0px; right:0px;';
    container.appendChild( stats.dom );

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xCCCCCC);

    playerPivot = new THREE.Object3D();
    playerPivot.position.set(playerStart[0], playerStart[1], playerStart[2]);
    playerPivot.rotation.order = "YXZ";
    scene.add(playerPivot);

    // camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);
    playerPivot.add(camera);

    hemiLight = new THREE.HemisphereLight(0xCCCCCC, 0x444444);
    scene.add(hemiLight);

    dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(100, 100, 0);
    dirLight.castShadow = true;
	dirLight.shadow.camera.top = 100;
	dirLight.shadow.camera.bottom = -100;
	dirLight.shadow.camera.right = 100;
	dirLight.shadow.camera.left = -100;
	dirLight.shadow.mapSize.set(4096, 4096);
    scene.add(dirLight);

    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('pointerlockchange', onPointerlockChange);
    document.addEventListener('pointerlockerror', onPointerlockError);

    projectm.renderer = renderer;
    projectm.scene = scene;

    onWindowResize();
    renderer.setAnimationLoop(frame);
}

function setFullscreen() {
    projectm.log('setFullscreen');
	
    var elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

function onWindowResize() {
    canvasWidth = window.innerWidth - 1;
    canvasHeight = window.innerHeight - 1;
    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasWidth, canvasHeight);
    
    document.getElementById('console').canvasHeight = canvasHeight - 100;
}

function frame() {
    let dt = clock.getDelta();
    if (dt > .1) dt = .1;

    update(dt);
    render();
}

function update(dt) {
    stats.update();

    if (renderer.xr.isPresenting && projectm.controlMode != 3) setControlMode(3);

    if (projectm.controlMode == 1) {
        moveWithKeys(dt);
    } else if (projectm.controlMode == 2) {
        moveWithMobile(dt);
    } else if (projectm.controlMode == 3) {
        moveWithVR();
    }

    for (let i = 0; i < projectm.mods.length; i++) {
        if (projectm.mods[i].loaded) {
            projectm.mods[i].updateFunc(dt);
        } else {
            projectm.mods[i].loaded = true;
            projectm.mods[i].initFunc();
        }
    }

}

function render(time) {

    renderer.render(scene, camera);
}

// Desktop controls

function onKeyDown(evt) {
    if (inStartScreen) return;
    if (projectm.gamestate.modHasInput) return;

    if (taskbarFocus) {
        if (evt.code == "Enter") {
            let cmd = document.getElementById('commandText').value;
            executeCommand(cmd);
            document.getElementById('commandText').value = '';
        }
    } else {
        if (!(evt.code == "F11" || evt.code == "F12")) {
            evt.preventDefault();
        }

        if (evt.code.startsWith('Key')) {
            if (evt.code == "KeyW") projectm.input.keyW = true;
            else if (evt.code == "KeyA") projectm.input.keyA = true;
            else if (evt.code == "KeyS") projectm.input.keyS = true;
            else if (evt.code == "KeyD") projectm.input.keyD = true;
            else if (evt.code == "KeyR") projectm.input.keyR = true;
            else if (evt.code == "KeyF") projectm.input.keyF = true;
            else if (evt.code == "KeyQ") projectm.input.keyQ = true;
            else if (evt.code == "KeyE") projectm.input.keyE = true;
            else if (evt.code == "KeyO") projectm.log(playerPivot.position.x + ', ' + playerPivot.position.y + ', ' + playerPivot.position.z);
            else if (evt.code == "KeyP") console.log(projectm);
        } else if (evt.code.startsWith('Digit')) {
            if (evt.code == "Digit1") setControlMode(1);
            else if (evt.code == "Digit2") setControlMode(2);
            else if (evt.code == "Digit3") setControlMode(3);
        } else if (evt.code.startsWith('Arrow')) {
            if (evt.code == "ArrowLeft") projectm.input.playerLeft = true;
            else if (evt.code == "ArrowRight") projectm.input.playerRight = true;
            else if (evt.code == "ArrowUp") projectm.input.playerForward = true;
            else if (evt.code == "ArrowDown") projectm.input.playerBack = true;
        } else {
            // projectm.log(evt.code);
        }
    }
}
  
function onKeyUp(evt) {
    if (projectm.gamestate.modHasInput) return;

    if (!(evt.code == "F11" || evt.code == "F12")) {
        evt.preventDefault();
    }

    if (evt.code.startsWith('Key')) {
        if (evt.code == "KeyW") projectm.input.keyW = false;
        else if (evt.code == "KeyA") projectm.input.keyA = false;
        else if (evt.code == "KeyS") projectm.input.keyS = false;
        else if (evt.code == "KeyD") projectm.input.keyD = false;
        else if (evt.code == "KeyR") projectm.input.keyR = false;
        else if (evt.code == "KeyF") projectm.input.keyF = false;
        else if (evt.code == "KeyQ") projectm.input.keyQ = false;
        else if (evt.code == "KeyE") projectm.input.keyE = false;
    } else if (evt.code.startsWith('Arrow')) {
        if (evt.code == "ArrowLeft") projectm.input.playerLeft = false;
        else if (evt.code == "ArrowRight") projectm.input.playerRight = false;
        else if (evt.code == "ArrowUp") projectm.input.playerForward = false;
        else if (evt.code == "ArrowDown") projectm.input.playerBack = false;
    }
}

function onMouseDown(event) {
    if (inStartScreen) return;
    if (projectm.gamestate.modHasInput) return;

    if (!mouseLocked) {
		if (event.clientY > canvasHeight - document.getElementById('taskbar').clientHeight) {
			taskbarFocus = true;
        } else {
            taskbarFocus = false;
            document.body.requestPointerLock();
        }
    }
}

function onMouseUp(evt) {
    if (projectm.gamestate.modHasInput) return;
    // evt.preventDefault();
    // mouseLeftDown = false;
}

function onMouseMove(event) {
    if (projectm.gamestate.modHasInput) return;
    if (mouseLocked) {
        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        
        camEuler.setFromQuaternion(playerPivot.quaternion);

        camEuler.y -= movementX * 0.002 * pointerSpeed;
        camEuler.x -= movementY * 0.002 * pointerSpeed;

        camEuler.x = Math.max(PI_2 - maxPolarAngle, Math.min(PI_2 - minPolarAngle, camEuler.x));

        playerPivot.quaternion.setFromEuler(camEuler);
    }
}

function onPointerlockChange() {
    if (document.body.ownerDocument.pointerLockElement === document.body) {
        console.log('mouse locked');
        mouseLocked = true;
        setControlMode(1);
	} else {
        console.log('mouse unlocked');
        mouseLocked = false;
    }
}

function onPointerlockError() {

	console.error( 'Unable to use Pointer Lock API' );

}

function moveWithKeys(dt) {
    const acc = 10;
    const max = 20;
    const cap = 1;

    if (projectm.input.keyW) {
        if (camSpeed[2] < max) camSpeed[2] += dt * -acc;
    }
    if (projectm.input.keyS) {
        if (camSpeed[2] > -max) camSpeed[2] -= dt * -acc;
    }
    if (!projectm.input.keyW && !projectm.input.keyS) {
        if (camSpeed[2] > cap) camSpeed[2] -= dt * acc;
        else if (camSpeed[2] < -cap) camSpeed[2] += dt * acc;
        else camSpeed[2] = 0;
    }

    if (projectm.input.keyA) {
        if (camSpeed[0] < max) camSpeed[0] -= dt * acc;
    }
    if (projectm.input.keyD) {
        if (camSpeed[0] > -max) camSpeed[0] += dt * acc;
    }
    if (!projectm.input.keyA && !projectm.input.keyD) {
        if (camSpeed[0] > cap) camSpeed[0] -= dt * acc;
        else if (camSpeed[0] < -cap) camSpeed[0] += dt * acc;
        else camSpeed[0] = 0;
    }

    if (projectm.input.keyR) {
        if (camSpeed[1] < max) camSpeed[1] += dt * acc;
    }
    if (projectm.input.keyF) {
        if (camSpeed[1] > -max) camSpeed[1] -= dt * acc;
    }
    if (!projectm.input.keyR && !projectm.input.keyF) {
        if (camSpeed[1] > cap) camSpeed[1] -= dt * acc;
        else if (camSpeed[1] < -cap) camSpeed[1] += dt * acc;
        else camSpeed[1] = 0;
    }

    if (projectm.input.keyQ) {
        playerPivot.rotation.y += 1 * dt;
    }
    if (projectm.input.keyE) {
        playerPivot.rotation.y -= 1 * dt;
    }

    camVector.setFromMatrixColumn(playerPivot.matrix, 2);
    playerPivot.position.addScaledVector(camVector, camSpeed[2] * dt);

    camVector.setFromMatrixColumn(playerPivot.matrix, 0);
    playerPivot.position.addScaledVector(camVector, camSpeed[0] * dt);

    playerPivot.position.addScaledVector(camera.up, camSpeed[1] * dt);
}

// Mobile controls

function setupMobile() {

    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });

}

function onTouchStart(evt) {
    if (inStartScreen) return;
    // if (projectm.gamestate.modHasInput) return;
    
    if (projectm.controlMode != 2) setControlMode(2);
	
    const touches = evt.touches;
    for (let i = 0; i < touches.length; i++) {
        let x = Math.floor(touches[i].pageX);
        let y = Math.floor(touches[i].pageY);

        if (y < canvasHeight - document.getElementById('taskbar').clientHeight) {
            evt.preventDefault();

            touchX = x;
            touchY = y;
            touchStartX = touchX;
            touchStartY = touchY;
            inTouchMove = true;

            // console.log('touch start: ' + touchX + ', ' + touchY);
        }
    }
}

function onTouchMove(evt) {
    // if (projectm.gamestate.modHasInput) return;
    // evt.preventDefault();

    const touches = evt.touches;
    for (let i = 0; i < touches.length; i++) {
        let x = Math.floor(touches[0].pageX);
        let y = Math.floor(touches[0].pageY);

        touchX = x;
        touchY = y;
        // console.log('touch move: ' + touchX + ', ' + touchY);
    }
}

function onTouchEnd(evt) {
    // if (projectm.gamestate.modHasInput) return;
    // evt.preventDefault();

    // console.log('touch end');
    inTouchMove = false;
}

function moveWithMobile(dt) {
    // const acc = 10;
    // const max = 20;
    // const cap = 1;

    // if (projectm.input.keyW) {
    //     if (camSpeed[2] < max) camSpeed[2] += dt * -acc;
    // }
    // if (projectm.input.keyS) {
    //     if (camSpeed[2] > -max) camSpeed[2] -= dt * -acc;
    // }
    // if (!projectm.input.keyW && !projectm.input.keyS) {
    //     if (camSpeed[2] > cap) camSpeed[2] -= dt * acc;
    //     else if (camSpeed[2] < -cap) camSpeed[2] += dt * acc;
    //     else camSpeed[2] = 0;
    // }

    // if (projectm.input.keyA) {
    //     if (camSpeed[0] < max) camSpeed[0] -= dt * acc;
    // }
    // if (projectm.input.keyD) {
    //     if (camSpeed[0] > -max) camSpeed[0] += dt * acc;
    // }
    // if (!projectm.input.keyA && !projectm.input.keyD) {
    //     if (camSpeed[0] > cap) camSpeed[0] -= dt * acc;
    //     else if (camSpeed[0] < -cap) camSpeed[0] += dt * acc;
    //     else camSpeed[0] = 0;
    // }

    if (inTouchMove) {
        let dx = touchX - touchStartX;
        let da = dx * -.02;

        playerPivot.rotation.y += da * dt;

        let dy = touchY - touchStartY;
        camSpeed[2] = dy * .05;

        camVector.setFromMatrixColumn(playerPivot.matrix, 2);
        playerPivot.position.addScaledVector(camVector, camSpeed[2] * dt);

        // camVector.setFromMatrixColumn(playerPivot.matrix, 0);
        // playerPivot.position.addScaledVector(camVector, camSpeed[0] * dt);

        // playerPivot.position.addScaledVector(camera.up, camSpeed[1] * dt);
    }
}

// VR Controllers

function setupVR() {
    projectm.log('Initializing VR');

    renderer.xr.enabled = true;
	renderer.xr.setFramebufferScaleFactor(2.0);         // increases the resolution on Quest
    renderer.xr.setReferenceSpaceType('local');         // default is local floor

    let vrbutton = VRButton.createButton(renderer);
    vrbutton.style = vrButtonStyle;
    document.body.appendChild(vrbutton);

    setupControllers();
}

function setupControllers() {
    controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    controller1.addEventListener( 'connected', function ( event ) {
        this.add(buildController(event.data));
    } );
    controller1.addEventListener( 'disconnected', function () {
        this.remove(this.children[0]);
    });
	controller1.addEventListener("squeezestart", onSqueezeEvent);
	controller1.addEventListener("squeeze", onSqueezeEvent);
	controller1.addEventListener("squeezeend", onSqueezeEvent);
    playerPivot.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
    controller2.addEventListener( 'connected', function ( event ) {
        this.add(buildController(event.data));
    } );
    controller2.addEventListener( 'disconnected', function () {
        this.remove(this.children[0]);
    } );
	controller2.addEventListener("squeezestart", onSqueezeEvent);
	controller2.addEventListener("squeeze", onSqueezeEvent);
	controller2.addEventListener("squeezeend", onSqueezeEvent);
    playerPivot.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    playerPivot.add(controllerGrip1);

    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    playerPivot.add(controllerGrip2);
}

function buildController( data ) {
    let geometry, material;

    switch ( data.targetRayMode ) {

        case 'tracked-pointer':
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
            geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

            material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );

            return new THREE.Line( geometry, material );

        case 'gaze':
            geometry = new THREE.RingGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
            material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
            return new THREE.Mesh( geometry, material );
    }
}

function onSelectStart() {
    isSelecting = true;
}

function onSelectEnd() {
    isSelecting = false;
}

function onSqueezeEvent(event) {
    let source = event.data;
    
    console.log(event);
    console.log(source);

	if (source.targetRayMode != "tracked-pointer") {
		return;
	}

	// let targetRayPose = event.frame.getPose(source.targetRaySpace, myRefSpace);
	// if (!targetRayPose) {
	// 	return;
	// }

	switch (event.type) {
		case "squeezestart":
			break;
		case "squeeze":
			// source.gamepad.hapticActuators[0].pulse(1, 100);
			break;
		case "squeezeend":
			break;
	}
}

function moveWithVR() {
    var handedness = "unknown";

    if (renderer.xr.isPresenting) {
        camera.getWorldDirection(cameraVector);
        
        let session = renderer.xr.getSession();

        for (const source of session.inputSources) {
            if (source && source.handedness) {
                handedness = source.handedness; // left or right controllers
            }
            if (!source.gamepad) continue;

            const old = prevGamePads.get(source);
            const data = {
                handedness: handedness,
                buttons: source.gamepad.buttons.map((b) => b.value),
                axes: source.gamepad.axes.slice(0)
            };
            if (old) {
                data.buttons.forEach((value, i) => {
                    if (value !== old.buttons[i] || Math.abs(value) > 0.8) {
                        if (value === 1) {
                            console.log("Button " + i + " Down");

                            if (data.handedness == "left") {
                                console.log("Left Paddle Down");
                            } else {
                                console.log("Right Paddle Down");
                            }
                        } else {
                            console.log("Button " + i + " Up");

                            if (i == 1) {
                                if (data.handedness == "left") {
                                    console.log("Left Paddle Down");
                                } else {
                                    console.log("Right Paddle Down");
                                }
                            }
                        }
                    }
                });

                data.axes.forEach((value, i) => {
                    //handlers for thumbsticks
                    //if thumbstick axis has moved beyond the minimum threshold from center, windows mixed reality seems to wander up to about .17 with no input
                    if (Math.abs(value) > 0.2) {
                        //set the speedFactor per axis, with acceleration when holding above threshold, up to a max speed
                        speedFactor[i] > 1 ? (speedFactor[i] = 1) : (speedFactor[i] *= 1.005);
                        // console.log(value, speedFactor[i], i);
                        if (i == 2) {
                            //left and right axis on thumbsticks
                            if (data.handedness == "left") {
                                // (data.axes[2] > 0) ? console.log('left on left thumbstick') : console.log('right on left thumbstick')

                                //move our playerPivot
                                //we reverse the vectors 90degrees so we can do straffing side to side movement
                                playerPivot.position.x -= cameraVector.z * speedFactor[i] * data.axes[2];
                                playerPivot.position.z += cameraVector.x * speedFactor[i] * data.axes[2];

                                //provide haptic feedback if available in browser
                                // if (
                                //     source.gamepad.hapticActuators &&
                                //     source.gamepad.hapticActuators[0]
                                // ) {
                                //     var pulseStrength = Math.abs(data.axes[2]) + Math.abs(data.axes[3]);
                                //     if (pulseStrength > 0.75) {
                                //         pulseStrength = 0.75;
                                //     }

                                //     var didPulse = source.gamepad.hapticActuators[0].pulse(
                                //         pulseStrength,
                                //         100
                                //     );
                                // }
                            } else {
                                // (data.axes[2] > 0) ? console.log('left on right thumbstick') : console.log('right on right thumbstick')
                                playerPivot.rotateY(-THREE.MathUtils.degToRad(data.axes[2]));
                            }
                            // controls.update();
                        }

                        if (i == 3) {
                            //up and down axis on thumbsticks
                            if (data.handedness == "left") {
                                // (data.axes[3] > 0) ? console.log('up on left thumbstick') : console.log('down on left thumbstick')
                                playerPivot.position.y -= speedFactor[i] * data.axes[3];
                                //provide haptic feedback if available in browser
                                // if (
                                //     source.gamepad.hapticActuators &&
                                //     source.gamepad.hapticActuators[0]
                                // ) {
                                //     var pulseStrength = Math.abs(data.axes[3]);
                                //     if (pulseStrength > 0.75) {
                                //         pulseStrength = 0.75;
                                //     }
                                //     var didPulse = source.gamepad.hapticActuators[0].pulse(
                                //         pulseStrength,
                                //         100
                                //     );
                                // }
                            } else {
                                // (data.axes[3] > 0) ? console.log('up on right thumbstick') : console.log('down on right thumbstick')
                                playerPivot.position.x -= cameraVector.x * speedFactor[i] * data.axes[3];
                                playerPivot.position.z -= cameraVector.z * speedFactor[i] * data.axes[3];

                                //provide haptic feedback if available in browser
                                // if (
                                //     source.gamepad.hapticActuators &&
                                //     source.gamepad.hapticActuators[0]
                                // ) {
                                //     var pulseStrength = Math.abs(data.axes[2]) + Math.abs(data.axes[3]);
                                //     if (pulseStrength > 0.75) {
                                //         pulseStrength = 0.75;
                                //     }
                                //     var didPulse = source.gamepad.hapticActuators[0].pulse(
                                //         pulseStrength,
                                //         100
                                //     );
                                // }
                            }
                            // controls.update();
                        }
                    } else {
                        //axis below threshold - reset the speedFactor
                        if (Math.abs(value) > 0.05) {
                            console.log(
                                "speedFactor getting reset as value not zero but threshold not met",
                                value,
                                speedFactor[i],
                                i
                            );
                            speedFactor[i] = 0.05;
                        }
                    }
                });
            }
            prevGamePads.set(source, data);
        }
    }
}

// Platform

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
	scene.add(floor);

    const grid = new THREE.GridHelper(groundSize, groundSize);
    scene.add(grid);

}

// Initialize

init();

