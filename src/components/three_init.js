import * as THREE from 'three'
import { PointerLockControls } from '../utils/pointer.js'
import { GLTFLoader } from '../utils/GLTFLoader.js'
import { socket } from '../utils/socket.js'

import * as assets from '../assets/assets.json'


//setup scene
    var scene = new THREE.Scene();
    var fogColor = new THREE.Color(0xffdd15);
    scene.background = fogColor;
    scene.fog = new THREE.Fog(fogColor, 0.0025, 250);


//setup camera
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    camera.position.y = -5
    camera.position.z = Math.random()*100-50
    camera.position.x = Math.random()*100-50


//setup renderer
    var renderer = new THREE.WebGLRenderer();
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( window.innerWidth, window.innerHeight );


//setup light
    var pointLight1 = new THREE.PointLight( 0xdddd99, .5, 200 );
    pointLight1.position.set( 50, 50, 50 );
    pointLight1.shadow.bias = - 0.005; // reduces self-shadowing on double-sided objects
    pointLight1.castShadow = true;
    scene.add( pointLight1 );
    var pointLight2 = new THREE.PointLight( 0xdddd99, .5, 200 );
    pointLight2.position.set( 50, 50, -50 );
    pointLight2.shadow.bias = - 0.005; // reduces self-shadowing on double-sided objects
    pointLight2.castShadow = true;
    scene.add( pointLight2 );
    var pointLight3 = new THREE.PointLight( 0xdddd99, .5, 200 );
    pointLight3.position.set( -50, 50, 50 );
    pointLight3.shadow.bias = - 0.005; // reduces self-shadowing on double-sided objects
    pointLight3.castShadow = true;
    scene.add( pointLight3 );
    var pointLight4 = new THREE.PointLight( 0xdddd99, .5, 200 );
    pointLight4.position.set( -50, 50, -50 );
    pointLight4.shadow.bias = - 0.005; // reduces self-shadowing on double-sided objects
    pointLight4.castShadow = true;
    scene.add( pointLight4 );

    var ambientLight = new THREE.AmbientLight( 0x404040, .1 ); // soft white light
    scene.add( ambientLight );

    var hemiLight = new THREE.HemisphereLight( 0xddddff, 0x444422, 0.6 );
    hemiLight.position.set( 0, 10, 0 );
    scene.add( hemiLight );


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
        color: 0xffdd15,
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

    let nameImg1 = require('../assets/tex/list1.png')
    let nameImg2 = require('../assets/tex/list2.png')
    let nameImg3 = require('../assets/tex/list3.png')
    let nameImg4 = require('../assets/tex/list4.png')
    let nameTex1 = floorLoader.load( nameImg1, function ( tex ) {})
    let material1 = new THREE.MeshBasicMaterial( {map: nameTex1, transparent: true} );
    let nameTex2 = floorLoader.load( nameImg2, function ( tex ) {})
    let material2 = new THREE.MeshBasicMaterial( {map: nameTex2, transparent: true} );
    let nameTex3 = floorLoader.load( nameImg3, function ( tex ) {})
    let material3 = new THREE.MeshBasicMaterial( {map: nameTex3, transparent: true} );
    let nameTex4 = floorLoader.load( nameImg4, function ( tex ) {})
    let material4 = new THREE.MeshBasicMaterial( {map: nameTex4, transparent: true} );
    var geometry = new THREE.PlaneGeometry( 6, 93 );
    var name1 = new THREE.Mesh( geometry, material1 );
    name1.position.y = 93
    var name2 = new THREE.Mesh( geometry, material2 );
    name2.position.y = 0
    var name3 = new THREE.Mesh( geometry, material3 );
    name3.position.y = -93
    var name4 = new THREE.Mesh( geometry, material3 );
    name4.position.y = -186
    let name = new THREE.Group()
    name.add(name1)
    name.add(name2)
    name.add(name3)
    name.add(name4)

    scene.add( name );
    name.position.y = 0


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
    for(let i=0; i<2; i++) {
      let img = require('../assets/tex/'+i+'.png')
      textures['head'+i] = faceloader.load( img, function ( tex ) {})
    }


//preload artworks
    let artgroup = new THREE.Group();
    scene.add( artgroup );
    let arts = []

    socket.on('artstart', start => {

      let rotateCount = 40

      var artloader = new THREE.TextureLoader();
      let assetsList = assets.default

      let replace = 0
      let assetLength = 1298

      for(let i=0; i<40; i++) {


        let art = new THREE.Group();
        art.rotation.y = i*Math.PI*2/rotateCount
        arts.push(art)

        let c = i+start
        if( c >= assetLength ) {
          c -= assetLength
        }

        let img = require('../assets/artworks/art' + c + '.jpg')
        var texture = artloader.load( img , tex => {

          let workMat = new THREE.MeshBasicMaterial({
                map: tex
              })

          let artwork = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1, 1 ), workMat );
          artwork.scale.set( 10, 10 * tex.image.height/tex.image.width, 1 );
          artwork.position.z = -65 + Math.random()*10
          artwork.position.y = Math.random()*5-8 + 5 * tex.image.height/tex.image.width

          art.add(artwork)
          artgroup.add(art)
        });
      }



      setInterval(() => {
        let newArt = start + 40 + replace
        if( newArt >= assetLength ) {
          newArt -= assetLength
        }
        let img = require('../assets/artworks/art'+newArt+'.jpg')
        let texture = artloader.load( img , tex => {
          arts[replace%rotateCount].children[0].material.map = tex
          arts[replace%rotateCount].children[0].scale.set( 10, 10 * tex.image.height/tex.image.width, 1 );
          arts[replace%rotateCount].children[0].position.y = Math.random()*5-8+ 5 * tex.image.height/tex.image.width
        })
        console.log(replace%rotateCount)
        replace++

      },6000)

    })






export { scene, camera, renderer, controls, loader, textures, artgroup, logo, name, name1, name2, name3, name4 }
