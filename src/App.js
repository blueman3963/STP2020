import React from 'react';

import Three from './components/three.jsx'

import { socket } from './utils/socket.js'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      init: false,
      user: '00',
      gender: 'male'
    }
    this.title = React.createRef()
  }

  componentDidMount() {
  }

  render() {

    return (
      <div className="App">
        <style>{`

        `}</style>
        {
          this.state.init
          ? <Three name={this.state.user} realname={this.state.realname} gender={this.state.gender}/>
        :<div>
          <div style={{marginTop: '10px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline'}} onClick={() => this.setState({init:true, user:'0', realname:'john doe', gender:'generic'})}>Artist Entry</div>
          <div style={{marginTop: '10px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline'}} onClick={() => this.setState({init:true, user:'0', realname:'john doe', gender:'generic'})}>Guest Entry</div>
          <div style={{marginTop: '10px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline'}} onClick={() => this.setState({init:true, user:'0', realname:'john doe', gender:'generic'})}>Staff Entry</div>

          </div>
        }

      </div>
    );
  }
}

export default App;
