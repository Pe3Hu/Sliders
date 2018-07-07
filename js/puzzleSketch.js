var container, stats, raycaster, mouse;
var camera, scene, renderer;
var group;
var targetRotation = 0;
var targetRotationOnMouseDown = 0;
var mouseX = 0;
var mouseXOnMouseDown = 0;
var windowHalfX = window.innerWidth / 2;

var imageWidth = 63*3;
var imageHeight = 53*3;
var piecesArray = new Array(), tiles = [], lines = [], groups =[], tileIndex = 0;
var horizontalPieces = 3;
var verticalPieces = 3;
var score = 0;
var totalScore = horizontalPieces*verticalPieces;
var pieceWidth = Math.round(imageWidth / horizontalPieces);
var pieceHeight = Math.round(imageHeight / verticalPieces);
var targetRange = Math.min(pieceWidth+pieceHeight)/20;
var originalGeometry, originalMaterial, plane, plane1, plane2, plane3, plane4, size, x8, y8;
var rotate, dragVec, dragIndex = null, scrapOffset, scrapScle;
var targets, objects, piecesArrayObj, targetList;
var angle = Math.PI*2/totalScore;
var radius = horizontalPieces*(pieceWidth+pieceHeight)/1.5;
var gui, options;
init();
animate();
function init() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x909090 );
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.set( 0, 0, imageHeight*5 );
	scene.add( camera );
	var light = new THREE.PointLight( 0xffffff, 0.8 );
	camera.add( light );
	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();

	options = {
					horizontal : horizontalPieces,
					vertical : verticalPieces,
				};

	gui = new dat.GUI( { width: 200 } );
	gui.add( options, "horizontal", 2, 12 );
	gui.add( options, "vertical", 2, 12 );

	rotate = false;
	//rotate =true;
	var texture = new THREE.TextureLoader().load( "src/images/paint2.jpg" );
	texture.needsUpdate = true;
	originalGeometry = new THREE.PlaneGeometry(imageWidth*1, imageHeight*1, 32);
	var bgMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 0.5, map: texture,   side: THREE.DoubleSide});
	originalMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 1, map: texture,   side: THREE.DoubleSide});

  var divisions = 1000, s = 40*divisions;
  var gridHelper = new THREE.GridHelper( s, divisions );
  gridHelper.rotateX(Math.PI/2)
  scene.add( gridHelper );

  var bg = new THREE.Mesh( originalGeometry, bgMaterial);
	//bg.position.set(pieceWidth-200, pieceHeight+200, 0);
  scene.add(bg);

	plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000, 8, 8),
	new THREE.MeshBasicMaterial({color: 0x00ff00,opacity: 0.001,transparent: true}));
	//scene.add(plane);
  plane1 =new THREE.Plane(new THREE.Vector3(-0.0001, 0, 0), 0);
  plane2 = new THREE.Plane(new THREE.Vector3(0.0001, 0, 0), 0);
  plane3 =new THREE.Plane(new THREE.Vector3(0, -0.0001, 0), 0);
  plane4 = new THREE.Plane(new THREE.Vector3(0, 0.0001, 0), 0);
	size = 4;
	dragVec = new THREE.Vector3();
	reInit();
	//console.log(dragObjects);

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;

	container.appendChild( renderer.domElement );

	stats = new Stats();
	container.appendChild(stats.dom)

	var button = document.getElementById( 'table' );
     button.addEventListener( 'click', function ( event ) {
       transform( targets.table, 2000 );
     }, false );

     button = document.getElementById( 'circle' );
     button.addEventListener( 'click', function ( event ) {
       transform( targets.circle, 2000 );
     }, false );

		 button = document.getElementById( 'circles' );
		 button.addEventListener( 'click', function ( event ) {
		 	transform( targets.circles, 2000 );
		 }, false );


	//
	window.addEventListener( 'mousemove', onMouseMove, false );
	window.addEventListener( 'mousedown', onMouseDown, false );
	window.addEventListener( 'resize', onWindowResize, false );
}
function reInit(){
	cleanScene();
	targets = { table: [], random: [], circle: [], circles: []};
	piecesArrayObj = [];
	targetList = [];
	objects = [];
	piecesArray = new Array(); tiles = []; lines = []; groups =[];
	totalScore = horizontalPieces*verticalPieces;
	score = 0;
	pieceWidth = Math.round(imageWidth / horizontalPieces);
	pieceHeight = Math.round(imageHeight / verticalPieces);
	targetRange = Math.min(pieceWidth+pieceHeight)/20;

	setPuzzle();
	setLines();
	setCircles();

	transform( targets.circle, 2000 );
}
function cleanScene(){
	for (var i= 0; i<lines.length; i++)
			scene.remove(lines[i]);
	for (i = 0; i < tiles.length; i++)
		for (j = 0; j < tiles[i].meshs.length; j++)
			{
					scene.remove(tiles[i].meshs[j]);
					//console.log(tiles[j].meshs[i]);
			}
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
		//console.log(intersects[i].point)
		//intersects[ i ].object.material.color.set( 0xff0000 );
	}

	if (Math.floor(options.horizontal)!=horizontalPieces){
			horizontalPieces = Math.floor(options.horizontal);
			reInit();
	}

	if (Math.floor(options.vertical)!=verticalPieces){
			verticalPieces = Math.floor(options.vertical);
			reInit();
	}
	//	console.log(verticalPieces, horizontalPieces);
	//console.log(dragIndex);
	if (null !== dragIndex){
		//console.log(dragIndex, tiles)
		for (var i=0; i<tiles[dragIndex].meshs.length; i++){
			var x = dragVec.x+tiles[dragIndex].offset.x-pieceWidth/2;
			var y = dragVec.y+tiles[dragIndex].offset.y-pieceHeight/2;
			var z = dragVec.z+tiles[dragIndex].offset.z;
			tiles[dragIndex].meshs[i].position.set(x,y,z);
		}
		checkPlace();
	}

}
function cutSlice(position, offset) {
	var x = position.x, y = position.y, offsetX = offset.x, offsetY = offset.y;
	var slice = originalGeometry.clone();
	var tempPlane1 = plane1.clone();
	var tempPlane2 = plane2.clone();
	var tempPlane3 = plane3.clone();
	var tempPlane4 = plane4.clone();

	tempPlane1.translate(new THREE.Vector3(x+offsetX, 0, 0))
	tempPlane2.translate(new THREE.Vector3(x-offsetX, 0, 0))
	tempPlane3.translate(new THREE.Vector3(0, y+offsetY, 0))
	tempPlane4.translate(new THREE.Vector3(0, y-offsetY, 0))

	slice = sliceGeometry(slice, tempPlane1);
	slice = sliceGeometry(slice, tempPlane2);
	slice = sliceGeometry(slice, tempPlane3);
	slice = sliceGeometry(slice, tempPlane4);
	var sliceMesh = new THREE.Mesh( slice, originalMaterial);
	//array.push(sliceMesh)
	//sliceMesh.translateX(-150);
	//console.log(sliceMesh.geometry.vertices.length)
	return sliceMesh;
}
function setPuzzle(){
	x8 = Math.round(pieceWidth / 8);
	y8 = Math.round(pieceHeight / 8);
	//console.log(x8, y8)
	scrapOffset = new THREE.Vector3(-200, 0, 0);
	scrapScle = new THREE.Vector3(1, 1, 0);
	var mCx = 2, mCy = 2;
	piecesArrayObj = [];
	//console.log(pieceWidth, pieceHeight);

	tileOffsets = [];
	for (var j = 0; j < verticalPieces; j++) {
			piecesArrayObj[j] = [];
			for (i = 0; i < horizontalPieces; i++) {

          var tileOffset = new THREE.Vector3();
          var offsetX = pieceWidth * i-imageWidth/2;
          var offsetY = pieceHeight * j-imageHeight/2;
					var index = i + j * verticalPieces;
					var cuts = [], offsets = [];
					//var posX = offsetX+pieceWidth/verticalPieces, posY = offsetY+pieceHeight/horizontalPieces;
					//offsetX+=pieceWidth/verticalPieces;
					//offsetY+=pieceHeight/horizontalPieces;

					var posX = offsetX, posY = offsetY;
          var position = new THREE.Vector3(posX, posY, 0);
          var toZero = new THREE.Vector3(-posX, -posY, 0);
					var vec = new THREE.Vector3(offsetX, offsetY, 0);

					piecesArrayObj[j][i] = new Object();
					piecesArrayObj[j][i].right = Math.floor(Math.random() * 2);
					piecesArrayObj[j][i].up = Math.floor(Math.random() * 2);

					if (j > 0) {
							piecesArrayObj[j][i].down = 1 - piecesArrayObj[j - 1][i].up;
					}
					if (i > 0) {
							piecesArrayObj[j][i].left = 1 - piecesArrayObj[j][i - 1].right;
					}
          var tileObj = piecesArrayObj[j][i];

					if (j != 0 && tileObj.down == 1) {
							var x = 1*size, y = 0*size;
							var posX = offsetX+(x)*x8, posY = offsetY+(y)*y8;
							var position = new THREE.Vector3(posX, posY, 0);
							var offset = new THREE.Vector3(1/4*size*x8, 1/2*size*y8, 0);
							var obj = cutSlice(position, offset);
							cuts.push(obj);
							var temp = new THREE.Vector3(x*x8, y*y8, 0);
							offsets.push(temp);
          	}
        	if (i != horizontalPieces - 1 && tileObj.right == 1 ) {
							var x = 2*size, y = 1*size;
							var posX = offsetX+(x)*x8, posY = offsetY+(y)*y8;
							var position = new THREE.Vector3(posX, posY, 0);
							var offset = new THREE.Vector3(1/2*size*x8, 1/4*size*y8, 0);
							var obj = cutSlice(position, offset);
							cuts.push(obj);
							var temp = new THREE.Vector3(x*x8, y*y8, 0);
							offsets.push(temp);
          }
          if (j != verticalPieces - 1 && tileObj.up == 1) {
							var x = 1*size, y = 2*size;
							var posX = offsetX+(x)*x8, posY = offsetY+(y)*y8;
							var position = new THREE.Vector3(posX, posY, 0);
							var offset = new THREE.Vector3(1/4*size*x8, 1/2*size*y8, 0);
							var obj = cutSlice(position, offset);
							cuts.push(obj);
							var temp = new THREE.Vector3(x*x8, y*y8, 0);
							offsets.push(temp);
          }
          if (i != 0 && tileObj.left == 1) {
						var x = 0*size, y = 1*size;
						var posX = offsetX+(x)*x8, posY = offsetY+(y)*y8;
						var position = new THREE.Vector3(posX, posY, 0);
						var offset = new THREE.Vector3(1/2*size*x8, 1/4*size*y8, 0);
						var obj = cutSlice(position, offset);
						cuts.push(obj);
						var temp = new THREE.Vector3(x*x8, y*y8, 0);

						offsets.push(temp);
      		}

					if (i == 0 ){
						var x = 1/4*size, y = 1*size;
						var posX = offsetX+(x)*x8, posY = offsetY+(y)*y8;
						var position = new THREE.Vector3(posX, posY, 0);
						var offset = new THREE.Vector3(1/4*size*x8, 1/4*size*y8, 0);
						var obj = cutSlice(position, offset);
						cuts.push(obj);
						var temp = new THREE.Vector3(x*x8, y*y8, 0);

						offsets.push(temp);
					}
					if (j == 0 ){
						var y = 1/4*size, x = 1*size;
						var posX = offsetX+(x)*x8, posY = offsetY+(y)*y8;
						var position = new THREE.Vector3(posX, posY, 0);
						var offset = new THREE.Vector3(1/4*size*x8, 1/4*size*y8, 0);
						var obj = cutSlice(position, offset);
						cuts.push(obj);
						var temp = new THREE.Vector3(x*x8, y*y8, 0);

						offsets.push(temp);
					}
					if (i ==  horizontalPieces - 1){
						var x = 7/4*size, y = 1*size;
						var posX = offsetX+(x)*x8, posY = offsetY+(y)*y8;
						var position = new THREE.Vector3(posX, posY, 0);
						var offset = new THREE.Vector3(1/4*size*x8, 1/4*size*y8, 0);
						var obj = cutSlice(position, offset);
						cuts.push(obj);
						var temp = new THREE.Vector3(x*x8, y*y8, 0);
						offsets.push(temp);
					}
					if (j == verticalPieces - 1){
						var y = 7/4*size, x = 1*size;
						var posX = offsetX+(x)*x8, posY = offsetY+(y)*y8;
						var position = new THREE.Vector3(posX, posY, 0);
						var offset = new THREE.Vector3(1/4*size*x8, 1/4*size*y8, 0);
						var obj = cutSlice(position, offset);
						cuts.push(obj);
						var temp = new THREE.Vector3(x*x8, y*y8, 0);
						offsets.push(temp);
					}

					//center
					var posX = offsetX+size*x8, posY = offsetY+size*y8;
					var position = new THREE.Vector3(posX, posY, 0);
					var offset = new THREE.Vector3(1/2*size*x8, 1/2*size*y8, 0);
					var obj = cutSlice(position, offset);
					cuts.push(obj);
					var temp = new THREE.Vector3(size*x8, size*y8, 0);
					offsets.push(temp);

					//corners
					for (var x=size/4;x<2*size;x+=size*1.5)
						for (var y=size/4;y<2*size;y+=size*1.5){
							var	posX = offsetX+x*x8, posY = offsetY+y*y8;
							var position = new THREE.Vector3(posX, posY, 0);
							var offset = new THREE.Vector3(1/4*size*x8, 1/4*size*y8, 0);
							var obj = cutSlice(position, offset);
							cuts.push(obj);
							var temp = new THREE.Vector3(x*x8, y*y8, 0);
							offsets.push(temp);
					}

					//middle part1
					for (var x=size*1/4;x<2*size;x+=size*1.5)
						for (var y=size*5/8;y<1.75*size;y+=size*6/8){
							var	posX = offsetX+x*x8, posY = offsetY+y*y8;
							var position = new THREE.Vector3(posX, posY, 0);
							var offset = new THREE.Vector3(1/4*size*x8, 1/8*size*y8, 0);
							var obj = cutSlice(position, offset);
							cuts.push(obj);
							var temp = new THREE.Vector3(x*x8, y*y8, 0);
							offsets.push(temp);
					}
					//middle part1
					for (var y=size*1/4;y<2*size;y+=size*1.5)
						for (var x=size*5/8;x<1.75*size;x+=size*6/8){
							var	posX = offsetX+x*x8, posY = offsetY+y*y8;
							var position = new THREE.Vector3(posX, posY, 0);
							var offset = new THREE.Vector3(1/8*size*x8, 1/4*size*y8, 0);
							var obj = cutSlice(position, offset);
							cuts.push(obj);
							var temp = new THREE.Vector3(x*x8, y*y8, 0);
							offsets.push(temp);
					}
					tileOffset.set (i*x8*3-200, j*y8*3, 0 );
					var grid =  new THREE.Vector3(i, j, 0);

					var tX = pieceWidth * i-imageWidth/2+pieceWidth/2;
					var tY = pieceHeight * j-imageHeight/2+pieceHeight/2;
					var target = new THREE.Vector3(tX, tY, 0);

					var tile = {meshs:cuts, offset:toZero, target:target,
						 grid:grid, index:index, offsets:offsets, placed:false};
					tiles.push(tile);

					objects.push(tile);
			}
		}

		for (i = 0; i < tiles.length; i++){
			var x = tiles[i].offset.x;
			var y = tiles[i].offset.y;
			var z = tiles[i].offset.z;

			for (j = 0; j < tiles[i].meshs.length; j++){
				tiles[i].meshs[j].position.set(0,0,0);
				//var transX = targets.circles[i].position.x;
				//var transY = targets.circles[i].position.y;

				//var transX = targets.circles[i].position.x+tiles[i].offset.x-pieceWidth/2;
				//var transY = targets.circles[i].position.y+tiles[i].offset.y-pieceHeight/2;
				//console.log(targets.circles[i].position)

				//	tiles[i].meshs[j].translateX(transX);
				// tiles[i].meshs[j].translateY(transY);

				targetList.push(tiles[i].meshs[j]);
				tiles[i].meshs[j].name = tiles[i].index;

				scene.add(tiles[i].meshs[j]);
			}

		}
}
function setLines() {
	x8 = Math.round(pieceWidth / 8);
  y8 = Math.round(pieceHeight / 8);

	var mCx = 2, mCy = 2;

  //var piecesArrayObj = [];
  for (var j = 0; j < verticalPieces; j++) {
      //piecesArrayObj[j] = [];
      for (i = 0; i < horizontalPieces; i++) {

          var geometry = new THREE.Geometry();
          var n = j + i * verticalPieces;
          var offsetX = pieceWidth * i;
          var offsetY = pieceHeight * j;
					var index = j + i * verticalPieces;
					var meshs = [], offsets = [];
					var group = new THREE.Group();

					/*piecesArrayObj[j][i] = new Object();
					piecesArrayObj[j][i].right = Math.floor(Math.random() * 2);
					piecesArrayObj[j][i].up = Math.floor(Math.random() * 2);*/

					if (j > 0) {
							piecesArrayObj[j][i].down = 1 - piecesArrayObj[j - 1][i].up;
					}
					if (i > 0) {
							piecesArrayObj[j][i].left = 1 - piecesArrayObj[j][i - 1].right;
					}
					var corners = [], edges = [], middles = [], cornerIndex = 0, edgeIndex = 0, middleIndex = 0;
          var tileObj = piecesArrayObj[j][i];
          if (j != 0 && tileObj.down == 1) {
						var middleGeom  = new THREE.Geometry();
						var middleMat = new THREE.LineBasicMaterial( { color : 0x3d1755 } );
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + (mCy+size) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + (mCy+size) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middles.push(new THREE.Line( middleGeom, middleMat ));
						var x = size/4, y = -size;
						middles[middleIndex].position.set(offsetX+(x)*x8, offsetY+(y)*y8,0);
						lines.push(middles[middleIndex]);
						middleIndex++;
						y += size/4;
						group.add(cutSlice(offsetX+(x)*x8, offsetY+(y)*y8, 1/4, 1/2));

          }
          if (i != horizontalPieces - 1 && tileObj.right == 1 ) {
						var middleGeom  = new THREE.Geometry();
						var middleMat = new THREE.LineBasicMaterial( { color : 0x3d1755 } );
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size) * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size) * x8, offsetY + (mCy+size/2) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + (mCy+size/2) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middles.push(new THREE.Line( middleGeom, middleMat ));
						var x = size, y = size/4;
						middles[middleIndex].position.set(offsetX+(x)*x8, offsetY+(y)*y8,0);
						lines.push(middles[middleIndex]);
						middleIndex++;
						x += size/4;
						group.add(cutSlice(offsetX+(x)*x8, offsetY+(y)*y8, 1/2, 1/4));
						//group.add(cutSlice(offsetX+(x)*x8, offsetY+(y)*y8, 1/2, 1/4));

          }
          if (j != verticalPieces - 1 && tileObj.up == 1) {
						var middleGeom  = new THREE.Geometry();
						var middleMat = new THREE.LineBasicMaterial( { color : 0x3d1755 } );
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + (mCy+size) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + (mCy+size) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middles.push(new THREE.Line( middleGeom, middleMat ));
						var x = size/4, y = size;
						middles[middleIndex].position.set(offsetX+(x)*x8, offsetY+(y)*y8,0);
						lines.push(middles[middleIndex]);
						middleIndex++;
						y += size/4;
						group.add(cutSlice(offsetX+(x)*x8, offsetY+(y)*y8, 1/4, 1/2));
          }
          if (i != 0 && tileObj.left == 1) {
						var middleGeom  = new THREE.Geometry();
						var middleMat = new THREE.LineBasicMaterial( { color : 0x3d1755 } );
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size) * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size) * x8, offsetY + (mCy+size/2) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + (mCy+size/2) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middles.push(new THREE.Line( middleGeom, middleMat ));
						var x = -size, y = size/4;
						middles[middleIndex].position.set(offsetX+(x)*x8, offsetY+(y)*y8,0);
						lines.push(middles[middleIndex]);
						middleIndex++;
						x += size/4;
						group.add(cutSlice(offsetX+(x)*x8, offsetY+(y)*y8, 1/2, 1/4));
      		}


					if (i == 0 ){
						var middleGeom  = new THREE.Geometry();
						var middleMat = new THREE.LineBasicMaterial( { color : 0xfe0000 } );
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + (mCy+size/2) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + (mCy+size/2) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middles.push(new THREE.Line( middleGeom, middleMat ));
						var x = -2, y = 1;
						middles[middleIndex].position.set(offsetX+(x)*x8, offsetY+(y)*y8,0);
						lines.push(middles[middleIndex]);
						middleIndex++;
						group.add(cutSlice(offsetX+(x)*x8, offsetY+(y)*y8, 1/4, 1/4));
					}
					if (i ==  horizontalPieces - 1){
						var middleGeom  = new THREE.Geometry();
						var middleMat = new THREE.LineBasicMaterial( { color : 0xfe0000 } );
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + (mCy+size/2) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + (mCy+size/2) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middles.push(new THREE.Line( middleGeom, middleMat ));
						var x = 4, y = 1;
						middles[middleIndex].position.set(offsetX+(x)*x8, offsetY+(y)*y8,0);
						lines.push(middles[middleIndex]);
						middleIndex++;
						group.add(cutSlice(offsetX+(x)*x8, offsetY+(y)*y8, 1/4, 1/4));
					}
					if (j == 0){
						var middleGeom  = new THREE.Geometry();
						var middleMat = new THREE.LineBasicMaterial( { color : 0xfe0000 } );
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + (mCy+size/2) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + (mCy+size/2) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middles.push(new THREE.Line( middleGeom, middleMat ));
						var x = 1, y = -2;
						middles[middleIndex].position.set(offsetX+(x)*x8, offsetY+(y)*y8,0);
						lines.push(middles[middleIndex]);
						middleIndex++;
						group.add(cutSlice(offsetX+(x)*x8, offsetY+(y)*y8, 1/4, 1/4));
					}
					if (j == verticalPieces - 1){
						var middleGeom  = new THREE.Geometry();
						var middleMat = new THREE.LineBasicMaterial( { color : 0xfe0000 } );
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + mCy * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + (mCy+size/2) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + (mCy+size/2) * y8, 0 ));
						middleGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
						middles.push(new THREE.Line( middleGeom, middleMat ));
						var x = 1, y = 4;
						middles[middleIndex].position.set(offsetX+(x)*x8, offsetY+(y)*y8,0);
						lines.push(middles[middleIndex]);
						middleIndex++;
						group.add(cutSlice(offsetX+(x)*x8, offsetY+(y)*y8, 1/4, 1/4));
					}

					var centerGeom  = new THREE.Geometry();
          var centerMat = new THREE.LineBasicMaterial( { color : 0xff7506 } );

          centerGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
          centerGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size) * x8, offsetY + mCy * y8, 0 ));
          centerGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size) * x8, offsetY + (mCy+size) * y8, 0 ));
          centerGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + (mCy+size) * y8, 0 ));
          centerGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));

					var center = new THREE.Line( centerGeom, centerMat );
          center.position.set(offsetX, offsetY,0);
					lines.push(center);
					group.add(cutSlice(offsetX+mCx*x8/2, offsetY+mCy*y8/2, 1/2, 1/2));

					for (var x=-2;x<3;x+=4)
						for (var y=-2;y<3;y+=4)	{
							var cornerGeom  = new THREE.Geometry();
							var cornerMat = new THREE.LineBasicMaterial( { color : 0x2684a6 } );
							cornerGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
							cornerGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + mCy * y8, 0 ));
							cornerGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + (mCy+size/2) * y8, 0 ));
							cornerGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + (mCy+size/2) * y8, 0 ));
							cornerGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
							corners.push(new THREE.Line( cornerGeom, cornerMat ));
							var x1 = 0, y1 = 0;
							if (x>0) x1 = 2;
							if (y>0) y1 = 2;
							corners[cornerIndex].position.set(offsetX+(x+x1)*x8, offsetY+(y+y1)*y8,0);
							lines.push(corners[cornerIndex]);
							cornerIndex++;
							group.add(cutSlice(offsetX+(x+x1)*x8, offsetY+(y+y1)*y8, 1/4, 1/4));

							var edgeGeom  = new THREE.Geometry();
							var edgeMat = new THREE.LineBasicMaterial( { color : 0x2e0ae0 } );
							edgeGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
							edgeGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/4) * x8, offsetY + mCy * y8, 0 ));
							edgeGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/4) * x8, offsetY + (mCy+size/2) * y8, 0 ));
							edgeGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + (mCy+size/2) * y8, 0 ));
							edgeGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
							edges.push(new THREE.Line( edgeGeom, edgeMat ));
							var x2 = 2, y2 = 0;
							if (x>0) x2 -= 1;
							if (y>0) y2 += 2;
							edges[edgeIndex].position.set(offsetX+(x+x2)*x8, offsetY+(y+y2)*y8,0);
							lines.push(edges[edgeIndex]);
							edgeIndex++;
							x2 = 1.5;
							y2 = 0;
							if (x>0) x2 -= 1;
							if (y>0) y2 += 2;
							group.add(cutSlice(offsetX+(x+x2)*x8, offsetY+(y+y2)*y8, 1/8, 1/4));

							var edgeGeom  = new THREE.Geometry();
							var edgeMat = new THREE.LineBasicMaterial( { color : 0x002511} );
							edgeGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
							edgeGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + mCy * y8, 0 ));
							edgeGeom.vertices.push(new THREE.Vector3( offsetX + (mCx+size/2) * x8, offsetY + (mCy+size/4) * y8, 0 ));
							edgeGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + (mCy+size/4) * y8, 0 ));
							edgeGeom.vertices.push(new THREE.Vector3( offsetX + mCx * x8, offsetY + mCy * y8, 0 ));
							edges.push(new THREE.Line( edgeGeom, edgeMat ));
							var x3 = 0, y3 = 2;
							if (x>0) x3 += 2;
							if (y>0) y3 -= 1;
							edges[edgeIndex].position.set(offsetX+(x+x3)*x8, offsetY+(y+y3)*y8,0);
							lines.push(edges[edgeIndex]);
							edgeIndex++;

							x3 = 0;
							y3 = 1.5;
							if (x>0) x3 += 2;
							if (y>0) y3 -= 1;
							group.add(cutSlice(offsetX+(x+x3)*x8, offsetY+(y+y3)*y8, 1/4, 1/8));
					}
					group.translateX(i*x8*scrapScle.x-scrapOffset.x);
					group.translateY(j*y8*scrapScle.y-scrapOffset.y);
    			group.tourType = "infoTag";
					groups.push(group);
					//console.log(dragObjects)
      }
    }
		//console.log("lines", piecesArrayObj)
		for (var i= 0; i<lines.length; i++){
			lines[i].translateY(100);
				scene.add(lines[i]);
		}
}
function checkPlace(){
	var d = Math.floor(dragVec.distanceTo(tiles[dragIndex].target));
	var x = Math.floor(tiles[dragIndex].target.x), y = Math.floor(tiles[dragIndex].target.y);
	var x1 = Math.floor(dragVec.x), y1  = Math.floor(dragVec.y);
	///console.log(x, y, x1, y1, d);
	if (d<targetRange){
		for (var i=0; i<tiles[dragIndex].meshs.length; i++){
			var x = tiles[dragIndex].target.x+tiles[dragIndex].offset.x-pieceWidth/2;
			var y = tiles[dragIndex].target.y+tiles[dragIndex].offset.y-pieceHeight/2;
			var z = tiles[dragIndex].target.z+tiles[dragIndex].offset.z;
			tiles[dragIndex].meshs[i].position.set(x,y,z);
		}
		tiles[dragIndex].placed = true;
		dragIndex = null;
		score++;
		console.log("Placed " +score.toString()+"/"+totalScore.toString())
	}

}
function setCircles(){
	angle = Math.PI*2/totalScore;
	var angle2 = Math.PI*4/totalScore;
	for (var i=0;i<totalScore;i++){
			var Tobject = new THREE.Object3D();
			targets.table.push( Tobject );

			//console.log(tiles[i].offset)
			var transX = tiles[i].offset.x-pieceWidth/2;
			var transY = tiles[i].offset.y-pieceHeight/2;
			 /*transX = -pieceWidth/2;
			 transY = -pieceHeight/2;
			tranX = 0;
			tranY = 0;*/

			var Cobject = new THREE.Object3D();
			 Cobject.position.x = Math.sin(angle*i)*radius+transX;
			 Cobject.position.y = Math.cos(angle*i)*radius+transY;
			 targets.circle.push( Cobject );


			var CSobject = new THREE.Object3D();
			if (i % 2 == 0){
				CSobject.position.x = Math.sin(angle*(i+0.5))*radius*1.2+transX;
				CSobject.position.y = Math.cos(angle*(i+0.5))*radius*1.2+transY;
			}
			else{
				CSobject.position.x = Math.sin(angle*i)*radius*0.8+transX;
				CSobject.position.y = Math.cos(angle*i)*radius*0.8+transY;
			}
			targets.circles.push( CSobject );
		}
		//console.log(targets);
		//shuffle(targets.circles);
		//shuffle(targets.circle);
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
function transform( targets, duration ) {

	TWEEN.removeAll();
	//console.log("targets", targets );
	//console.log("obj", objects);
	for ( var i = 0; i < objects.length; i ++ ) {
		var rand1 = Math.random();
		var rand2 = Math.random();
		for ( var j = 0; j < objects[i].meshs.length; j ++ )	{
			var object = objects[ i ].meshs[j];
			var target = targets[ i ];

			//console.log(object.position, target.position);

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
