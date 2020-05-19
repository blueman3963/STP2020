import * as THREE from 'three'
import { PointerLockControls } from '../utils/pointer.js'
import { GLTFLoader } from '../utils/GLTFLoader.js'
import { socket } from '../utils/socket.js'

import * as assets from '../assets/assets.json'


//setup scene
    var scene = new THREE.Scene();
    var fogColor = new THREE.Color(0xffdd15);
    scene.background = fogColor;
    scene.fog = new THREE.Fog(fogColor, 0.0025, 300);


//setup camera
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    camera.position.y = -5
    camera.position.z = Math.random()*10-60
    camera.position.x = Math.random()*10


//setup renderer
    var renderer = new THREE.WebGLRenderer();
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( window.innerWidth, window.innerHeight );


//setup light
    var pointLight = new THREE.PointLight( 0xdddd99, 1, 200 );
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
    var ground = new THREE.Mesh( new THREE.PlaneGeometry( 160, 160 ), material );
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
    for(let i = 0; i < 4; i++) {
      var geometry = new THREE.PlaneBufferGeometry( 200, 200 );
      let wall = new THREE.Mesh( geometry, baseMaterial );
      wall.position.y = 90
      wall.receiveShadow = true;
      switch(i) {
        case 0:
          wall.rotation.y = Math.PI/2
          wall.position.x = 80
          break;
        case 1:
          wall.rotation.y = Math.PI/2
          wall.position.x = -80
          break;
        case 2:
          wall.position.z = 80
          break;
        case 3:
          wall.position.z = -80
          break;
        default:
          break;
      }
      scene.add( wall );
    }


//board

    var logoG = new THREE.PlaneBufferGeometry( 150, 50 );
    let logoimg = require('../assets/tex/logo.png')
    let logoTe = floorLoader.load( logoimg, function ( tex ) {})
    var logoMa = new THREE.MeshBasicMaterial({
          map:logoTe,
          transparent: true
        });
    let logo = new THREE.Mesh( logoG, logoMa );
    logo.rotation.x = Math.PI/2
    logo.position.y = 180
    scene.add( logo );

    var boardG = new THREE.PlaneBufferGeometry( 17, 2 );
    let boardimg = require('../assets/tex/title.png')
    let boardTe = floorLoader.load( boardimg, function ( tex ) {})
    var boardMa = new THREE.MeshPhongMaterial({
          color: 0xa0adaf,
          shininess: 10,
          specular: 0x111111,
          side: THREE.DoubleSide,
          map:boardTe,
          transparent: true,
        });
    let board = new THREE.Mesh( boardG, boardMa );
    board.position.z = -75
    board.position.y = -5
    scene.add( board );


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


//preload artworks

    let date = Date.now()/1000
    let roundTimeAll = 200
    let countRound = 40
    let roundTimeEach = roundTimeAll*countRound/assets.default.length
    let round = date%roundTimeAll
    let artstart = Math.floor(round*assets.default.length/roundTimeAll)
    let initpos = (assets.default.length*round/roundTimeAll - artstart)*(2*Math.PI-.8)/roundTimeEach
    var artloader = new THREE.TextureLoader();
    var arts = []
    let assetsList = assets.default
    for(let i=0; i<countRound; i++) {
      let c = i+artstart
      if( c >= assets.default.length ) {
        c = c - assets.default.length
      }
      var texture = artloader.load( assetsList[c].link, function ( tex ) {

        let workMat = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              map: tex,
              side: THREE.DoubleSide
            })


        let artwork = new THREE.Mesh( new THREE.PlaneBufferGeometry( tex.image.width/100, tex.image.height/100 ), workMat );
        let art = new THREE.Group();
        art.add(artwork)
        artwork.position.z = -70
        scene.add( art );
        arts.push(art);
        art.position.y = -5
        art.rotation.y = i*(2*Math.PI-.8)/40 + .4 + initpos
      });
    }






export { scene, camera, renderer, controls, loader, textures, arts, logo, roundTimeEach, artstart, artloader }
