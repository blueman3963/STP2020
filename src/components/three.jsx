import React from 'react'

import * as THREE from 'three'
import { scene, camera, controls, renderer, loader, textures, pointLight, spotLight, arts } from './three_init.js'
import { socket } from '../utils/socket.js'
//import QRCode from 'qrcode.react'

import * as testmodel from '../assets/test.glb'
import * as tips from '../assets/tips.png'
import * as yea from '../assets/yea.wav'
import * as clap from '../assets/clap.wav'


class Three extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      init:false,
      data: ""
    }

    this.wrapper = React.createRef()
    this.helper = React.createRef()
    this.menu = React.createRef()
    this.quit = React.createRef()
    this.users = {}
    this.model = null
    this.clock = new THREE.Clock();

    this.yea = new Audio(yea)
    this.clap = new Audio(clap)
    this.channels = []

    this.spot = .5
    this.env = .5
    this.stop = null
  }

  componentDidMount() {
    //setup tip
    controls.addEventListener( 'lock', () => {
    	this.menu.current.style.display = 'none';
      this.quit.current.style.display = 'block';
    });
    window.addEventListener( 'resize', () => this.onWindowResize(), false );

    controls.addEventListener( 'unlock', () => {
    	this.menu.current.style.display = 'flex';
      this.quit.current.style.display = 'none';
    });
    scene.add( controls.getObject() );

    socket.on('light', light => {
      spotLight.intensity = light.spot;
      pointLight.intensity = light.env;
    });

    //append renderer
    this.wrapper.current.appendChild( renderer.domElement );
    //

    //control
    window.addEventListener('keydown', e => {
      if(e.keyCode == 32){
        if(!this.me.cheering && !this.me.claping){
          this.me.cheering = true

          //audio
          this.yea.volume = .3
          this.yea.play()

          clearTimeout(this.stop)
          confetti.start()
          this.stop = setTimeout(() => confetti.stop(),1000)


          this.me.prepare = false
          setTimeout(() => {
            this.me.cheering = false
          },3000)
        }
      } else if(e.keyCode == 70) {
          if(!this.me.prepare && !this.me.cheering){
            this.me.prepare = true
          } else {
            this.me.prepare = false
          }
      } else if(e.keyCode == 67) {
        if(!this.me.cheering && !this.me.claping){
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



          //control for brendan
          if(this.props.name == '16'){

              switch(e.keyCode) {
                case 49:
                  //spot up
                  if(this.spot < 1) {
                    this.spot += .1
                    socket.emit('light', {spot:this.spot,env:this.env})
                  }
                  break;
                case 50:
                  //spot down
                  if(this.spot >= .1) {
                    this.spot -= .1
                    socket.emit('light', {spot:this.spot,env:this.env})
                  }
                  break;
                case 51:
                  //env up
                  if(this.env < 1) {
                    this.env += .1
                    socket.emit('light', {spot:this.spot,env:this.env})
                  }
                  break;
                case 52:
                  //env down
                  if(this.env >= .1) {
                    this.env -= .1
                    socket.emit('light', {spot:this.spot,env:this.env})
                  }
                  break;
              }
          }
    })




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
          //model.children[2].children[1].rotation.x = Math.PI/8

          this.me = model;
          this.me.walking = false
          this.me.cheering = false
          this.me.claping = false
          this.me.prepare = false
          this.me.shaking = false
          scene.add( model );

          //animation
          let mixer = new THREE.AnimationMixer( model );
          this.me.mixer = mixer
          let animations = gltf.animations
          let actions = {}
          actions.idle = mixer.clipAction( animations[ 0 ] );
          actions.cheer = mixer.clipAction( animations[ 2 ] );
          actions.clap = mixer.clipAction( animations[ 3 ] );
          actions.prepare = mixer.clipAction( animations[ 5 ] );
          actions.shake = mixer.clipAction( animations[ 6 ] );

          Object.keys(actions).forEach(key => {
            actions[key].play()
            actions[key].setEffectiveWeight( 0 )
          })
          this.me.actions = actions
          this.me.wt = {}
          this.me.wt.cheer = 0
          this.me.wt.clap = 0
          this.me.wt.prepare = 0
          this.me.wt.shake = 0


          this.start()

        });


  }

  start() {

    //socket commu
    socket.emit('onboard', {name:this.props.name,realname:this.props.realname,gender:this.props.gender});
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
    socket.on('existuser', data => this.existUser(data))
    socket.on('newuser', data => this.newUser(data))


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
        cheering: this.me.cheering,
        claping: this.me.claping,
        prepare: this.me.prepare,
        shaking: this.me.shaking
      }
      socket.emit('move', data);

      //me animation
      if(this.me.cheering && this.me.wt.cheer < 1) {
        this.me.wt.cheer += .1
        this.me.actions.cheer.setEffectiveWeight( this.me.wt.cheer )
      } else if(!this.me.cheering && this.me.wt.cheer > 0) {
        this.me.wt.cheer -= .1
        this.me.actions.cheer.setEffectiveWeight( this.me.wt.cheer )
      }

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

      if(this.me.shaking && this.me.wt.shake < 1) {
        this.me.wt.shake += .1
        this.me.actions.shake.setEffectiveWeight( this.me.wt.shake )
      } else if(!this.me.shaking && this.me.wt.shake > 0) {
        this.me.wt.shake -= .1
        this.me.actions.shake.setEffectiveWeight( this.me.wt.shake )
      }
    },20)


    // start
    var animate = () => {

      requestAnimationFrame( animate );

      camera.direction.z = Number( camera.moveForward ) - Number( camera.moveBackward );
			camera.direction.x = Number( camera.moveRight ) - Number( camera.moveLeft );
			camera.direction.normalize();

      if(this.menu.current.style.display === 'none'){
  			controls.moveRight( camera.direction.x * .1 );
  			controls.moveForward( camera.direction.z * .1 );
      }

      camera.position.x = Math.max(Math.min(camera.position.x,48),-48)
      camera.position.z = Math.max(Math.min(camera.position.z,48),-48)

      if( this.me ) {
        this.me.position.x = camera.position.x
        this.me.position.z = camera.position.z
        this.me.position.y = camera.position.y - 5
        this.me.rotation.y = camera.eulerData.y
        if(camera.direction.z || camera.direction.x) {
          this.me.walking = true
        } else {
          this.me.walking = false
        }
      }

      arts.forEach(art => {
        let pos = art.pos
        art.position.y = 0

      })



      //mixer
      var mixerUpdateDelta = this.clock.getDelta();
      Object.keys(this.users).forEach(key => {
        let user = this.users[key]
        user.mixer.update( mixerUpdateDelta );
      })
      this.me.mixer.update( mixerUpdateDelta );

      renderer.render( scene, camera );
    };
    animate();

    //
  }


  //render other users
  renderWorld(users) {
    let shaking = false
    Object.keys(users).forEach(id => {
      if(socket.id !== id) {
        if(users[id].data.pos && this.users[id]){
          let model = this.users[id]
          model.position.x = users[id].data.pos.x
          model.position.z = users[id].data.pos.z
          model.position.y = users[id].data.pos.y-5
          model.rotation.y = users[id].data.head.y
          model.plane.rotation.y = camera.eulerData.y - users[id].data.head.y

          if(
            Math.abs(camera.position.z-users[id].data.aiming.z) < .6
            &&
            Math.abs(camera.position.x-users[id].data.aiming.x) < .6
          ) {
            let angle = Math.abs(camera.eulerData.y-users[id].data.head.y)
            if( angle > Math.PI ) angle = 2*Math.PI-angle
            if(angle > 3 && users[id].data.prepare){
              shaking = true
            }
          }

          //walking animation
          if(users[id].data.walking && model.wt.walk < 1) {
            model.wt.walk += .1
            model.actions.walk.setEffectiveWeight( model.wt.walk )
          } else if(!users[id].data.walking && model.wt.walk > 0) {
            model.wt.walk -= .1
            model.actions.walk.setEffectiveWeight( model.wt.walk )
          }
          //chear animation
          if(users[id].data.cheering && model.wt.cheer < 1) {
            model.wt.cheer += .1
            model.actions.cheer.setEffectiveWeight( model.wt.cheer )
            if(model.yea.paused) {
              model.yea.play()
              clearTimeout(this.stop)
              confetti.start()
              this.stop = setTimeout(() => confetti.stop(),1000)
            }

          } else if(!users[id].data.cheering && model.wt.cheer > 0) {
            model.wt.cheer -= .1
            model.actions.cheer.setEffectiveWeight( model.wt.cheer )
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
          //shaking animation
          if(users[id].data.shaking && model.wt.shake < 1) {
            model.wt.shake += .1
            model.actions.shake.setEffectiveWeight( model.wt.shake )
          } else if(!users[id].data.shaking && model.wt.shake > 0) {
            model.wt.shake -= .1
            model.actions.shake.setEffectiveWeight( model.wt.shake )
          }

          model.children[0].rotation.x = users[id].data.head.x

        }
      }
    })
    if(this.me.prepare) {
      this.me.shaking = shaking
    } else {
      this.me.shaking = false
    }
  }

  //add users on login
  existUser(users) {
    Object.keys(users).forEach(id => {
      if(id === socket.id) {
        return
      }

      this.newFigure(id,users[id].name, users[id].realname)

    })
  }

  //add new joined user
  newUser(data) {

    if(data.id === socket.id) {
      return
    }

    this.newFigure(data.id, data.name, data.realname)

  }

	onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}

  lock() {
    controls.lock();
  }

  newFigure(id,name, realname) {
    loader.load( testmodel, gltf => {

          var model = gltf.scene;
          //scene.add( model );
          model.position.y = -10
          model.eulerOrder = 'YXZ';

          console.log(name)
          console.log(textures['head0'])
          model.children[0].children[0].children[0].material.map = textures['head'+name]

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
          var plane = new THREE.Mesh( geometry, material );
          plane.position.y = 7
          model.plane = plane
          model.add( plane );

          //audio
          let yea = this.yea.cloneNode()
          yea.volume = .1
          model.yea = yea
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
                    actions.cheer = mixer.clipAction( animations[ 2 ] );
                    actions.clap = mixer.clipAction( animations[ 3 ] );
                    actions.prepare = mixer.clipAction( animations[ 5 ] );
                    actions.shake = mixer.clipAction( animations[ 6 ] );
                    Object.keys(actions).forEach(key => {
                      actions[key].play()
                      actions[key].setEffectiveWeight( 0 )
                    })
                    this.users[id].actions = actions
                    this.users[id].walking = false
                    this.users[id].prepare = false
                    this.users[id].shaking = false
                    this.users[id].wt = {}
                    this.users[id].wt.walk = 0
                    this.users[id].wt.cheer = 0
                    this.users[id].wt.clap = 0
                    this.users[id].wt.prepare = 0
                    this.users[id].wt.shake = 0

        } );
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
        `}</style>
        <div className='helper' ref={this.helper}>
          your are <strong>{this.props.realname}</strong>
        </div>
        <div className='menu' ref={this.menu}>
          <img src={tips} />
        </div>
        <div className='quit' ref={this.quit}>
          press <span>esc</span> to unlock your cursor
        </div>
      </div>
    )
  }
}




//confetti
var confetti = {
	maxCount: 150,		//set max confetti count
	speed: 2,			//set the particle animation speed
	frameInterval: 15,	//the confetti animation frame interval in milliseconds
	alpha: 1.0,			//the alpha opacity of the confetti (between 0 and 1, where 1 is opaque and 0 is invisible)
	gradient: false,	//whether to use gradients for the confetti particles
	start: null,		//call to start confetti animation (with optional timeout in milliseconds, and optional min and max random confetti count)
	stop: null,			//call to stop adding confetti
	toggle: null,		//call to start or stop the confetti animation depending on whether it's already running
	remove: null,		//call to stop the confetti animation and remove all confetti immediately
};

(function() {
	confetti.start = startConfetti;
	confetti.stop = stopConfetti;
	confetti.toggle = toggleConfetti;
	confetti.remove = removeConfetti;
	var supportsAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
	var colors = ["rgba(30,144,255,", "rgba(107,142,35,", "rgba(255,215,0,", "rgba(255,192,203,", "rgba(106,90,205,", "rgba(173,216,230,", "rgba(238,130,238,", "rgba(152,251,152,", "rgba(70,130,180,", "rgba(244,164,96,", "rgba(210,105,30,", "rgba(220,20,60,"];
	var streamingConfetti = false;
	var animationTimer = null;
	var lastFrameTime = Date.now();
	var particles = [];
	var waveAngle = 0;
	var context = null;

	function resetParticle(particle, width, height) {
		particle.color = colors[(Math.random() * colors.length) | 0] + (confetti.alpha + ")");
		particle.color2 = colors[(Math.random() * colors.length) | 0] + (confetti.alpha + ")");
		particle.x = Math.random() * width;
		particle.y = Math.random() * height - height;
		particle.diameter = Math.random() * 10 + 5;
		particle.tilt = Math.random() * 10 - 10;
		particle.tiltAngleIncrement = Math.random() * 0.07 + 0.05;
		particle.tiltAngle = Math.random() * Math.PI;
		return particle;
	}

	function runAnimation() {
		if (particles.length === 0) {
			context.clearRect(0, 0, window.innerWidth, window.innerHeight);
			animationTimer = null;
		} else {
			var now = Date.now();
			var delta = now - lastFrameTime;
			if (!supportsAnimationFrame || delta > confetti.frameInterval) {
				context.clearRect(0, 0, window.innerWidth, window.innerHeight);
				updateParticles();
				drawParticles(context);
				lastFrameTime = now - (delta % confetti.frameInterval);
			}
			animationTimer = requestAnimationFrame(runAnimation);
		}
	}

	function startConfetti(timeout, min, max) {
		var width = window.innerWidth;
		var height = window.innerHeight;
		window.requestAnimationFrame = (function() {
			return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function (callback) {
					return window.setTimeout(callback, confetti.frameInterval);
				};
		})();
		var canvas = document.getElementById("confetti-canvas");
		if (canvas === null) {
			canvas = document.createElement("canvas");
			canvas.setAttribute("id", "confetti-canvas");
			canvas.setAttribute("style", "display:block;z-index:999999;pointer-events:none;position:fixed;top:0");
			document.body.prepend(canvas);
			canvas.width = width;
			canvas.height = height;
			window.addEventListener("resize", function() {
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
			}, true);
			context = canvas.getContext("2d");
		} else if (context === null)
			context = canvas.getContext("2d");
		var count = confetti.maxCount;
		if (min) {
			if (max) {
				if (min == max)
					count = particles.length + max;
				else {
					if (min > max) {
						var temp = min;
						min = max;
						max = temp;
					}
					count = particles.length + ((Math.random() * (max - min) + min) | 0);
				}
			} else
				count = particles.length + min;
		} else if (max)
			count = particles.length + max;
		while (particles.length < count)
			particles.push(resetParticle({}, width, height));
		streamingConfetti = true;
		runAnimation();
		if (timeout) {
			window.setTimeout(stopConfetti, timeout);
		}
	}

	function stopConfetti() {
		streamingConfetti = false;
	}

	function removeConfetti() {
		streamingConfetti = false;
		particles = [];
	}

	function toggleConfetti() {
		if (streamingConfetti)
			stopConfetti();
		else
			startConfetti();
	}

	function isConfettiRunning() {
		return streamingConfetti;
	}

	function drawParticles(context) {
		var particle;
		var x, y, x2, y2;
		for (var i = 0; i < particles.length; i++) {
			particle = particles[i];
			context.beginPath();
			context.lineWidth = particle.diameter;
			x2 = particle.x + particle.tilt;
			x = x2 + particle.diameter / 2;
			y2 = particle.y + particle.tilt + particle.diameter / 2;
			if (confetti.gradient) {
				var gradient = context.createLinearGradient(x, particle.y, x2, y2);
				gradient.addColorStop("0", particle.color);
				gradient.addColorStop("1.0", particle.color2);
				context.strokeStyle = gradient;
			} else
				context.strokeStyle = particle.color;
			context.moveTo(x, particle.y);
			context.lineTo(x2, y2);
			context.stroke();
		}
	}

	function updateParticles() {
		var width = window.innerWidth;
		var height = window.innerHeight;
		var particle;
		waveAngle += 0.01;
		for (var i = 0; i < particles.length; i++) {
			particle = particles[i];
			if (!streamingConfetti && particle.y < -15)
				particle.y = height + 100;
			else {
				particle.tiltAngle += particle.tiltAngleIncrement;
				particle.x += Math.sin(waveAngle) - 0.5;
				particle.y += (Math.cos(waveAngle) + particle.diameter + confetti.speed) * 0.5;
				particle.tilt = Math.sin(particle.tiltAngle) * 15;
			}
			if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
				if (streamingConfetti && particles.length <= confetti.maxCount)
					resetParticle(particle, width, height);
				else {
					particles.splice(i, 1);
					i--;
				}
			}
		}
	}
})();




export default Three
