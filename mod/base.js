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
let inTextInput = false;

let viewPivot;
let playerStart = [0, 1.6, 5];
let camSpeed = 20;

let mouseLocked = false;
let camMouseX = 0, camMouseY = 0;
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

let vrButtonStyle = 'position: absolute; bottom: 4px; left: calc(50% - 50px); width: 100px; padding: 12px 6px; border: 0px solid rgb(255, 255, 255); border-radius: 4px; background: rgba(0, 0, 0, 0.1); color: rgb(255, 255, 255); text-align: center; opacity: 0.5; outline: none; z-index: 30; cursor: pointer;';
let fsButtonStyle = 'position: absolute; bottom: 4px; left: calc(50% + 60px); width: 100px; padding: 12px 6px; border: 0px solid rgb(255, 255, 255); border-radius: 4px; background: rgba(0, 0, 0, 0.1); color: rgb(255, 255, 255); text-align: center; opacity: 0.5; outline: none; z-index: 30; cursor: pointer;';

let credits = [
    'Kleeblatt Quest Home (https://skfb.ly/o7ToG) by fangzhangmnm',
    'is licensed under Creative Commons Attribution',
    'Tesla Cybertruck (https://skfb.ly/6SB7n) by Lexyc16',
    'is licensed under Creative Commons Attribution',
    'SpaceX Falcon 9 Block 4.5 (https://skfb.ly/6soI9) by Forest Katsch',
    'is licensed under Creative Commons Attribution - NonCommercial'
];


// Initialize
init();

function init() {
    projectm.logFunc = logFunc;
    projectm.chatFunc = chatFunc;
    projectm.log('ProjectM', 4);

    if (window.location.hostname == 'localhost') closeStartScreen();
    setupGui();

    setupThree();
    setupMobile();
    setupVR();

    projectm.addModuleScript('world');
    projectm.addModuleScript('panels');
    projectm.addModuleScript('network');
    projectm.addModuleScript('players');
    projectm.addModuleScript('vehicles');

    projectm.addGameScript('home');
    projectm.addGameScript('rockets');

    credits.forEach(credit => projectm.log(credit));
}

function logFunc(msg) {
    projectm.logstate.lines[projectm.logstate.idx++] = msg;
    document.getElementById('console-text').innerHTML += msg + '<br>';
    document.getElementById('console-view').scrollIntoView();
}

function chatFunc(msg) {
    projectm.chatstate.lines[projectm.chatstate.idx++] = msg;
    document.getElementById('chat-text').innerHTML += msg + '<br>';
    document.getElementById('chat-view').scrollIntoView();
}

function updateModuleState() {
    for (let i = 0; i < projectm.modules.length; i++) {
        if (!projectm.modules[i].active) {
            projectm.modules[i].initFunc();
            projectm.modules[i].active = true;
            projectm.log('loaded module ' + projectm.modules[i].name);
        }
    }
}

function updateGameState() {
    let campos = viewPivot.position.clone();

    for (let i = 0; i < projectm.games.length; i++) {
        let game = projectm.games[i];

        if (!game.active) {

            projectm.log('activating game ' + game.name);

            if (game.mins[0] == 0 && game.mins[1] == 0 && game.mins[2] == 0 &&
                game.maxs[0] == 0 && game.maxs[1] == 0 && game.maxs[2] == 0) {
                
                projectm.log('game always visible');
                game.alwaysVisible = true;
            
            } else {

                let bbmin = new THREE.Vector3(game.mins[0], game.mins[1], game.mins[2]);
                let bbmax = new THREE.Vector3(game.maxs[0], game.maxs[1], game.maxs[2]);
                game.box = new THREE.Box3(bbmin, bbmax);
                game.boxes = [];

                for (let i = 0; i < game.drawdist.length; i++) {
                    let bbmin0 = new THREE.Vector3(game.mins[0] - game.drawdist[i], game.mins[1] - game.drawdist[i], game.mins[2] - game.drawdist[i]);
                    let bbmax0 = new THREE.Vector3(game.maxs[0] + game.drawdist[i], game.maxs[1] + game.drawdist[i], game.maxs[2] + game.drawdist[i]);
                    game.boxes[i] = new THREE.Box3(bbmin0, bbmax0);
                }

                if (projectm.settings.boxes) {
                    let boxHelper = new THREE.Box3Helper(game.box, 0xffffff);
                    scene.add(boxHelper);

                    let color = 0x0000ff;
                    for (let i = 0; i < game.boxes.length; i++) {
                        let boxHelper0 = new THREE.Box3Helper(game.boxes[i], color);
                        color *= 100;
                        scene.add(boxHelper0);
                    }
                }
            }

            game.viewLevel = -1;
            game.active = true;
            // console.log(game);
        }

        let oldViewLevel = game.viewLevel;
        let newViewLevel = -1;

        if (game.alwaysVisible) {

            if (!game.loaded) {
                projectm.log('calling init for game: ' + game.name);
                game.initFunc();
                game.loaded = true;
                game.viewLevel = 0;
            }

        } else {

            for (let i = game.boxes.length - 1; i >= 0; i--) {
                if (game.boxes[i].containsPoint(campos)) {
                    newViewLevel = i;
                } else {
                    break;
                }
            }

            if (newViewLevel >= 0 && oldViewLevel == -1) {
                if (!game.loaded) {
                    projectm.log('init func game ' + game.name);
                    game.initFunc();
                    game.loaded = true;
                }
            }

            if (newViewLevel != oldViewLevel) {
                projectm.log(game.name + ' viewLevel: ' + newViewLevel);
                game.viewLevel = newViewLevel;
                if (game.viewLevelFunc) game.viewLevelFunc(newViewLevel);
            }
        }
    }
}

