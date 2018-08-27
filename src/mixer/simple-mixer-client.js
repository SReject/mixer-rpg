// native module imports
const {EventEmitter} = require('events');

// dep module imports
const mixerClient = require('beam-client-node');
const WebSocket = require('ws');

// custom module imports
const player = require('../player/index.js');
const {tokenize} = require('../misc/util.js');

// states enumerate
const states = {
    DISCONNECTED: 0,
    RETRIEVING_CHAT_INFO: 1,
    CONNECTING: 2,
    AUTHENTICATING: 3,
    CONNECTED: 4
};

class SimpleMixerClient extends EventEmitter {
    constructor(mixer, clientId, userId, channelId) {
        super();

        let self = this;
        self.state = states.DISCONNECTED;
        self.mixerClient = mixer;
        self.clientId = clientId;
        self.userId = userId;
        self.channelId = channelId;

        // Contains a list of ids of which to suppress ChatMessage events for
        self.suppressOwnMessages = {};

        // because of weird 'this' bindings related to events, we need to do some bind() magic
        [
            'connect',
            '$onClose',
            '$onError',
            '$onOpen',
            '$onChatMessage',
            '$reset',
            'whisper',
            'broadcast',
            'delete',
            'getChatUsers'
        ].forEach(property => {
            self[property] = SimpleMixerClient.prototype[property].bind(self);
        });

        // give player a reference to the request runner
        player.setRequestRunner(mixer.request);
    }

    request(...args) {
        return this.mixerClient.request(...args);
    }

    connect() {
        let self = this;

        if (self.socket) {
            return self;
        }

        // attempt to get chat details
        self.state = states.RETRIEVING_CHAT_INFO;

        console.log('[Mixer Chat] Retrieving chat info');

        return (self.chat = new mixerClient.ChatService(self.mixerClient))
            .join(self.channelId)
            .then(details => {
                console.log('[Mixer Chat] Chat info retrieved; opening chat connection');

                self.chatdetails = details.body;
                self.state = states.CONNECTING;

                // Create new chat websocket connection
                self.socket = new mixerClient.Socket(WebSocket, details.body.endpoints).boot();

                // listen for close and error events
                self.socket.on('closed', self.$onClose);
                self.socket.on('error', self.$onError);

                // wait for connection to open
                return new Promise((resolve, reject) => {

                    // store resolve and reject
                    self.$$resolve = resolve;
                    self.$$reject = reject;

                    // listen for open event
                    self.socket.ws.on('open', self.$onOpen);
                });
            })
            .then(() => {
                self.state = states.AUTHENTICATING;
                console.log('[Mixer Chat] Connection opened; Authenticating');


                return new Promise((resolve, reject) => {

                    self.$$reject = reject;

                    // Attempt auth
                    self.socket.auth(self.channelId, self.userId, self.chatdetails.authkey).then(result => {

                        // cleanup and resolve
                        self.$$reject = null;
                        resolve(result);
                    });
                });
            })
            .then(() => {
                self.state = states.CONNECTED;
                self.socket.on('ChatMessage', self.$onChatMessage);
                console.log('[Mixer Chat] Authenticated');
                return Promise.resolve(self);

            }).catch(err => {
                self.$reset();
                return Promise.reject(err);
            });
    }

    whisper(user, message) {

        // Check if client is connected
        if (this.state !== states.CONNECTED) {
            throw new Error(`Not Connected: ${this.state}`);
        }

        let me = this;

        // send whisper
        this.socket.call('whisper', [user, message]).then(msg => {
            me.suppressOwnMessages[msg.id] = true;
        });
    }

    broadcast(message) {

        let self = this;

        // Check if client is connected
        if (self.state !== states.CONNECTED) {
            throw new Error(`Not Connected: ${self.state}`);
        }

        // send message
        self.socket.call('msg', [message]).then(msg => {
            self.suppressOwnMessages[msg.id] = true;
        });
    }

    delete(id) {
        let self = this;

        // Check if client is connected
        if (self.state !== states.CONNECTED) {
            throw new Error(`Not Connected: ${self.state}`);
        }

        // delete message
        this.socket.call('deleteMessage', [id]).catch(err => {
            if (err === 'Access denied.') {
                return;
            }
            return Promise.reject(err);
        });
    }

    getChatUsers() {
        let self = this;
        if (self.state !== states.CONNECTED) {
            throw new Error(`Not Connected: ${self.state}`);
        }

        return self.chat.getUsers(self.channelId, {limit: 100}).then(res => {
            console.log(res.headers.link);

            return Promise.resolve(res.body);
        });
    }



    $reset() {
        let self = this;

        if (self.socket) {
            self.socket.ws.removeListener('open', self.$onOpen);
            self.socket.removeListener('closed', self.$onClose);
            self.socket.removeListener('error', self.$onError);
            self.socket.removeListener('ChatMessage', self.$onChatMessage);
            self.socket.close();
            self.socket = null;
        }

        // reset state
        self.$$resolve = null;
        self.$$reject = null;
        self.chatdetails = null;
        self.suppressOwnMessages = {};
        self.state = states.DISCONNECTED;
    }


    $onOpen() {
        let self = this,
            resolve = self.$$resolve;

        // remove event listeners
        self.socket.ws.removeListener('open', self.$onOpen);

        // cleanup
        self.$$resolve = null;
        self.$$reject = null;

        // resolve the promise
        if (resolve) {
            resolve();
        }
    }
    $onClose() {
        let self = this,
            reject = self.$$reject;

        self.$reset();

        if (reject) {
            reject();

        } else {
            self.emit('closed');
        }
    }
    $onError(err) {
        let self = this,
            reject = self.$$reject;

        self.$reset();

        if (reject) {
            reject(err);

        } else {
            self.emit('wserror', err);
        }
    }
    $onChatMessage(data) {

        let self = this;

        // if the chat message originated from this chat instance don't emit the event outward
        if (self.suppressOwnMessages[data.id]) {
            delete self.suppressOwnMessages[data.id];
            return;
        }

        let parts = data.message.message;

        data.message.tokens = tokenize(parts);

        // (re)build the raw message
        data.message.rawtext = parts.reduce((acc, val) => {
            return acc + val.text;
        }, '');

        // Emit chat message event
        self.emit('ChatMessage', data);
    }
}

module.exports = SimpleMixerClient;