self.onmessage = function (e) {
  console.log('Received from main script:', e.data);
  // Do some work...
  self.postMessage({ type: 'state', payload: { name: e.data.payload } });
};

let state = {};
// client.on('state', (newState) => state = newState);

// client.on('state', () => ...)
// client.send('state', () => ...)
