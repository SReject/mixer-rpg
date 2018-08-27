// native module imports
const {EventEmitter} = require('events');

// dep module imports
const request = require('request');

// custom module imports

const has = (obj, key, noNull) => Object.prototype.hasOwnProperty.call(obj, key) && (!noNull || obj[key] != null);



class MixerClient extends EventEmitter {

    constructor() {
        super();

        this.$chats = {};
        this.$chatsPending = {};
    }

    // closes all associated connections
    shutdown() {
    }


    // creates a new chat instance
    join(chanid) {
        let self = this;

        // todo validate chanid

        // check if there is a pending entry for the chanid
        if (has(self.$chatsPending, chanid)) {
            return self.$chatsPending[chanid];
        }

        // check if there is a validated chat entry for the chanid
        if (has(self.$chats, chanid)) {
            return self.$chats[chanid];
        }


        return self.$chatsPending[chanid] = self.request('GET', `chats/${chanid}`).then(response => {

            // remove the entry from the pending list
            delete self.$chatsPending[chanid];


        });
    }

    // retrieves a previously created chat instance
    chat(chanid) {
    }



    // end chat connection
    chatLeave(id, ...args) {
        return this.chat(id).leave(...args);
    }
    chatKill(id, ...args) {
        return this.chat(id).kill(...args);
    }



    // get chat history
    chatHistory(id, ...args) {
        return this.chat(id).history(...args);
    }


    // send chat message
    chatBroadcast(msg) {
    }
    chatWhisper(id, ...args) {
        return this.chat(id).whisper(...args);
    }
    chatMessage(id, ...args) {
        return this.chat(id).msg(...args);
    }


    // remove chat message
    chatDelete(id, ...args) {
        return this.chat(id).delete(...args);
    }
    chatPurge(id, ...args) {
        return this.chat(id).delete(...args);
    }
    chatClear(id, ...args) {
        return this.chat(id).clear(...args);
    }


    // timeout chat user
    timeout(id, ...args) {
        return this.chat(id).delete(...args);
    }


    // polls
    voteStart(id, ...args) {
        return this.chat(id).voteStart(...args);
    }
    voteChoose(id, ...args) {
        return this.chat(id).voteChoose(...args);
    }


    // give away
    giveawayStart(id, ...args) {
        return this.chat(id).giveawayStart(...args);
    }




    // make request against api
    request(method, uri, options) {

    }

    // make auth-less request against api
    static request(method, uri, options) {
    }
}


module.exports = MixerClient;