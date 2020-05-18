import * as THREE from 'three'
import { PointerLockControls } from '../utils/pointer.js'
import { GLTFLoader } from '../utils/GLTFLoader.js'

//import { socket } from '../utils/socket.js'


//setup scene
    var scene = new THREE.Scene();
    var fogColor = new THREE.Color(0xffddff);
    scene.background = fogColor;
    scene.fog = new THREE.Fog(fogColor, 0.0025, 300);




//setup camera
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    camera.position.y = -5
    camera.position.z = Math.random()*20-20
    camera.position.x = Math.random()*20-20


//setup renderer
    var renderer = new THREE.WebGLRenderer();
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( window.innerWidth, window.innerHeight );


//setup light
    var pointLight = new THREE.PointLight( 0xdddd99, .5, 200 );
    pointLight.position.set( 0, 50, 0 );
    pointLight.shadow.bias = - 0.005; // reduces self-shadowing on double-sided objects
    pointLight.castShadow = true;
    scene.add( pointLight );

    var ambientLight = new THREE.AmbientLight( 0x404040, .1 ); // soft white light
    scene.add( ambientLight );

    var hemiLight = new THREE.HemisphereLight( 0xddddff, 0x444422, 0.6 );
    hemiLight.position.set( 0, 10, 0 );
    scene.add( hemiLight );

    var spotLight = new THREE.SpotLight( 0xdddddd, .5 );
    spotLight.position.set( 0, 50, 0 );
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.angle = Math.PI/12
    spotLight.target.position.set(0, 0, -50);

    scene.add( spotLight );
    scene.add( spotLight.target );


//ground
    var floorLoader = new THREE.TextureLoader()
    let floorImg = require('../assets/tex/floor.jpg')
    let floorTex = floorLoader.load( floorImg, function ( tex ) {})
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set( 20, 20 );
    var material = new THREE.MeshPhongMaterial({
					color: 0xa0adaf,
					shininess: 30,
					specular: 0x333311,
          map: floorTex
				})
    var ground = new THREE.Mesh( new THREE.CircleGeometry( 80, 32 ), material );
    ground.rotation.x = -Math.PI/2
    ground.position.y = -10
    ground.receiveShadow = true;
    scene.add( ground );


//walls
    var baseMaterial = new THREE.MeshPhongMaterial({
					color: 0xa0adaf,
					shininess: 10,
					specular: 0x111111,
					side: THREE.DoubleSide,
				});

    var geometry = new THREE.CylinderGeometry( 80, 80, 20, 32, 1, true );
    let wall = new THREE.Mesh( geometry, baseMaterial );
    wall.position.y = -10
		wall.receiveShadow = true;
    scene.add( wall );




    /*
    var canvas = document.createElement('canvas');
    canvas.width = 10000;
    canvas.height = 20000;
    var ctx = canvas.getContext("2d");
    socket.on('draw', sigs => {
      sigs.forEach(sig => {
        var idata = ctx.createImageData(sig.width, sig.height);
        for(var i = 0; i < idata.data.length; i++) idata.data[i] = sig.image[i];

        ctx.putImageData(idata, 0, 19000);
        let sigsTex = new THREE.CanvasTexture(ctx.canvas);
        var baseMaterial = new THREE.MeshPhongMaterial({
    					color: 0xa0adaf,
    					shininess: 10,
    					specular: 0x111111,
    					side: THREE.DoubleSide,
              map: sigsTex
    				});
            board.material = baseMaterial


      })
    })
    */



//setup controls
    var controls = new PointerLockControls( camera, document.body );

    camera.moveForward = false
    camera.moveLeft = false
    camera.moveRight = false
    camera.moveBackward = false
    camera.vx = 0
    camera.vz = 0
    camera.direction = new THREE.Vector3();

    var onKeyDown = function ( event ) {
      switch ( event.keyCode ) {
        case 38: // up
        case 87: // w
          camera.moveForward = true;
          break;
        case 37: // left
        case 65: // a
          camera.moveLeft = true;
          break;
        case 40: // down
        case 83: // s
          camera.moveBackward = true;
          break;
        case 39: // right
        case 68: // d
          camera.moveRight = true;
          break;
      }
    };
    var onKeyUp = function ( event ) {
      switch ( event.keyCode ) {
        case 38: // up
        case 87: // w
          camera.moveForward = false;
          break;
        case 37: // left
        case 65: // a
          camera.moveLeft = false;
          break;
        case 40: // down
        case 83: // s
          camera.moveBackward = false;
          break;
        case 39: // right
        case 68: // d
          camera.moveRight = false;
          break;
      }
    };
    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );


//init GLTFLoader
    var loader = new GLTFLoader();


//init Texloader
    var textures = {}
    var faceloader = new THREE.TextureLoader();
    for(let i=0; i<1; i++) {
      let img = require('../assets/tex/'+i+'.png')
      textures['head'+i] = faceloader.load( img, function ( tex ) {})
    }





//load artworks
    var texloader = new THREE.TextureLoader();
    var arts = []
    for(let i=0; i<1; i++) {
      let img = new Image()
      img.src = 'https://drive.google.com/uc?id=1IRuBj93VWC3-oLxm-O-JGA-raoGrWRgO'
      document.querySelector('body').appendChild(img)
      var texture = texloader.load( 'https://drive.google.com/uc?id=1IRuBj93VWC3-oLxm-O-JGA-raoGrWRgO', function ( tex ) {

        let workMat = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              map: tex,
              side: THREE.DoubleSide
            })


        let art = new THREE.Mesh( new THREE.PlaneBufferGeometry( tex.image.width/100, tex.image.height/100 ), workMat );
        scene.add( art );
        arts.push(art);
        art.pos = i
      });

    }






export { scene, camera, renderer, controls, loader, textures, spotLight, pointLight, arts }
