let ftyMixer = require('./src/mixer/index.js');
let commands = require('./src/commands/index.js');
(async function() {
    let mixer = await ftyMixer();
    mixer.on('ChatMessage', commands);
    mixer
        .connect()
        .then(() => {
            console.log('[Mixer] Ready!');
            mixer.broadcast('RPG now online');
        })
        .catch(err => {
            console.log('Failed to connect:');
            console.error(err);
        });
}());