function executeCommand(cmd) {
    projectm.log(cmd);
    const args = cmd.split(" ");

    if (args.length > 0) {
        switch (args[0]) {
            case "/mod":
                if (args.length > 1) {
                    projectm.addModuleScript(args[1]);
                }
                break;
            case "/game":
                if (args.length > 1) {
                    projectm.addGameScript(args[1]);
                }
                break;
            case "/test":
                projectm.log('test command', 4);
                break;
            default:
                projectm.log('command not found', 4);
                break;
        }
    }
}

function chatMessage(s) {
    if (projectm.settings.network) {
        projectm.netplayer.player.chat = s;
        projectm.netplayer.player.chattime = projectm.netplayer.player.time;
    } else {
        projectm.chat('Guest1: ' + s);
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

    document.getElementById('commandText').addEventListener('focus', function () {
        inTextInput = true;
    });
    document.getElementById('commandText').addEventListener('blur', function () {
        inTextInput = false;
    });

    setTimeout(checkXRButton, 100);
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
    clock = new THREE.Clock();
    let container = document.getElementById('three-div');

    projectm.log('Initializing Three', 1);

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
    if (projectm.settings.fog) scene.fog = new THREE.Fog( 0xaaaa00, 20, 50 );

    viewPivot = new THREE.Object3D();
    viewPivot.position.set(playerStart[0], playerStart[1], playerStart[2]);
    viewPivot.rotation.order = "YXZ";
    scene.add(viewPivot);

    // camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);
    viewPivot.add(camera);

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

    projectm.three.camera = camera;
    projectm.three.renderer = renderer;
    projectm.three.scene = scene;
    projectm.three.viewPivot = viewPivot;

    onWindowResize();
    renderer.setAnimationLoop(frame);
}

function setFullscreen() {
    projectm.log('setFullscreen', 1);
	
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
}

function frame() {
    let dt = clock.getDelta();
    if (dt > .1) dt = .1;

    update(dt);
    render();
}

function update(dt) {
    stats.update();

    if (renderer.xr.isPresenting && projectm.gamestate.deviceMode != 3) projectm.setDeviceMode(3);

    if (projectm.gamestate.deviceMode == 1) {
        moveWithKeys(dt);
    } else if (projectm.gamestate.deviceMode == 2) {
        moveWithMobile(dt);
    } else if (projectm.gamestate.deviceMode == 3) {
        moveWithVR();
    }

    updateViewPosition(dt);

    updateModuleState();

    if (projectm.gamestate.modReadyCount == projectm.modules.length) {
        projectm.gamestate.frameCount++;
        
        if (projectm.gamestate.frameCount > 60) {

            for (let i = 0; i < projectm.modules.length; i++) {
                if (projectm.modules[i].updateFunc) projectm.modules[i].updateFunc(dt);
            }

            updateGameState();
            for (let i = 0; i < projectm.games.length; i++) {
                if (projectm.games[i].updateFunc) projectm.games[i].updateFunc(dt);
            }
        }
    }

    

}

function updateViewPosition(dt) {

    if (projectm.gamestate.controlMode == 1) {

        camEuler.setFromQuaternion(viewPivot.quaternion);
        camEuler.y -= camMouseY;
        camEuler.x -= camMouseX;
        camEuler.x = Math.max(PI_2 - maxPolarAngle, Math.min(PI_2 - minPolarAngle, camEuler.x));

        viewPivot.quaternion.setFromEuler(camEuler);

        camMouseX = 0;
        camMouseY = 0;

        viewPivot.rotation.y += projectm.input.steerAxis * dt * 2;

        camVector.setFromMatrixColumn(viewPivot.matrix, 2);
        viewPivot.position.addScaledVector(camVector, projectm.input.forwardAxis * dt * -camSpeed);

        camVector.setFromMatrixColumn(viewPivot.matrix, 0);
        viewPivot.position.addScaledVector(camVector, projectm.input.strafeAxis * dt * camSpeed);

        viewPivot.position.addScaledVector(camera.up, projectm.input.upAxis * dt * camSpeed);
    }
}

function render(time) {

    renderer.render(scene, camera);

}

// Desktop controls

function onKeyDown(evt) {

    if (inStartScreen) return;
    if (projectm.gamestate.gameHasInput) return;

    if (inTextInput) {
        if (evt.code == "Enter") {
            let s = document.getElementById('commandText').value;
            if (s.startsWith('/')) {
                executeCommand(s);
            } else {
                chatMessage(s);
            }
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
            else if (evt.code == "KeyO") projectm.log(viewPivot.position.x + ', ' + viewPivot.position.y + ', ' + viewPivot.position.z);
            else if (evt.code == "KeyP") console.log(projectm);
        } else if (evt.code.startsWith('Digit')) {
            if (evt.code == "Digit1") projectm.setControlMode(1);
            else if (evt.code == "Digit2") projectm.setControlMode(2);
            else if (evt.code == "Digit3") projectm.setControlMode(3);
        } else if (evt.code.startsWith('Arrow')) {
            if (evt.code == "ArrowLeft") projectm.input.keyLeft = true;
            else if (evt.code == "ArrowRight") projectm.input.keyRight = true;
            else if (evt.code == "ArrowUp") projectm.input.keyForward = true;
            else if (evt.code == "ArrowDown") projectm.input.keyBack = true;
        } else if (evt.code == "Tab") {
            if (document.getElementById('console').style.display == 'none')
                document.getElementById('console').style.display = 'block';
            else
                document.getElementById('console').style.display = 'none';
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
        if (evt.code == "ArrowLeft") projectm.input.keyLeft = false;
        else if (evt.code == "ArrowRight") projectm.input.keyRight = false;
        else if (evt.code == "ArrowUp") projectm.input.keyForward = false;
        else if (evt.code == "ArrowDown") projectm.input.keyBack = false;
    }
}

function onMouseDown(event) {
    if (inStartScreen) return;
    if (projectm.gamestate.modHasInput) return;

    if (!mouseLocked) {
        if (event.clientY > canvasHeight - document.getElementById('taskbar').clientHeight) {
        } else {
            document.body.requestPointerLock();
        }
    }
}

function onMouseUp(evt) {
    if (projectm.gamestate.modHasInput) return;
    // evt.preventDefault();
}

function onMouseMove(event) {
    if (projectm.gamestate.modHasInput) return;
    if (mouseLocked) {
        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        camMouseX += movementY * 0.002 * pointerSpeed;
        camMouseY += movementX * 0.002 * pointerSpeed;
    }
}

function onPointerlockChange() {
    if (document.body.ownerDocument.pointerLockElement === document.body) {
        projectm.log('mouse locked', 1);
        mouseLocked = true;
        projectm.setDeviceMode(1);
	} else {
        projectm.log('mouse unlocked', 1);
        mouseLocked = false;
        viewPivot.rotation.x = 0;
    }
}

function onPointerlockError() {

    projectm.log('Unable to use Pointer Lock API', 4);

}

function moveWithKeys(dt) {

    let f = 4;

    if (!(projectm.input.keyForward || projectm.input.keyBack || projectm.input.keyW || projectm.input.keyS)) {
        if (projectm.input.forwardAxis > .1) projectm.input.forwardAxis -= dt * f;
        else if (projectm.input.forwardAxis < -.1) projectm.input.forwardAxis += dt * f;
        else projectm.input.forwardAxis = 0;
    } else {
        if (projectm.input.keyForward || projectm.input.keyW) {
            if (projectm.input.forwardAxis < 1) projectm.input.forwardAxis += dt * f;
            if (projectm.input.forwardAxis > 1) projectm.input.forwardAxis = 1;
        }
        if (projectm.input.keyBack || projectm.input.keyS) {
            if (projectm.input.forwardAxis > -1) projectm.input.forwardAxis -= dt * f;
            if (projectm.input.forwardAxis < -1) projectm.input.forwardAxis = -1;
        }
    }

    if (!(projectm.input.keyLeft || projectm.input.keyRight || projectm.input.keyQ || projectm.input.keyE)) {
        if (projectm.input.steerAxis > .1) projectm.input.steerAxis -= dt * f;
        else if (projectm.input.steerAxis < -.1) projectm.input.steerAxis += dt * f;
        else projectm.input.steerAxis = 0;
    } else {
        if (projectm.input.keyLeft || projectm.input.keyQ) {
            if (projectm.input.steerAxis < 1) projectm.input.steerAxis += dt * f;
            if (projectm.input.steerAxis > 1) projectm.input.steerAxis = 1;
        }
        if (projectm.input.keyRight || projectm.input.keyE) {
            if (projectm.input.steerAxis > -1) projectm.input.steerAxis -= dt * f;
            if (projectm.input.steerAxis < -1) projectm.input.steerAxis = -1;
        }
    }

    if (!(projectm.input.keyA || projectm.input.keyD)) {
        if (projectm.input.strafeAxis > .1) projectm.input.strafeAxis -= dt * f;
        else if (projectm.input.strafeAxis < -.1) projectm.input.strafeAxis += dt * f;
        else projectm.input.strafeAxis = 0;
    } else {
        if (projectm.input.keyD) {
            if (projectm.input.strafeAxis < 1) projectm.input.strafeAxis += dt * f;
            if (projectm.input.strafeAxis > 1) projectm.input.strafeAxis = 1;
        }
        if (projectm.input.keyA) {
            if (projectm.input.strafeAxis > -1) projectm.input.strafeAxis -= dt * f;
            if (projectm.input.strafeAxis < -1) projectm.input.strafeAxis = -1;
        }
    }

    if (!(projectm.input.keyR || projectm.input.keyF)) {
        if (projectm.input.upAxis > .1) projectm.input.upAxis -= dt * f;
        else if (projectm.input.upAxis < -.1) projectm.input.upAxis += dt * f;
        else projectm.input.upAxis = 0;
    } else {
        if (projectm.input.keyR) {
            if (projectm.input.upAxis < 1) projectm.input.upAxis += dt * f;
            if (projectm.input.upAxis > 1) projectm.input.upAxis = 1;
        }
        if (projectm.input.keyF) {
            if (projectm.input.upAxis > -1) projectm.input.upAxis -= dt * f;
            if (projectm.input.upAxis < -1) projectm.input.upAxis = -1;
        }
    }
}

// Mobile controls

function setupMobile() {

    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });

}

