let container, stats, raycaster, mouse;
let camera, scene, renderer;
let group, controls, keyboard;

let gui, options, dragIndex, targetList;
let cardSize, colors, step, left;
let slideCounts, currentIndex, slides, duration;
let portalsOffset, tick;

init();
animate();
function init() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x909090 );
	cardSize =  new THREE.Vector2(25,35);
	platform = new THREE.Object3D();
	platform.position.set(0, cardSize.y*1, cardSize.x/2);
	platform.rotation.set(Math.PI/2, 0,0);
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );

	scene.add( camera );
	let light = new THREE.PointLight( 0xffffff, 0.8 );
	camera.add( light );
	dragVec = new THREE.Vector3();
	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();
	moveIndex = new THREE.Vector2();
	clock = new THREE.Clock();
	keyboard = new Keyboard();
	deltaTime = 0;
	totalTime = 0;
	dragIndex = null;
	left = null;
	slideCounts = 8;
	currentIndex = 0;
	tick = 0;
	targetList = [];
	duration = 700;
	colors = [];
	for (let i=0;i<12;i++)
		colors.push(new THREE.Color("hsl("+30*i+", 100%, 50%)"));

  let divisions = 50, s = cardSize.x*divisions;
  let gridHelper = new THREE.GridHelper( s, divisions );
  gridHelper.rotateX(Math.PI/2)
  scene.add( gridHelper );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;

	container.appendChild( renderer.domElement );
	setSlides();

	stats = new Stats();
	container.appendChild(stats.dom);

	let button = document.getElementById( 'left' );
		 button.addEventListener( 'click', function ( event ) {
			 left = true;
			 moveIndex.set(0,1);
			 if (slides[moveIndex.x].length>0)// && tick<slides[moveIndex.x].length)
			 	move( duration );
		 }, false );
	 button = document.getElementById( 'right' );
 		 button.addEventListener( 'click', function ( event ) {
			 left = false;
			 moveIndex.set(1,0);
 			 if (slides[moveIndex.x].length>0)
 			 	move( duration );
 		 }, false );

	//
	window.addEventListener( 'mousemove', onMouseMove, false );
	window.addEventListener( 'mousedown', onMouseDown, false );
	window.addEventListener( 'resize', onWindowResize, false );
}
function onMouseMove( event ) {

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}
function onMouseDown( event )
		{
			// update the mouse variable
			mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
			mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

			raycaster.setFromCamera( mouse, camera );
			let intersects = raycaster.intersectObjects( targetList);

			if ( intersects.length > 0 )
			{
				let name = intersects[ 0 ].object.name;
				//console.log("Hit @ " + intersects[0].point  );
				if (dragIndex===null && !tiles[name].placed){
						dragIndex = name;
				}
				else
					dragIndex = null;
				//intersects[ 0 ].face.color.setRGB( 0.8 * Math.random() + 0.2, 0, 0 );
				//intersects[ 0 ].object.geometry.colorsNeedUpdate = true;
			}
		}
