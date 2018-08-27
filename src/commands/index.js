// custom module imports
const ftyPlayer = require('../player/index.js');
const {settings, pull} = require('../misc/db.js');
const {has} = require('../misc/util.js');
const buildConfig = require('./_config.js');
const {cmdPrefix, sellCommand, equipCommand, plugins} = require('./_register.js');

// Retrieve currnecy name
const currencyName = pull(settings, '/currencyName', {default: 'coins', write: true});


/* Exported function to handle ChatMessage Events from mixer */
module.exports = async function CommandHandler(data) {

    let mixer = this;
    let tokens = data.message.tokens;

    // first token is not text so can't be a command
    if (tokens[0].type !== 'text') {
        return;
    }

    // Store normalized first token
    //     Presumed to be a command
    let command = tokens[0].text.toLowerCase();

    // Check: first token is NOT command
    if (!has(plugins, command)) {
        return;
    }

    console.log(`${data.user_name}: ${data.message.rawtext}`);

    // Retrieve plugin data related to command
    let plugin = plugins[command];

    // retrieve user's player data
    let player = await ftyPlayer(data.user_id, {
        create: true,
        norequest: true,
        username: data.user_name
    });

    // update player's username
    player.username = data.user_name;

    // Build list of permission groups the user belongs to
    let permissionGroups = {};
    player.groups.forEach(group => {
        permissionGroups[`group:${group.toLowerCase()}`] = true;
    });

    data.user_roles.forEach(role => {
        permissionGroups[`role:${role.toLowerCase()}`] = true;
    });

    // Build config
    let config = buildConfig(plugin, permissionGroups, data.message.meta.whisper === true);

    // Public/broadcasted message recieved
    if (data.message.meta.whisper !== true) {

        // delete message if required
        if (config.deleteCommand === true) {
            mixer.delete(data.id);
        }

        // whisper required for commands
        if (config.whisperRequired) {
            console.log('    Command is whisper only');
            return;
        }
    }

    // command is disabled for the user
    if (config.disabled === true) {
        console.log(`    Disabled for ${player.username}`);
        return;
    }

    // parameters ready, call handler
    plugin.handle({
        mixer: mixer,
        plugins: plugins,

        commandPrefix: cmdPrefix,
        command: command,
        currencyName: currencyName,

        sellCommand: sellCommand,
        equipCommand: equipCommand,

        responseType: config.response,

        reply: function (username, message) {

            // duduce target and message
            if (message == null) {
                message = username;
                username = data.user_name;
            }

            // send reply
            if (config.response === 'whisper') {
                console.log(`    ${username}: ${message}`);
                mixer.whisper(username, message);

            } else {
                console.log(`    @${username}, ${message}`);
                mixer.broadcast(`@${username}, ${message}`);
            }
        },

        whisper: function (username, message) {

            // duduce target and message
            if (message == null) {
                message = username;
                username = data.user_name;
            }

            // send whisper
            console.log(`    >@${username}: ${message}`);
            mixer.whisper(username, message);
        },

        broadcast: function (message) {
            console.log(`    ${message}`);
            mixer.broadcast(message);
        },

        delete: mixer.delete
    }, config, player, data);
};