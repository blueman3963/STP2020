import React from 'react'

import * as THREE from 'three'
import { scene, camera, controls, renderer, loader, textures, arts, logo, roundTimeEach, artstart, artloader } from './three_init.js'
import { socket } from '../utils/socket.js'
//import QRCode from 'qrcode.react'

import * as testmodel from '../assets/test.glb'
import * as tips from '../assets/tips.png'
import * as clap from '../assets/clap.wav'

import * as assets from '../assets/assets.json'

class Three extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      lock: false,
      messaging: false,
      chat: []
    }

    this.wrapper = React.createRef()
    this.helper = React.createRef()
    this.menu = React.createRef()
    this.quit = React.createRef()
    this.messageBox = React.createRef()
    this.users = {}
    this.model = null
    this.clock = new THREE.Clock();

    this.clap = new Audio(clap)

    this.message = ''

    this.artcount = 0
  }

  componentDidMount() {
    //setup tip
    controls.addEventListener( 'lock', () => {
    	this.menu.current.style.display = 'none';
      this.quit.current.style.display = 'block';
      this.setState({lock: true})
    });
    window.addEventListener( 'resize', () => this.onWindowResize(), false );

    controls.addEventListener( 'unlock', () => {
    	this.menu.current.style.display = 'flex';
      this.quit.current.style.display = 'none';
      this.setState({messaging:false})
      this.setState({lock: false})
    });
    scene.add( controls.getObject() );

    //append renderer
    this.wrapper.current.appendChild( renderer.domElement );
    //

    //control
    window.addEventListener('keydown', e => {
      if(e.keyCode == 9 && this.state.lock){
        //trigger msg
        e.preventDefault()
        let msg = this.state.messaging
        this.setState({messaging:!msg}, () => {
          if(!msg) {
            this.message = ''
            this.messageBox.current.focus()
          }
        })
      } else if(e.keyCode == 70 && !this.state.messaging) {
        if(!this.me.prepare){
          this.me.prepare = true
        } else {
          this.me.prepare = false
        }
      } else if(e.keyCode == 67 && !this.state.messaging) {
        if(!this.me.claping){
          this.me.claping = true

          //audio
          this.clap.volume = .3
          this.clap.play()

          this.me.prepare = false
          setTimeout(() => {
            this.me.claping = false
          },3000)
        }
      }

    })


    socket.on('exist', data => this.existUser(data))
    socket.on('newuser', data => this.newUser(data))
    socket.on('chathistory', data => this.setState({chat:data}))


    loader.load( testmodel, gltf => {

          var model = gltf.scene;

          //scene.add( model );
          model.position.y = -10
          model.eulerOrder = 'YXZ';
          model.frustumCulled = false
          model.children[3].visible = false
          model.children[1].visible = false
          model.children[0].visible = false

          model.traverse( o => {
            if (o.frustumCulled) {
              o.frustumCulled = false
            }
          });

          //right arm

          this.me = model;
          this.me.walking = false
          this.me.claping = false
          this.me.prepare = false
          scene.add( model );

          //animation
          let mixer = new THREE.AnimationMixer( model );
          this.me.mixer = mixer
          let animations = gltf.animations
          let actions = {}
          actions.idle = mixer.clipAction( animations[ 0 ] );
          actions.clap = mixer.clipAction( animations[ 3 ] );
          actions.prepare = mixer.clipAction( animations[ 5 ] );

          Object.keys(actions).forEach(key => {
            actions[key].play()
            actions[key].setEffectiveWeight( 0 )
          })
          this.me.actions = actions
          this.me.wt = {}
          this.me.wt.clap = 0
          this.me.wt.prepare = 0

          this.start()

        });


  }

  start() {

    //socket commu
    socket.on('render', data => this.renderWorld(data))
    socket.on('kill', id => {
      if(this.users[id]) {
        scene.remove(this.users[id]);
        this.users[id].traverse( o => {
          if (o.geometry) {
            o.geometry.dispose()
          }
          if (o.material) {
            if (o.material.length) {
                for (let i = 0; i < o.material.length; ++i) {
                    o.material[i].dispose()
                }
            }
            else {
                o.material.dispose()
            }
          }
        });
        delete this.users[id]
      }
    })


    setInterval(() => {

      let data = {
        pos: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        },
        aiming: {
          x: camera.position.x-Math.sin(camera.eulerData.y)*3,
          z: camera.position.z-Math.cos(camera.eulerData.y)*3
        },
        head: {
          x: Math.min(camera.eulerData.x, .5),
          y: camera.eulerData.y
        },
        walking: this.me.walking,
        claping: this.me.claping,
        prepare: this.me.prepare,
      }
      socket.emit('move', data);

      if(this.me.claping && this.me.wt.clap < 1) {
        this.me.wt.clap += .1
        this.me.actions.clap.setEffectiveWeight( this.me.wt.clap )
      } else if(!this.me.claping && this.me.wt.clap > 0) {
        this.me.wt.clap -= .1
        this.me.actions.clap.setEffectiveWeight( this.me.wt.clap )
      }

      if(this.me.prepare && this.me.wt.prepare < 1) {
        this.me.wt.prepare += .1
        this.me.actions.prepare.setEffectiveWeight( this.me.wt.prepare )
      } else if(!this.me.prepare && this.me.wt.prepare > 0) {
        this.me.wt.prepare -= .1
        this.me.actions.prepare.setEffectiveWeight( this.me.wt.prepare )
      }

    },20)

    //display message
    socket.on('message', data => {
      Object.keys(this.users).forEach(key => {
        if(key === data.id) {
          //clean
          if(this.users[key].msg) {
            this.users[key].msg.traverse( o => {
              if (o.geometry) {
                  o.geometry.dispose()
              }
              if (o.material) {
                  o.material.dispose()
              }
              if (o.texture) {
                  o.texture.dispose()
              }
            });
          }
          this.users[key].clear = null
          this.users[key].talking.remove(this.users[key].msg)
          this.users[key].msg = null
          clearTimeout(this.users[key].clear)
          //show msg
          let test = document.createElement('canvas');
          let testc = test.getContext('2d');

          let words = data.msg.split(' ');
          let lines = [];
          let currentLine = words[0];

          let width
          for (let i = 1; i < words.length; i++) {
              let word = words[i];
              let width = testc.measureText(currentLine + " " + word).width;
              if (width < 70) {
                  currentLine += " " + word;
              } else {
                  lines.push(currentLine);
                  currentLine = word;
              }
          }
          lines.push(currentLine);

          let bitmap = document.createElement('canvas');
          let w = 3800, h = lines.length*440+800
          bitmap.width = w;
          bitmap.height = h;

          let g = bitmap.getContext('2d');
          g.font = 'bold 400px Arial';
          g.fillStyle = 'white';
          g.textAlign = "left";
          for (let i = 0; i < lines.length; i++) g.fillText(lines[i], 400, 840 + (i*440) );

          // canvas contents will be used for a texture
          var texture = new THREE.Texture(bitmap)
          texture.needsUpdate = true;
          var geometry = new THREE.PlaneGeometry( 2, 2*h/w, 2 );
          var material = new THREE.MeshBasicMaterial( {map : texture} );
          var plane = new THREE.Mesh( geometry, material );
          plane.position.x = 3
          plane.position.y = 5
          this.users[key].talking.add(plane)
          this.users[key].msg = plane
          this.users[key].clear = setTimeout(() => {
            this.users[key].talking.remove(plane)
            this.users[key].msg = null
          }, 10000)

        }
      })
    })

    // start
    var animate = () => {

      requestAnimationFrame( animate );

      camera.direction.z = Number( camera.moveForward ) - Number( camera.moveBackward );
			camera.direction.x = Number( camera.moveRight ) - Number( camera.moveLeft );
			camera.direction.normalize();

      if(this.menu.current.style.display === 'none' && !this.state.messaging){
  			controls.moveRight( camera.direction.x * .1 );
  			controls.moveForward( camera.direction.z * .1 );
      }

      camera.position.x = Math.max(Math.min(camera.position.x, 79),-79)
      camera.position.z = Math.max(Math.min(camera.position.z, 79),-79)


      logo.rotation.z += .001

      if( this.me ) {
        this.me.position.x = camera.position.x
        this.me.position.z = camera.position.z
        this.me.position.y = camera.position.y - 5
        this.me.rotation.y = camera.eulerData.y
        if((camera.direction.z || camera.direction.x)&&!this.state.messaging) {
          this.me.walking = true
        } else {
          this.me.walking = false
        }
      }


      //mixer
      var Delta = this.clock.getDelta();

      //slideshow
      arts.forEach(art => {
        art.rotation.y += Delta*(Math.PI*2-.8)/roundTimeEach
        if(art.rotation.y > (Math.PI*2-.4)) {
          scene.remove( art );
          arts.pop()
          this.artcount ++
          if(this.artcount+40+artstart > assets.default.length-1) {
            this.artcount = - 40 - artstart
          }
          //new art
          let texture = artloader.load( assets.default[this.artcount+40+artstart].link, ( tex ) => {

            let workMat = new THREE.MeshBasicMaterial({
                  color: 0xffffff,
                  map: tex,
                  side: THREE.DoubleSide
                })


            let artwork = new THREE.Mesh( new THREE.PlaneBufferGeometry( tex.image.width/100, tex.image.height/100 ), workMat );
            let newart = new THREE.Group();
            newart.add(artwork)
            artwork.position.z = -70
            scene.add( newart );
            arts.unshift(newart);
            newart.position.y = -5
            newart.rotation.y = .4
          });


        }
      })

      Object.keys(this.users).forEach(key => {
        let user = this.users[key]
        user.mixer.update( Delta );
      })
      this.me.mixer.update( Delta );

      renderer.render( scene, camera );
    };
    animate();

    //
  }


  //render other users
  renderWorld(users) {
    Object.keys(users).forEach(id => {
      if(socket.id !== id) {
        if(users[id].data.pos && this.users[id]){
          let model = this.users[id]
          model.position.x = users[id].data.pos.x
          model.position.z = users[id].data.pos.z
          model.position.y = users[id].data.pos.y-5
          model.rotation.y = users[id].data.head.y
          model.name.rotation.y = camera.eulerData.y - users[id].data.head.y
          model.talking.rotation.y = camera.eulerData.y - users[id].data.head.y


          //walking animation
          if(users[id].data.walking && model.wt.walk < 1) {
            model.wt.walk += .1
            model.actions.walk.setEffectiveWeight( model.wt.walk )
          } else if(!users[id].data.walking && model.wt.walk > 0) {
            model.wt.walk -= .1
            model.actions.walk.setEffectiveWeight( model.wt.walk )
          }
          //clap animation
          if(users[id].data.claping && model.wt.clap < 1) {
            model.wt.clap += .1
            model.actions.clap.setEffectiveWeight( model.wt.clap )
            if(model.clap.paused) {
              model.clap.play()
            }

          } else if(!users[id].data.claping && model.wt.clap > 0) {
            model.wt.clap -= .1
            model.actions.clap.setEffectiveWeight( model.wt.clap )
          }
          //prepare animation
          if(users[id].data.prepare && model.wt.prepare < 1) {
            model.wt.prepare += .1
            model.actions.prepare.setEffectiveWeight( model.wt.prepare )
          } else if(!users[id].data.prepare && model.wt.prepare > 0) {
            model.wt.prepare -= .1
            model.actions.prepare.setEffectiveWeight( model.wt.prepare )
          }


          model.children[0].rotation.x = users[id].data.head.x

        }
      }
    })
  }

  //add users on login
  existUser(users) {
    Object.keys(users).forEach(id => {
      if(id === socket.id) return

      this.newFigure(id,users[id].role, users[id].realname)

    })
  }

  //add new joined user
  newUser(data) {

    if(data.id === socket.id) {
      return
    }

    this.newFigure(data.id, data.role, data.realname)

  }

	onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}

  lock() {
    controls.lock();
  }

  newFigure(id,role, realname) {
    loader.load( testmodel, gltf => {

          var model = gltf.scene;
          //scene.add( model );
          model.position.y = -10
          model.eulerOrder = 'YXZ';

          model.children[0].children[0].children[0].material.map = textures['head'+role]

          model.children[2].traverse( o => {
            if (o.frustumCulled) {
              o.frustumCulled = false
            }
          });

          //nametag
          var bitmap = document.createElement('canvas');
          var g = bitmap.getContext('2d');
          bitmap.width = 1600;
          bitmap.height = 400;
          g.font = 'bold 200px Arial';

          g.fillStyle = 'white';
          g.textAlign = "center";
          g.fillText(realname, 800, 250);

          // canvas contents will be used for a texture
          var texture = new THREE.Texture(bitmap)
          texture.needsUpdate = true;
          var geometry = new THREE.PlaneGeometry( 2, .5, 2 );
          var material = new THREE.MeshBasicMaterial( {map : texture} );
          var name = new THREE.Mesh( geometry, material );
          name.position.y = 7
          model.name = name
          model.add( name );

          //talking
          var talking = new THREE.Group();
          model.talking = talking
          model.add( talking );

          //audio
          let clap = this.clap.cloneNode()
          clap.volume = .1
          model.clap = clap




          model.traverse( object => {

            if ( object.isMesh ) {
              object.castShadow = true
            }
          })

          this.users[id] = model;
          scene.add( model );

                    //animation
                    let mixer = new THREE.AnimationMixer( model );
                    this.users[id].mixer = mixer
                    let animations = gltf.animations
                    let actions = {}
                    actions.idle = mixer.clipAction( animations[ 0 ] );
          					actions.walk = mixer.clipAction( animations[ 1 ] );
                    actions.clap = mixer.clipAction( animations[ 3 ] );
                    actions.prepare = mixer.clipAction( animations[ 5 ] );
                    Object.keys(actions).forEach(key => {
                      actions[key].play()
                      actions[key].setEffectiveWeight( 0 )
                    })
                    this.users[id].actions = actions
                    this.users[id].walking = false
                    this.users[id].prepare = false
                    this.users[id].wt = {}
                    this.users[id].wt.walk = 0
                    this.users[id].wt.clap = 0
                    this.users[id].wt.prepare = 0

        } );
  }

  sendMessage(e) {
    if(e.keyCode == 13 && this.message !== '') {
      socket.emit('message', this.message)
      this.setState({messaging:false})
    }
  }

  render() {
    return (
      <div>
        <div
          ref={this.wrapper}
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: '#ddd'
          }}
          onClick={() => this.lock()}
        ></div>

        <style>{`
            .helper {
              position: fixed;
              right: 20px;
              top: 20px;
              font-size: 24px;
              z-index: 9999;
              text-align: center;
            }

            .menu {
              width: 100vw;
              height: 100vh;
              position: fixed;
              pointer-events: none;
              display: flex;
              align-items: center;
              justify-content: center;
              left: 0;
              top: 0;
              background-color: rgba(0,0,0,.7);
              z-index: 999;
            }

            .menu img {
              width: 90vw;
              max-width: 500px;
            }

            .quit {
              position: fixed;
              top: 20px;
              left: 20px;
              font-size: 24px;
              z-index: 9999;
              display: none;
            }

            .quit span {
              border: 1px solid #000;
              padding: 6px 10px;
            }

            audio {
              position: fixed;
              top: 0;
              right: 0;
              z-index: 9999;
            }

            .message {

            }

            .message input {
              position: fixed;
              left: 50vw;
              bottom: 50px;
              transform: translateX(-50%);
              width: 600px;
              border-radius: 25px;
              font-size: 24px;
              height: 50px;
              padding: 0 10px;
              border: none;
            }

            .message input:focus {
              outline: none;
            }

            .send {
              position: fixed;
              left: calc(50vw + 300px);
              bottom: 65px;
              transform: translateX(-100%);
            }

            .history {
              position: fixed;
              bottom: 100px;
              left: 50vw;
              transform: translateX(-50%);
            }

            .historychat {
              width: 600px;
              display: block;
              background-color: #000;
              color: #fff;
              font-size: 20px;
              border-radius: 30px;
              padding: 10px;
              margin-bottom: 20px;
            }
        `}</style>
        <div className='helper' ref={this.helper}>
          your are <strong>{this.props.first+' '+this.props.last}</strong>
        </div>
        <div className='menu' ref={this.menu}>
          <img src={tips} />
        </div>
        <div className='quit' ref={this.quit}>
          press <span>esc</span> to unlock your cursor
        </div>
        {
          this.state.messaging
          ?<div className='message'>
            <div className='history'>
              {
                this.state.chat.map(c => {
                  return <div className='historychat' style={{textAlign:c.id == socket.id ? 'right': 'left'}}>{c.msg}</div>
                })
              }
            </div>
            <input ref={this.messageBox} placeholder='message' onChange={e => this.message = e.target.value} onKeyDown={e => this.sendMessage(e)}/>
            <div className='send'>enter&#8629;</div>
          </div>
          :''
        }
      </div>
    )
  }
}



export default Three
