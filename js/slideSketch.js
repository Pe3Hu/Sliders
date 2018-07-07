var container, stats, raycaster, mouse;
var camera, scene, renderer;
var group, controls;

var gui, options, dragIndex, targetList;
var cardSize, colors, step, left;
var slideCounts, currentIndex, slides, duration;

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
	platform.rotation.set(-Math.PI/2, 0, Math.PI/2);
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.set(0, -3*cardSize.y, cardSize.x/4);//cardSize.x*20 );
	scene.add( camera );
	var light = new THREE.PointLight( 0xffffff, 0.8 );
	camera.add( light );
	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();
	moveIndex = new THREE.Vector2();
	dragIndex = null;
	left = null;
	slideCounts = 11;
	currentIndex = 0;
	targetList = [];
	duration = 700;
	colors = [];
	for (var i=0;i<12;i++){
		var color = new THREE.Color("hsl("+30*i+", 100%, 50%)");
		//var color = new THREE.Color();
		//color.setHSL(30/360, 0.5, 1);
		colors.push(color.clone());
	}

  var divisions = 50, s = cardSize.x*divisions;
  var gridHelper = new THREE.GridHelper( s, divisions );
  gridHelper.rotateX(Math.PI/2)
  scene.add( gridHelper );

	dragVec = new THREE.Vector3();
	//console.log(dragObjects);

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;

	controls = new THREE.OrbitControls( camera );

	container.appendChild( renderer.domElement );
	setSlides();

	stats = new Stats();
	container.appendChild(stats.dom);

	var button = document.getElementById( 'left' );
		 button.addEventListener( 'click', function ( event ) {
			 left = true;
			 moveIndex.set(0,1);
			 if (slides[moveIndex.x].length>0)
			 	moveGroup( duration );
		 }, false );
	 button = document.getElementById( 'right' );
 		 button.addEventListener( 'click', function ( event ) {
			 left = false;
			 moveIndex.set(1,0);
 			 if (slides[moveIndex.x].length>0)
 			 	moveGroup( duration );
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
			var intersects = raycaster.intersectObjects( targetList);

			if ( intersects.length > 0 )
			{
				var name = intersects[ 0 ].object.name;
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
	controls.update();
	TWEEN.update();
	render();
	stats.update();
}
function render() {
	renderer.render( scene, camera );

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( scene.children );
	for ( var i = 0; i < intersects.length; i++ ){
		dragVec = intersects[i].point.clone();
		//intersects[ i ].object.material.color.set( 0xff0000 );
	}

	if (null !== dragIndex){
		for (var i=0; i<tiles[dragIndex].meshs.length; i++){
			var x = dragVec.x+tiles[dragIndex].offset.x-pieceWidth/2;
			var y = dragVec.y+tiles[dragIndex].offset.y-pieceHeight/2;
			var z = dragVec.z+tiles[dragIndex].offset.z;
			tiles[dragIndex].meshs[i].position.set(x,y,z);
		}
		checkPlace();
	}

}
function shuffle(array) {
	var swaps = [],  m = array.length,  t,  i;

	while (m) {
		i = Math.floor(Math.random() * m--);
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}
	//return swaps;
}
function setSlides(){
	step = cardSize.x/3;
	slides= [[],[]];
	targets = [[],[]];
	offsetSlides = [
		new THREE.Vector3(cardSize.x*1, cardSize.y*1, cardSize.x),
		new THREE.Vector3(-cardSize.x*1, cardSize.y*1, cardSize.x)
	];
	let scale = cardSize.y;
	let sphereRadius = 1*scale;
	let holeRadius = 0.5*scale;
	let borderThickness = 0.05*scale;

	let loader = new THREE.TextureLoader();
	let sceneTexture = loader.load("src/images/scene-sphere-outside.jpg");
	sceneTexture.offset.x = 0.5;
	sceneTexture.repeat.set(0.5, 1);


		let halfSphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32, Math.PI, Math.PI); // startAngle, sweepAngle

		let cloakTexture = loader.load("src/images/color-grid.png");
		cloakMaterial = new THREE.MeshBasicMaterial({ map: cloakTexture, side: THREE.FrontSide, colorWrite: false }); // change colorWrite: true to see the cloak
		let sceneTexture = loader.load("src/images/scene-sphere-outside.jpg");
		sceneTexture.offset.x = 0.5;
		sceneTexture.repeat.set(0.5, 1);

		let innerSphere = new THREE.Mesh( halfSphereGeometry,
			new THREE.MeshBasicMaterial({ map: sceneTexture, side: THREE.BackSide }) );
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

	for (var i=0;i<slideCounts;i++){
		/*
		var index = i%colors.length;
		var geometry = new THREE.PlaneBufferGeometry( cardSize.x, cardSize.y, 32 );
		var material = new THREE.MeshBasicMaterial( {color: colors[index], side: THREE.DoubleSide} );
		var plane = new THREE.Mesh( geometry, material );
		*/
		let plane = halfSphereGroup.clone();


		plane.position.set(step*(0.5+i), cardSize.y/2, 0);
		plane.position.add(offsetSlides[0]);
		plane.rotateY(Math.PI/2);
		plane.name = i;
		slides[0].push(plane);
		scene.add(slides[0][i]);
		var obj = new THREE.Object3D();
		obj.position.set(step*(0.5+i), cardSize.y/2, cardSize.x/2);
		obj.position.add(offsetSlides[0]);
		obj.rotateY(Math.PI/2);
		targets[0].push(obj);
	}
}
function move(duration){

	TWEEN.removeAll();

	var object = slides[moveIndex.x][currentIndex];
	if (!left)
		object = slides[moveIndex.x][slides[moveIndex.x].length-1];
	var target = platform;

	var rand1 = 1;
	var rand2 = 1;

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

	if(currentIndex!==0){
		var object = currentSlide;
		var target = targets[moveIndex.y][targets[moveIndex.y].length-1];

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

	updateSlides();

	for (var i=0; i<slides.length; i++)
		for (var j=0; j<slides[i].length; j++){
			var object = slides[i][j];
			var target = targets[i][j];

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

		new TWEEN.Tween( this )
			.to( {}, duration * 2 )
			.onUpdate( render )
			.start();
}
function updateSlides(){
	if (left && slides[moveIndex.x].length != slideCounts){
		slides[moveIndex.y].push(currentSlide);
		targets[moveIndex.y].push(targets[moveIndex.x][currentIndex]);
	}
	if (!left){
		var temp = [currentSlide];
		slides[moveIndex.y] = temp.concat(slides[moveIndex.y]);
		targets[moveIndex.y].push(targets[moveIndex.x][currentIndex]);
	}
	if (left){
		currentSlide = slides[moveIndex.x][currentIndex];
		slides[moveIndex.x].splice(currentIndex, 1);
	}
	else{
		currentSlide = slides[moveIndex.x].pop();
		//slides[moveIndex.x][ slides[moveIndex.x].length - 1];
		//targets[moveIndex.x].splice(slides[moveIndex.x].length-1, 1);
	}

	targets[moveIndex.x].splice(currentIndex, 1);
	//console.log("targets",targets);
	console.log(currentSlide.name, "slides",slides);

	if (left)
		offsetSlides[1].x -=step;
	else
		offsetSlides[1].x +=step;

	for (var i=0; i<targets.length; i++)
		for (var j=0; j<targets[i].length; j++){

			targets[i][j].position.set(step*(0.5+j), cardSize.y/2, 0);
			targets[i][j].position.add(offsetSlides[i]);
			if (i==0)
				targets[i][j].rotation.set(0, 1/2*Math.PI,0);
			if (i==1)
				targets[i][j].rotation.set(0,-1/2*Math.PI,Math.PI);
		}
}
function moveGroup(duration){

	TWEEN.removeAll();

	var group = slides[moveIndex.x][currentIndex];
	if (!left)
		group = slides[moveIndex.x][slides[moveIndex.x].length-1];
	var target = platform;

	var rand1 = 1;
	var rand2 = 1;
	console.log(slides	)
	for (var g=0; g<group.children.length){
		var object = group.children[g];

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

	if(currentIndex!==0){
		var group = currentSlide;
		var target = targets[moveIndex.y][targets[moveIndex.y].length-1];

		for (var g=0; g<group.children.length){
			var object = group.children[g];

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
	}

	updateSlidesGroup();

	for (var i=0; i<slides.length; i++)
		for (var j=0; j<slides[i].length; j++){
			var group = slides[i][j];
			var target = targets[i][j];


			for (var g=0; g<group.children.length){
				var object = group.children[g];

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
		}

		new TWEEN.Tween( this )
			.to( {}, duration * 2 )
			.onUpdate( render )
			.start();
}
function updateSlidesGroup(){
	if (left && slides[moveIndex.x].length != slideCounts){
		slides[moveIndex.y].push(currentSlide);
		targets[moveIndex.y].push(targets[moveIndex.x][currentIndex]);
	}
	if (!left){
		var temp = [currentSlide];
		slides[moveIndex.y] = temp.concat(slides[moveIndex.y]);
		targets[moveIndex.y].push(targets[moveIndex.x][currentIndex]);
	}
	if (left){
		currentSlide = slides[moveIndex.x][currentIndex];
		slides[moveIndex.x].splice(currentIndex, 1);
	}
	else{
		currentSlide = slides[moveIndex.x].pop();
		//slides[moveIndex.x][ slides[moveIndex.x].length - 1];
		//targets[moveIndex.x].splice(slides[moveIndex.x].length-1, 1);
	}

	targets[moveIndex.x].splice(currentIndex, 1);
	//console.log("targets",targets);
	console.log(currentSlide.name, "slides",slides);

	if (left)
		offsetSlides[1].x -=step;
	else
		offsetSlides[1].x +=step;

	for (var i=0; i<targets.length; i++)
		for (var j=0; j<targets[i].length; j++){

			targets[i][j].position.set(step*(0.5+j), cardSize.y/2, 0);
			targets[i][j].position.add(offsetSlides[i]);
			if (i==0)
				targets[i][j].rotation.set(0, 1/2*Math.PI,0);
			if (i==1)
				targets[i][j].rotation.set(0,-1/2*Math.PI,Math.PI);
		}
}
