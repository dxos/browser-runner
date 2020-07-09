if (!window.process) {
  window.process = typeof process !== 'undefined' ? process : {};
}

window.process.argv = __process_argv; // eslint-disable-line

window.process.exit = (code = 0) => {
  window.exit = code;
};

const EventEmitter = require('events');

const emitter = new EventEmitter();

window.process.on = (...args) => emitter.on(...args);

window.process.send = msg => {
  window.__ipcSend(msg);
};

window.__ipcReceive = data => {
  emitter.emit('message', data.type === 'Buffer' ? Buffer.from(data) : data);
};