function animate() {
	requestAnimationFrame( animate );
	//controls.update();
	deltaTime = clock.getDelta();
	totalTime += deltaTime;
	update();
	TWEEN.update();
	render();
	stats.update();
}
function update(){
	keyboard.update();

	let translateSpeed = step; // units per second
	let distance = translateSpeed * deltaTime;
	let rotateSpeed = Math.PI/6; // radians per second
	let angle = rotateSpeed * deltaTime;

	if (keyboard.isKeyPressed("W"))
		camera.translateZ( -distance );
	if (keyboard.isKeyPressed("S"))
		camera.translateZ( distance );

	if (keyboard.isKeyPressed("A"))
		camera.translateX( -distance );
	if (keyboard.isKeyPressed("D"))
		camera.translateX( distance );

	if (keyboard.isKeyPressed("R"))
		camera.translateY( distance );
	if (keyboard.isKeyPressed("F"))
		camera.translateY( -distance );

	if (keyboard.isKeyPressed("Q"))
		camera.rotateY( angle );
	if (keyboard.isKeyPressed("E"))
		camera.rotateY( -angle );


}
function render() {
	renderer.render( scene, camera );

	raycaster.setFromCamera( mouse, camera );

	let intersects = raycaster.intersectObjects( scene.children );
	for ( let i = 0; i < intersects.length; i++ ){
		dragVec = intersects[i].point.clone();
		//intersects[ i ].object.material.color.set( 0xff0000 );
	}

	if (null !== dragIndex){
		for (let i=0; i<tiles[dragIndex].meshs.length; i++){
			let x = dragVec.x+tiles[dragIndex].offset.x-pieceWidth/2;
			let y = dragVec.y+tiles[dragIndex].offset.y-pieceHeight/2;
			let z = dragVec.z+tiles[dragIndex].offset.z;
			tiles[dragIndex].meshs[i].position.set(x,y,z);
		}
		checkPlace();
	}

}
function shuffle(array) {
	let swaps = [],  m = array.length,  t,  i;

	while (m) {
		i = Math.floor(Math.random() * m--);
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}
	//return swaps;
}
function setSlides(){
	step = cardSize.x;
	slides= [[],[]];
	targets = [[],[]];
	sceneTextures = [];
	offsetSlides = [
		new THREE.Vector3(cardSize.x*1, cardSize.y*1, cardSize.x),
		new THREE.Vector3(-cardSize.x*1, cardSize.y*1, cardSize.x)
	];
	let scale = step/1.3;
	let sphereRadius = 1*scale;
	let holeRadius = 0.5*scale;
	let borderThickness = 0.05*scale;
	portalsOffset = new THREE.Vector3(0, 0, sphereRadius);
	let x = Math.sin(Math.PI*2/slideCounts*slideCounts)*step*3;
	let y = Math.cos(Math.PI*2/slideCounts*slideCounts)*step*3;
	platform.position.set(x, y, 0);
	platform.position.add(portalsOffset);
	platform.rotation.set(Math.PI/2, Math.PI*2*(-1/slideCounts*slideCounts), 0);
	//platform.rotation.x = 0;

	camera.position.add(portalsOffset);
	//camera.position.z = 300;
		camera.lookAt(platform.position.x, platform.position.y, platform.position.z);
		camera.rotateZ(-Math.PI/2);
		camera.rotateX(Math.PI);
	//camera.lookAt( new THREE.Vector3()); // camera.rotateZ(-Math.PI/2);
	let loader = new THREE.TextureLoader();

	for (let s=1; s<8; s++){
		let str = "src/images/pano"+s+".jpg";
		let sceneTexture = loader.load(str);
		sceneTexture.offset.x = 0.5;
		sceneTexture.repeat.set(0.5, 1);
		sceneTextures.push(sceneTexture)
	}

	let halfSphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32, Math.PI, Math.PI); // startAngle, sweepAngle

	for (let i=0;i<slideCounts;i++){
		let index = i%sceneTextures.length;
		let cloakTexture = loader.load("src/images/color-grid.png");
		cloakMaterial = new THREE.MeshBasicMaterial({ map: cloakTexture, side: THREE.FrontSide, colorWrite: false }); // change colorWrite: true to see the cloak

		let halfSphereGroup = new THREE.Group();
		let innerSphere = new THREE.Mesh( halfSphereGeometry,
			new THREE.MeshBasicMaterial({ map: sceneTextures[index], side: THREE.BackSide }) );
		let outerSphere = new THREE.Mesh( halfSphereGeometry, cloakMaterial );
		let holeMesh    = new THREE.Mesh(
			new THREE.RingGeometry(holeRadius, sphereRadius * 1.01, 32),
			cloakMaterial );
		let borderMesh  = new THREE.Mesh(
			new THREE.RingGeometry(holeRadius, holeRadius + borderThickness , 32),
		 	new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide}) );
		borderMesh.position.z = 0.001; // avoid depth-fighting artifacts

		halfSphereGroup.add( innerSphere );
		halfSphereGroup.add( outerSphere );
		halfSphereGroup.add( holeMesh );
		halfSphereGroup.add( borderMesh );

		let x = Math.sin(Math.PI*2/slideCounts*i)*step*3;
		let y = Math.cos(Math.PI*2/slideCounts*i)*step*3;
		halfSphereGroup.position.set(x, y, 0);
		halfSphereGroup.position.add(portalsOffset);
		halfSphereGroup.rotation.set(Math.PI/2, Math.PI*2*(-1/slideCounts*i), 0);
		halfSphereGroup.name = i;
		slides[0].push(halfSphereGroup);
		scene.add(slides[0][i]);
		let obj = new THREE.Object3D();
		obj.position.add(slides[0][i].position)
		obj.rotation.set(
			slides[0][i].rotation.x,
			slides[0][i].rotation.y,
			slides[0][i].rotation.z)
		targets[0].push(obj);
		targets[1].push(obj);
	}
}
function move(duration){

	TWEEN.removeAll();

	var rand1 = 1;
	var rand2 = 1;

		updateSlides();

	for (var s=0;s<slides[0].length;s++){
		var object = slides[0][s];
		var target = targets[0][s];

		new TWEEN.Tween( object.position )
			.to( { x: target.position.x, y: target.position.y, z: target.position.z },
			rand1* duration + duration )
			.easing( TWEEN.Easing.Exponential.InOut )
			.start();

		new TWEEN.Tween( object.rotation )
			.to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z },
				rand2 * duration + duration )
			.easing( TWEEN.Easing.Exponential.InOut )
			.start();

	}

	tick++;

		new TWEEN.Tween( this )
			.to( {}, duration * 2 )
			.onUpdate( render )
			.start();
}
function updateSlides(){
	for (var i=0; i<targets.length; i++)
		for (var j=0; j<targets[i].length; j++){
			if (i==1){
					targets[i][j].position.set(
							targets[0][j].position.x,
							targets[0][j].position.y,
							targets[0][j].position.z
						);
					targets[i][j].rotation.set(
							targets[0][j].rotation.x,
							targets[0][j].rotation.y,
							targets[0][j].rotation.z
						);
			}
			else{
				var index = (j+1)%targets[i].length;
				var X = 1;
				targets[i][j].position.set(
						targets[X][index].position.x,
						targets[X][index].position.y,
						targets[X][index].position.z
					);
				targets[i][j].rotation.set(
						targets[X][index].rotation.x,
						targets[X][index].rotation.y,
						targets[X][index].rotation.z
					);
			}
		}
}