function onTouchStart(evt) {
    if (inStartScreen) return;
    
    if (projectm.gamestate.deviceMode != 2) projectm.setDeviceMode(2);
	
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

            // projectm.log('touch start: ' + touchX + ', ' + touchY);
        }
    }
}

function onTouchMove(evt) {
    // evt.preventDefault();

    const touches = evt.touches;
    for (let i = 0; i < touches.length; i++) {
        let x = Math.floor(touches[0].pageX);
        let y = Math.floor(touches[0].pageY);

        touchX = x;
        touchY = y;
    }
}

function onTouchEnd(evt) {
    // evt.preventDefault();

    inTouchMove = false;
}

function moveWithMobile(dt) {

    if (inTouchMove) {
        let dx = touchX - touchStartX;
        let da = dx * -.01;

        projectm.input.steerAxis = da;
        if (projectm.input.steerAxis > 1) projectm.input.steerAxis = 1;
        if (projectm.input.steerAxis < -1) projectm.input.steerAxis = -1;
        if (projectm.input.steerAxis > -.1 && projectm.input.steerAxis < .1) projectm.input.steerAxis = 0;

        let dy = touchY - touchStartY;
        let db = dy * -.02;

        projectm.input.forwardAxis = db;
        if (projectm.input.forwardAxis > 1) projectm.input.forwardAxis = 1;
        if (projectm.input.forwardAxis < -1) projectm.input.forwardAxis = -1;
        if (projectm.input.forwardAxis > -.1 && projectm.input.forwardAxis < .1) projectm.input.forwardAxis = 0;

    } else {
        projectm.input.forwardAxis = 0;
        projectm.input.steerAxis = 0;
    }
}

