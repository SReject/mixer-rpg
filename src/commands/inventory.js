// custom modules
const {upperfirst} = require('../misc/util.js');
const getPlayerFromToken = require('../misc/deduce-player.js');

module.exports = function factoryInventory(register) {

    // !rpg-inventory
    register({
        name: 'inventory',
        format: '[user]',
        help: 'Returns the full inventory of a user',
        config: {
            command: '-inventory',
            response: 'whisper'
        },
        handle: async function (manager, config, player, msgdata) {

            let tokens = msgdata.message.tokens;

            // too many parameters specified
            if (tokens.length > 2) {
                manager.whisper(`${tokens[1].text}: Too many parameters specified`);
                return;
            }

            getPlayerFromToken(manager.mixer, player, tokens[1])
                .then(query => {

                    let invo = [], prop;

                    // Title
                    prop = query.equiped.title;
                    invo.push(`${query.username} the ${prop.name}(${prop.strength}/${prop.accuracy}/${prop.wisdom})`);

                    // Total Stats
                    prop = query.stats;
                    invo.push(`Stats: ${prop.strength}/${prop.accuracy}/${prop.wisdom}`);

                    // Currency
                    invo.push(`${query.currency} ${manager.currencyName}`);

                    // Prowess
                    prop = query.prowess;
                    invo.push(`Prowess: ${prop.strength}/${prop.accuracy}/${prop.wisdom}`);

                    // base gear
                    ['melee', 'ranged'].forEach(equip => {
                        prop = query.equiped[equip];
                        invo.push(`${upperfirst(equip)}: ${prop.name} (${prop.strength}/${prop.accuracy}/${prop.wisdom})`);
                    });

                    // Send first invo line
                    manager.reply(invo.join(' || '));

                    // Rest of gear
                    invo = [];
                    ['magic', 'armor', 'mount', 'companion', 'trophy', 'potion'].forEach(equip => {
                        prop = query.equiped[equip];
                        invo.push(`${upperfirst(equip)}: ${prop.name} (${prop.strength}/${prop.accuracy}/${prop.wisdom})`);
                    });

                    // send second invo line
                    manager.reply(invo.join(' || '));

                })
                .catch (err => {
                    manager.whisper(`${manager.command}: ${err.message}`);
                });
        }
    });

    // !rpg-stats
    register({
        name: 'stats',
        help: 'Returns a stats summery for the user',
        format: '[user]',
        config: {
            command: '-stats',
            response: 'whisper'
        },
        handle: function (manager, config, player, msgdata) {
            let tokens = msgdata.message.tokens;
            if (tokens.length > 2) {
                manager.whisper(`${manager.command}: Too many parameters`);
            } else if (tokens.length === 2 && tokens[1].type !== 'text' && tokens[1].type !== 'tag') {
                manager.whisper(`${manager.command}: Invalid parameter`);
            } else {
                getPlayerFromToken(manager.mixer, player, tokens[1])
                    .then(query => {
                        manager.reply(`${query.username} the ${query.equiped.title.name}: ${query.stats.strength}/${query.stats.accuracy}/${query.stats.wisdom}`);
                    })
                    .catch(err => {
                        manager.whisper(`${manager.command}: ${err.message}`);
                    });
            }
        }
    });

    // !rpg-coins
    register({
        name: 'currency',
        help: `Returns the amount of ${register.currencyName} a user has`,
        format: '[user]',
        config: {
            command: '-coins',
            response: 'whisper'
        },
        handle: function (manager, config, player, msgdata) {
            let tokens = msgdata.message.tokens;

            if (tokens.length > 2) {
                manager.whisper(`${manager.command}: Too many parameters`);
            } else if (tokens.length === 2 && tokens[1].type !== 'text' && tokens[1].type !== 'tag') {
                manager.whisper(`${manager.command}: Invalid parameter`);
            } else {
                getPlayerFromToken(manager.mixer, player, tokens[1])
                    .then(query => {
                        manager.reply(`${query.username} has ${query.currency} ${manager.currencyName}`);
                    })
                    .catch(err => {
                        manager.whisper(`${manager.command}: ${err.message}`);
                    });
            }
        }
    });

    // !rpg-pay
    register({
        name: 'paycurrency',
        help: `Transfers ${register.currencyName} from yourself to another player`,
        format: '[player] [amount',
        config: {
            command: '-pay',
            response: 'whisper'
        },
        handle: async (manager, config, player, msgdata) => {
            let tokens = msgdata.message.tokens,
                player2;

            // not enough parameters
            if (tokens.length < 3) {
                manager.whisper(`${manager.command}: Invalid parameters`);
                return;
            }

            // too many parameters
            if (tokens.length > 3) {
                manager.whisper(`${manager.command}: Invalid parameters`);
                return;
            }

            // attempt to look up the specified player
            try {
                player2 = await getPlayerFromToken(tokens[1]);

            } catch (err) {
                manager.whisper(`${manager.command}: ${err.message}`);
                return;
            }

            // player2 not found
            if (player2 == null) {
                manager.whisper(`${manager.command}: ${tokens[1].text} isn't playing`);
                return;
            }

            // player2 is same as player issuing the command
            if (player.id === player2.id) {
                manager.whisper(`${manager.command}: You can't transfer ${manager.currencyName} to yourself`);
                return;
            }

            // transfer amount parameter must be text
            if (tokens[2].type !== 'text') {
                manager.whisper(`${manager.command}: Invalid amount parameter`);
                return;
            }

            // convert transfer amount paramter to a number
            let transferAmount = Number(tokens[2].text);

            // transfer amount is not a number of 1 or greater
            if (isNaN(transferAmount) || !isFinite(transferAmount) || transferAmount < 1) {
                manager.whisper(`${manager.command}: The amount to transfer must be a numerical value of atleast 1`);
                return;
            }

            // transfer amount is a decimal
            if (parseInt(transferAmount) !== transferAmount) {
                manager.whisper(`${manager.command}: The amount to transfer must be a whole number`);
                return;
            }

            // player is poor
            if (player.currency < transferAmount) {
                manager.whisper(`${manager.command}: You do not have ${transferAmount} ${manager.currencyName} to transfer.`);
                return;
            }

            // transfer currency
            player.currency -= transferAmount;
            player2.currency += transferAmount;

            // output response
            if (manager.responseType === 'broadcast') {
                manager.broadcast(`@${player.username} has transfered ${transferAmount} ${manager.currencyName} to @${player2.username}`);
            } else {
                manager.whisper(player.username, `You have transfered ${transferAmount} ${manager.currencyName} to ${player2.username}`);
                manager.whisper(player2.username, `${player.username} has transfered ${transferAmount} ${manager.currencyName} to you`);
            }
        }
    });

    register({
        name: 'givecurrency',
        help: `Gives a player ${register.currencyName}`,
        format: '[player]|$all [amount]',
        config: {
            command: '-givecoins',
            response: 'whisper',
            disabled: true,
            overrides: [
                {
                    name: 'role:owner',
                    overrides: {
                        disabled: false
                    }
                }
            ]
        },
        handle: async (manager, config, player, msgdata) => {

            let tokens = msgdata.message.tokens;

            // not enough parameters
            if (tokens.length < 3) {
                manager.whisper(`${manager.command}: Invalid parameters`);
                return;
            }

            // too many parameters
            if (tokens.length > 3) {
                manager.whisper(`${manager.command}: Invalid parameters`);
                return;
            }

            if (tokens[2].type !== 'text' && tokens[2].type !== 'tag') {
                manager.whisper(`${manager.command}: Invalid user parameters`);
                return;
            }

            // amount parameter must be text
            if (tokens[2].type !== 'text') {
                manager.whisper(`${manager.command}: Invalid amount parameter`);
                return;
            }

            // convert transfer amount paramter to a number
            let amount = Number(tokens[2].text);

            // transfer amount is not a number of 1 or greater
            if (isNaN(amount) || !isFinite(amount) || amount === 0) {
                manager.whisper(`${manager.command}: The amount to give must be a numerical value`);
                return;
            }

            // transfer amount is a decimal
            if (parseInt(amount) !== amount) {
                manager.whisper(`${manager.command}: The amount to give must be a whole number`);
                return;
            }

            // give coins to everyone
            if (tokens[1].type === 'text' && tokens[1].text === '$all') {
                manager.whisper(`${manager.command}: Not implemented`);
                return;
            }

            let player2;

            // attempt to look up the specified player
            try {
                player2 = await getPlayerFromToken(manager.mixer, player, tokens[1]);

            } catch (err) {
                manager.whisper(`${manager.command}: ${err.message}`);
                return;
            }

            // player2 not found
            if (player2 == null) {
                manager.whisper(`${manager.command}: ${tokens[1].text} isn't playing`);
                return;
            }

            let p2Currency = player2.currency,
                taken = Math.abs(amount);

            // player2 doesn't have any currency to take
            if (p2Currency === 0 && amount < 0) {
                manager.whisper(`${manager.command}: ${player2.username} doesn't have any money to take`);
                return;
            }

            // player2 has less currency than what is being taken
            if (p2Currency + amount < 0) {
                taken = p2Currency;
            }

            // take currency from player2
            p2Currency = player2.currency += amount;

            // output message(s)
            if (manager.responseType === 'broadcast') {
                if (amount < 0) {
                    manager.reply(`${player.username} has removed ${taken} ${manager.currencyName} from @${player2.username}`);
                } else {
                    manager.reply(`${player.username} has given ${amount} ${manager.currencyName} to @${player2.username}`);
                }
            } else {
                if (amount < 0) {
                    manager.whisper(`You has removed ${taken} ${manager.currencyName} from ${player2.username}`);
                    manager.whisper(`${player.username} has removed ${taken} ${manager.currencyName} from you.`);
                } else {
                    manager.whisper(`You has given ${taken} ${manager.currencyName} to ${player2.username}`);
                    manager.whisper(`${player.username} has given ${taken} ${manager.currencyName} to you.`);
                }
            }

        }
    });
};