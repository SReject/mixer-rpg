const getPlayerFromToken = require('../misc/deduce-player.js');

module.exports = function factoryGroups(register) {

    register({
        name: 'groups',
        help: 'Manipulates a user\'s permission groups',
        format: 'add|rem|list [user] [group]',
        config: {
            command: '-groups',

            // Disable command for everyone except mods and the streamer
            disabled: true,

            overrides: [
                {
                    name: 'role:mod',
                    overrides: {
                        disabled: false
                    }
                },
                {
                    name: 'role:owner',
                    overrides: {
                        disabled: false
                    }
                }
            ]
        },
        handler: function (manager, config, player, msgdata) {
            let tokens = msgdata.message.tokens;

            // basic command validation
            if (tokens.length < 3) {
                manager.whisper(`${manager.command}: Missing parameters`);

            } else if (tokens.length > 4) {
                manager.whisper(`${manager.command}: Too many parameters`);

            } else if (tokens[1].type !== 'text') {
                manager.whisper(`${manager.command}: Invalid parameter`);

            } else if (!/^(?:add|remove|list)$/i.test(tokens[1].text)) {
                manager.whisper(`${manager.command}: unknown action.`);

            } else {
                // attempt to get player data for the specified user
                let player2 = getPlayerFromToken(manager.mixer, player, tokens[3]);

                // unable to find player2
                if (!player2) {
                    manager.whisper(`${manager.command}: Unable to locate ${tokens[2].text}`);

                // !rpg-groups list username
                } else if (tokens[1].text === 'list') {
                    if (tokens.length > 3) {
                        manager.whisper(`${manager.command}: Too many parameters`);
                    }
                    manager.reply(`${player2.username} is grouped as: ${player2.groups.join(', ')}`);

                // missing parameters for !rpg-groups add|remove
                } else if (tokens.length !== 4 || tokens[3].type !== 'text' || tokens[3].text.trim() === '') {
                    manager.whisper(`${manager.command}: missing or invalid permissions group`);

                // !rpg-groups add username group
                } else if (tokens[1].text === 'add') {
                    let group = tokens[3].text.trim().toLowerCase(),
                        groups = player.groups;

                    // specified group is already applied to the user
                    if (groups.findIndex(pGroup => pGroup === group)) {
                        manager.whisper(`${manager.command}: ${player2.username} already belongs to ${group}`);

                    // add group to user
                    } else {
                        groups.push(group);
                        player.groups = groups;
                        manager.reply(`Added '${group}' to ${player2.username}'s permissions`);
                    }

                } else if (tokens[1].text === 'remove') {
                    let group = tokens[3].text.trim().toLowerCase(),
                        groups = player.groups,
                        idx = groups.findIndex(pGroup => pGroup === group);

                    // player doesn't have the specified group applied
                    if (-1 === idx) {
                        manager.whisper(`${manager.command}: ${player2.username} does not belong to ${group}`);

                    // remove the group from the user
                    } else {
                        groups.splice(idx, 1);
                        player.groups = groups;
                        manager.reply(`Removed '${group}' from ${player2.username}'s permissions`);
                    }
                }
            }
        }
    });
};