// VR Controllers

function setupVR() {
    projectm.log('Initializing VR', 1);

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
        projectm.log('controller1 connected');
        this.add(buildController(event.data));
    } );
    controller1.addEventListener( 'disconnected', function () {
        projectm.log('controller1 disconnected');
        this.remove(this.children[0]);
    });
	controller1.addEventListener("squeezestart", onSqueezeEvent);
	controller1.addEventListener("squeeze", onSqueezeEvent);
	controller1.addEventListener("squeezeend", onSqueezeEvent);
    viewPivot.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
    controller2.addEventListener( 'connected', function ( event ) {
        projectm.log('controller2 connected');
        this.add(buildController(event.data));
    } );
    controller2.addEventListener( 'disconnected', function () {
        projectm.log('controller2 disconnected');
        this.remove(this.children[0]);
    } );
	controller2.addEventListener("squeezestart", onSqueezeEvent);
	controller2.addEventListener("squeeze", onSqueezeEvent);
	controller2.addEventListener("squeezeend", onSqueezeEvent);
    viewPivot.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    viewPivot.add(controllerGrip1);

    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    viewPivot.add(controllerGrip2);
}

function buildController( data ) {
    let geometry, material;

    switch ( data.targetRayMode ) {

        case 'tracked-pointer':
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, -10 ], 3 ) );
            geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.8, 0.5, 0.5, 0, 0, 0 ], 3 ) );

            material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );

            return new THREE.Line( geometry, material );

        case 'gaze':
            geometry = new THREE.RingGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
            material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
            return new THREE.Mesh( geometry, material );
    }
}

