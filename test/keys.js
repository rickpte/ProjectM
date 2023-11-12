import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { Text } from 'troika-three-text';

let camera, scene, renderer, elem;
let text1;

function init() {
  initThree();
  initPanel();

  document.addEventListener('keydown', onKeyDown, false);
}

function onKeyDown(event) {
  event.preventDefault();
  text1.text += event.code + '(' + event.key + ') ';
}

function initThree() {
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
  camera.position.y = 1;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xCCCCCC);

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  renderer.xr.enabled = true;
	renderer.xr.setFramebufferScaleFactor(2.0);         // increases the resolution on Quest
//  renderer.xr.setReferenceSpaceType('local');         // default is local floor

  let vrbutton = VRButton.createButton(renderer);
  document.body.appendChild(vrbutton);

  elem = renderer.domElement;

  renderer.setAnimationLoop( animation );
}

function initPanel() {

  var geometry = new THREE.PlaneGeometry(2, 2);
	var material = new THREE.MeshStandardMaterial({
		color: 0x444444,
		roughness: 1.0,
    metalness: 0.0,
    transparent: true,
    opacity: 0.4
	});

  var wall = new THREE.Mesh(geometry, material);
  wall.position.x = 0;
  wall.position.y = 1;
  wall.position.z = -2.01;
  scene.add(wall);

  text1 = new Text();
  scene.add(text1);
    
  // Set properties to configure:
  text1.text = "keys: ";
  text1.fontSize = 0.05;
  text1.position.x = -1 + .05;
  text1.position.y = 2 - .05;
  text1.position.z = -2;
  text1.color = 0xFFFFFF;
  text1.maxWidth = 1.8;
    
  text1.sync();

}

// animation
function animation( time ) {

  renderer.render( scene, camera );
}

init();
