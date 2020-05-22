import React from 'react';

import Three from './components/three.jsx'

import { socket } from './utils/socket.js'

import * as track1 from './assets/mix/01.mp3'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      init: false,
      role: '0',
      queue: 0,
      first: 'John',
      last: 'Doe'
    }
    this.title = React.createRef()
    this.bgm = React.createRef()
    this.motice2 = React.createRef()
  }

  componentDidMount() {
    socket.on('ready', () => {
      this.setState({init:true}, () => {
        socket.emit('onboard', {role:this.state.role,first:this.state.first,last:this.state.last,email: this.state.email});
      })
    })

    socket.on('disconnect', () => {
      this.motice2.current.style.display = 'flex'
    })

    socket.on('queue',order => this.setState({queue:order}))

  }

  getIn() {

    //this.bgm.current.volume = .2
    this.setState({role:'0', first:'John', last:'doe', gender:'generic', email:'N/A'},() => {
      this.setState({onboard:true})
    })
  }

  init() {
    //this.bgm.current.play()

    if(this.state.email === 'admin@stp') {
      this.setState({init:true, role:'1'}, () => {
        socket.emit('onboard', {role:1,first:this.state.first,last:this.state.last,email: this.state.email});
      })
    } else {
      socket.emit('ready')
    }
  }

  render() {

    return (
      <div className="App">
        <style>{`

            body {
              background-color: #ffdd15;
            }

            .step1 .wrapper {
              font-size: 14px;
              line-height: 1.5em;
              width: 600px;
              position: fixed;
              left: 50vw;
              top: 50vh;
              transform: translate(-50%, -50%);
            }

            .step1 .btn {
              display: block;
              margin: auto;
              margin-top: 60px;
            }

            .step2 {
              position: fixed;
              display: flex;
              left: 0;
              top: 0;
              align-items: center;
              justify-content: center;
              width: 100vw;
              height: ${window.innerHeight}px;
              text-align: center;
            }

            .input {
              display: inline-block;
              margin: auto;
              font-size: 20px;
              padding: 14px;
              text-align: center;
              border: 1px solid #000;
              margin-bottom: 20px;
              width: 200px;
              background-color: transparent;
            }
            ::placeholder { /* Chrome, Firefox, Opera, Safari 10.1+ */
              color: #ccaa00;
              opacity: 1; /* Firefox */
            }

            .input:focus {
              outline: none;
            }


            .btn {
              padding: 14px;
              letter-spacing: 2px;
              font-size: 20px;
              border: 1px solid #000;
              display: inline-block;
              cursor: pointer;
              margin: auto;
              width: 200px;
              text-align: center;
            }

            .btn:hover {
              background-color: #ED1D23;
              color: #fff;
              border: 1px solid #ED1D23;
            }

            .line {
              position: fixed;
              left: 50vw;
              top: 50vh;
              color: #ED1D23;
              white-space: nowrap;
              letter-spacing: 0;
              transform: translateX(-50%);
            }

            .notice {
              position: fixed;
              width: 100vw;
              height: ${window.innerHeight}px;
              background-color: #ffdd15;
              color: #ED1D23;
              display: none;
              align-items: center;
              justify-content: center;
              z-index: 99999999;
            }

            @media only screen and ( max-width: 900px ) {
              .notice {
                display: flex;
              }
            }
        `}</style>
        {
          this.state.init
          ? <Three role={this.state.role} first={this.state.first} last={this.state.last}/>
          : this.state.queue
          ? <div className='line'>The Gallery is full, you are number {this.state.queue} in the line. Thank you for your patience.</div>
          : this.state.onboard
          ? <div className='step2'>
            <div>
              <div>
              <div>
                <input className='input' style={{marginRight: '20px'}} maxLength="12" placeholder='first name' onChange={e => this.setState({first: e.target.value})}/>
                <input className='input' placeholder='last name' maxLength="12" onChange={e => this.setState({last: e.target.value})}/>
              </div>
              <div>
                <input className='input' style={{width: '280px'}} placeholder='email' onChange={e => this.setState({email: e.target.value})}/>
              </div>
              </div>
              <div className='btn' onClick={() => this.init()}>start</div>
            </div>
          </div>
          : <div className='step1'>
            <div className='wrapper'>
              <span style={{color: 'red'}}>Serving the People</span> is pleased to present the BFA Show, a digital showcase of student artwork. Open to all students enrolled in Bachelor of Fine Arts programs, BFA Show received submissions across a wide range of mediums from 837 students attending 96 universities in 13 countries. Detailed information of all works will be available after the virtual opening at stp.world. Congratulations to all the students!
              <div className='btn' onClick={() => this.getIn()}>Enter</div>
            </div>
          </div>
        }

        <div className='notice'>This Gallery only opens on desktop browser.</div>
        <div className='notice2' style={{position: 'fixed', left: '0', top: '0', width: '100vw', height: '100vh', display:'none', alignItems:'center', justifyContent: 'center'}} ref={this.motice2}>Sorry we have lost your connection. Please try reload this app.</div>

        {
          false
          ?<audio ref={this.bgm} loop className='bgm'>
            <source src={track1} />
          </audio>
          :''
        }

      </div>
    );
  }
}

export default App;