function onSelectStart() {
    
    this.userData.isSelecting = true;
				
}

function onSelectEnd() {
    
    this.userData.isSelecting = false;
}

function onSqueezeEvent(event) {
    let source = event.data;
    
	if (source.targetRayMode != "tracked-pointer") {
		return;
	}

	switch (event.type) {
		case "squeezestart":
            this.userData.isSqueezing = true;
			break;
		case "squeeze":
			break;
		case "squeezeend":
            this.userData.isSqueezing = false;
			break;
	}
}

function moveWithVR() {
    var handedness = "unknown";

    if (renderer.xr.isPresenting) {

        if (controller1.userData.isSelecting) {
            // projectm.log('isSelecting1');
        }
        if (controller2.userData.isSelecting) {
            // projectm.log('isSelecting2');
        }
        if (controller1.userData.isSqueezing) {
            // projectm.log('isSqueezing1');
        }
        if (controller2.userData.isSqueezing) {
            // projectm.log('isSqueezing2');
        }
        
        let session = renderer.xr.getSession();

        for (const source of session.inputSources) {
            if (source && source.handedness) {
                handedness = source.handedness; // left or right controllers
            }
            if (!source.gamepad) continue;

            if (handedness == 'left') {
                if (source.gamepad.buttons[4].value > .8) 
                    projectm.input.buttonX = true;
                else
                    projectm.input.buttonX = false;
                if (source.gamepad.buttons[5].value > .8) 
                    projectm.input.buttonY = true;
                else                   
                    projectm.input.buttonY = false;
            } else {
                if (source.gamepad.buttons[4].value > .8) 
                    projectm.input.buttonA = true;
                else
                    projectm.input.buttonA = false;
                if (source.gamepad.buttons[5].value > .8) {
                    if (!projectm.input.buttonB) {
                        projectm.input.buttonB = true;
                        let cm = projectm.gamestate.controlMode + 1;
                        if (cm > 3) cm = 1;
                        projectm.setControlMode(cm);
                    }
                } else {
                    projectm.input.buttonB = false;
                }
            }

            source.gamepad.axes.forEach((value, i) => {
                if (Math.abs(value) > 0.1) {

                    if (i == 2) {
                        if (handedness == "left") {
                            projectm.input.strafeAxis = value;
                        } else {
                            projectm.input.steerAxis = -value;
                        }
                    } else if (i == 3) {
                        if (handedness == "left") {
                            projectm.input.upAxis = -value;
                        } else {
                            projectm.input.forwardAxis = -value;
                        }
                    }

                } else {

                    if (i == 2) {
                        if (handedness == "left") {
                            projectm.input.strafeAxis = 0;
                        } else {
                            projectm.input.steerAxis = 0;
                        }
                    } else if (i == 3) {
                        if (handedness == "left") {
                            projectm.input.upAxis = 0;
                        } else {
                            projectm.input.forwardAxis = 0;
                        }
                    }
                }
            });
        }
    }
}


