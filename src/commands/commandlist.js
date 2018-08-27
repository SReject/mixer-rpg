
const has = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

module.exports = function factoryCommandsList(register) {

    // !rpg
    register({
        name: 'commandlist',
        help: 'Returns a list of rpg related commands',
        format: '',
        config: {
            command: '',
            response: 'whisper'
        },
        handle: function (manager) {

            // respond with commands list
            manager.reply(`RPG Commands: ${Object.keys(manager.plugins).join(', ')}`);
        }
    });

    // !rpg-help
    register({
        name: 'help',
        help: 'Returns information pretaining to a specified command',
        format: '[command]',
        config: {
            command: '-help',
            response: 'whisper'
        },
        handle: function (manager, config, player, msgdata) {

            // divide message into parts
            let params = msgdata.message.rawtext.trim().toLowerCase().split(/\s+/g);

            // remove the !command from the params list
            params.shift();

            // no command specified
            if (params.length < 1) {
                manager.whisper(`${manager.command}: Please specify a command`);

            // too many commands specified
            } else if (params.length > 1) {
                manager.whisper(`${manager.command}: Please specify only one command at a time`);

            } else {

                // add command prefix to query if it is not present
                let query = params[0];
                if (query.slice(0, manager.commandPrefix.length) !== manager.commandPrefix) {
                    query = manager.commandPrefix + query;
                }

                // queried command doesn't exist
                if (!has(manager.plugins, query)) {
                    manager.whisper(`${manager.command}: Unknown command: ${params[0]}`);

                } else {
                    let plugin = manager.plugins[query];

                    // command does not have help text
                    if (!has(plugin, 'help') || !plugin.help) {
                        manager.whisper(`${manager.command}: No help available`);

                    // build help response
                    } else {

                        // if the command has a format property add it
                        if (plugin.format) {
                            query += ` ${plugin.format}`;
                        }

                        // add command's help message
                        query += `: ${plugin.help}`;

                        // reply to the user
                        manager.reply(query);
                    }
                }
            }
        }
    });
};