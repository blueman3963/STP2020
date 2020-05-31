import io from 'socket.io-client';

const devserver = 'http://192.168.1.152:8000'
const server = 'https://stp-earth-server.herokuapp.com'

const socket = io(server,{transports: ['websocket'], upgrade: false});

export { socket }
