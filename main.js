import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
const KEYFRAME_STEP = 1;
const SPEED = 1;

const localization_es = {
	lightning: "iluminación",
	directional: "direccional",
	ambiental: "ambiental",
	progress: "progreso",
	back: "retroceder",
	next: "siguiente",
	animation: "animación",
	scenes: "escenas",
	motorBox: "motor",
	scarab: "escarabajo",
	sumo: "sumo",
	tracker: "seguidor"
}
const localization = localization_es
const effectiveKeyframeSize = KEYFRAME_STEP/SPEED

const config = {
	scenes:{
		motor_box:()=>loadScene("models/motor_box_assembly.glb"),
		scarab:()=>loadScene("models/assemble_scarab.glb"),
		sumo:()=>loadScene("models/assemble_sumo.glb"),
		tracker:()=>loadScene("models/assemble_tracker.glb"),
	},
	animations:{
		progress:0,
		next:animateNext,
		previous:animatePrev,
	},
	lightning:{
		ambient:0.2,
		directional:1
	}
}

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({antialias: true});
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
const clock =  new THREE.Clock(	)
const ambLight = new THREE.AmbientLight(0xFFFFFF, config.lightning.ambient);
const dirLight = new THREE.DirectionalLight(0xFFFFFF, config.lightning.directional);



let animationMixer = new THREE.AnimationMixer(scene)
let gltf_object = undefined
let action = undefined
let progressController = undefined

addEnviroment();
addLightning();
addGUI();

renderer.setPixelRatio( window.devicePixelRatio )
renderer.setSize( window.innerWidth, window.innerHeight);
renderer.setAnimationLoop( animate );
document.body.prepend(renderer.domElement)

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
		config.animations.progress = 0;
		animationMixer = new THREE.AnimationMixer(gltf_object.scene)
		console.log(gltf_object.animations)
		if(gltf_object.animations){
			const animation = gltf_object.animations[0]
			action = animationMixer.clipAction(animation)
				.setLoop(THREE.LoopOnce,0);
			action.clampWhenFinished=true;
			progressController.reset()
			progressController.max(animation.duration)
			}
			scene.add( gltf.scene);
	})
}


function addGUI(){
	const panel = new GUI( { width: 310 } );
	const scenes = panel.addFolder( localization.scenes );
	scenes.add(config.scenes,"motor_box")
		.name(localization.motorBox)
	scenes.add(config.scenes,"scarab")
		.name(localization.scarab)
	scenes.add(config.scenes,"sumo")
		.name(localization.sumo)
	scenes.add(config.scenes,"tracker")
		.name(localization.tracker)

	const animation = panel.addFolder( localization.animation );
	animation.add(config.animations,"next")
		.name(localization.next);
	animation.add(config.animations,"previous")
		.name(localization.back);
	progressController = animation.add(config.animations,"progress",0.0,0.0,KEYFRAME_STEP)
		.name(localization.progress)
		.listen().onChange(
			t=>goToTime(t)
		)

	const lightning = panel.addFolder( 'Iluminacion')
	lightning.add(config.lightning,"ambient",0.0,2.0)
		.name(localization.ambiental)
		.listen()
		.onChange(
			t=>ambLight.intensity=t
		)
	lightning.add(config.lightning,"directional",0.0,2.0)
		.name(localization.directional)
		.listen()
		.onChange(
			t=>dirLight.intensity=t
		)
}

function goToTime(time){
	if(!gltf_object) return;
	if(!action) return
	action.paused=true;
	action.time = time;
	config.animations.progress=time;
}

function animateNext(){
	if(!gltf_object) return;
	if(!action) return
	if(config.animations.progress>=action.getClip().duration) return
	action.paused = false;
	action.time = config.animations.progress;
	action.setEffectiveTimeScale(SPEED)
		.play()
		config.animations.progress+=KEYFRAME_STEP;

	setTimeout(()=>{	
		action.paused=true;
		action.time=config.animations.progress
		progressController.updateDisplay()
	},
		effectiveKeyframeSize*1000)
}

function animatePrev(){
	if(!gltf_object) return;
	if(!action) return
	if(config.animations.progress<=0) return
	action.paused = false;
	action.time = config.animations.progress;
	action.setEffectiveTimeScale(-SPEED)
		.play()	
		config.animations.progress-=KEYFRAME_STEP;

	setTimeout(()=>{	
		action.paused=true;
		action.time=config.animations.progress
		progressController.updateDisplay()
		},
		effectiveKeyframeSize*1000)
}

function addLightning(){
	dirLight.position.set(3, 4, 5);
	dirLight.target.position.set(0, 0, 0);
	dirLight.castShadow = true
	scene.add(ambLight);
	scene.add(dirLight);
	scene.add(dirLight.target);
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

