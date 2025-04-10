import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const KEYFRAME_STEP = 1;
const SPEED = 1;

const effectiveKeyframeSize = KEYFRAME_STEP/SPEED

const config = {
	scenes:{
		motor_box:()=>loadScene("models/motor_box_assembly.glb"),
		scarab:()=>loadScene("models/assemble_scarab.glb"),
		sumo:()=>loadScene("models/assemble_sumo.glb"),
		tracker:()=>loadScene("models/assemble_tracker.glb"),
	},
	animations:{
		next:animateNext,
		previous:animatePrev,
	},
	lightning:{
		ambient:0.2,
		directional:1
	}
}

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const clock =  new THREE.Clock(	)
const amb_light = new THREE.AmbientLight(0xFFFFFF, config.lightning.ambient);
const dir_light = new THREE.DirectionalLight(0xFFFFFF, config.lightning.directional);



let animationMixer = new THREE.AnimationMixer(scene)
let gltf_object = undefined
let animationProgress = 0
let action = undefined

addEnviroment();
addLightning();
addGUI();

renderer.setSize( window.innerWidth, window.innerHeight,false);

renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const loader = new GLTFLoader();

const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set( 0, 0.5, 0 );
controls.update();
controls.enablePan = false;
controls.enableDamping = false;
camera.position.z = 5;

function loadScene(path){
	loader.load( path, function ( gltf ) {
		if(gltf_object){
			scene.remove(gltf_object.scene)
		}
		gltf_object = gltf
		animationProgress = 0;
		
		animationMixer = new THREE.AnimationMixer(gltf_object.scene)
		console.log(gltf_object.animations)
		if(gltf_object.animations){
			action = animationMixer.clipAction(gltf_object.animations[0])
				.setLoop(THREE.LoopOnce,0);
			action.clampWhenFinished=true;
			}
			scene.add( gltf.scene);
	})
}


function addGUI(){
	const panel = new GUI( { width: 310 } );
	const folder1 = panel.addFolder( 'Scenes' );
	folder1.add(config.scenes,"motor_box")
	folder1.add(config.scenes,"scarab")
	folder1.add(config.scenes,"sumo")
	folder1.add(config.scenes,"tracker")
	const folder2 = panel.addFolder( 'Animation' );
	folder2.add(config.animations,"next");
	folder2.add(config.animations,"previous");
	const folder3 = panel.addFolder( 'Lightning' )
	folder3.add(config.lightning,"ambient",0.0,2.0).listen().onChange(
		(t=>amb_light.intensity=t)
	)
	folder3.add(config.lightning,"directional",0.0,2.0).listen().onChange(
		t=>dir_light.intensity=t
	)
}

function animateNext(){
	if(!gltf_object) return;
	if(!action) return
	if(animationProgress>=action.getClip().duration) return
	console.log(animationProgress)
	console.log(action)
	action.paused=false;
	action.time = animationProgress;
	action.setEffectiveTimeScale(SPEED)
		.play()
	animationProgress+=KEYFRAME_STEP;
	setTimeout(()=>{	
		action.paused=true;
		action.time=animationProgress
		},
		effectiveKeyframeSize*1000)
}

function animatePrev(){
	if(!gltf_object) return;
	if(!action) return
	if(animationProgress<=0) return
	console.log(animationProgress)
	console.log(action)

	action.paused=false;
	action.time = animationProgress;
	action.play()
		.setEffectiveTimeScale(-SPEED)
	animationProgress-=KEYFRAME_STEP;
	setTimeout(()=>{	
		action.paused=true;
		action.time=animationProgress
		},
		effectiveKeyframeSize*1000)
}

function addLightning(){
	dir_light.position.set(3, 4, 5);
	dir_light.target.position.set(0, 0, 0);
	dir_light.castShadow = true
	scene.add(amb_light);
	scene.add(dir_light);
	scene.add(dir_light.target);
}

function addEnviroment(){
	new THREE.TextureLoader().load("textures/autumn_field_puresky_1k.png",function(texture){
		texture.mapping = THREE.EquirectangularReflectionMapping;
		scene.background = texture
		scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular( texture ).texture;
	})
}
function animate() {
	const delta = clock.getDelta();
	controls.update()
	animationMixer.update(delta)
	renderer.render( scene, camera );
}

