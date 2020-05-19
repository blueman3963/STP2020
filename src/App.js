import React from 'react';

import Three from './components/three.jsx'

import { socket } from './utils/socket.js'

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
  }

  componentDidMount() {
    socket.on('ready', () => {
      this.setState({init:true}, () => {
        socket.emit('onboard', {role:this.state.role,first:this.state.first,last:this.state.last,email: this.state.email});
      })
    })

    socket.on('queue',order => this.setState({queue:order}))
  }

  getIn() {
    this.setState({role:'0', first:'John', last:'doe', gender:'generic'},() => {
      this.setState({onboard:true})
    })
  }

  init() {
    socket.emit('ready')
  }

  render() {

    return (
      <div className="App">
        <style>{`
            @font-face {
              font-family: 'Menlo Regular';
              font-style: normal;
              font-weight: normal;
              src: local('Menlo Regular'), url('./assets/Menlo-Regular.woff') format('woff');
            }

            body {
              font-family: 'Menlo Regular';
            }

            .step1 {
            }

            .step1 .btn {
              position: fixed;
              left: 50vw;
              top: ${window.innerHeight/2}px;
              transform: translate(-50%, -50%);
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
              font-size: 30px;
              text-align: center;
              border: 1px solid #000;
              margin-bottom: 20px;
              width: 200px;
            }

            .input:focus {
              outline: none;
            }


            .btn {
              padding: 0px 2px;
              letter-spacing: 2px;
              font-size: 50px;
              border: 1px solid #000;
              display: inline-block;
              line-height: 50px;
              cursor: pointer;
              margin: auto;
            }

            .btn:hover {
              background-color: #000;
              color: #fff;

            }
        `}</style>
        {
          this.state.init
          ? <Three role={this.state.role} first={this.state.first} last={this.state.last}/>
          : this.state.queue
          ? <div>The Gallery is full, you are number {this.state.queue} in the line</div>
          : this.state.onboard
          ? <div className='step2'>
            <div>
              <div>
              <div>
                <input className='input' style={{marginRight: '20px'}} placeholder='first name' onChange={e => this.setState({first: e.target.value})}/>
                <input className='input' placeholder='last name' onChange={e => this.setState({last: e.target.value})}/>
              </div>
              <div>
                <input className='input' style={{width: '420px'}} placeholder='email' onChange={e => this.setState({email: e.target.value})}/>
              </div>
              </div>
              <div className='btn' onClick={() => this.init()}>start</div>
            </div>
          </div>
          : <div className='step1'>
            <div className='btn' onClick={() => this.getIn()}>Enter</div>
          </div>
        }

      </div>
    );
  }
}

export default App;
