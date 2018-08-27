// custom module imports
const {game, push, pull} = require('../misc/db.js');
const {parameters} = require('../misc/util.js');
const getPlayerFromToken = require('../misc/deduce-player.js');
const players = require('../player/index.js');
const battle = require('./_battle.js');

function remove(type, id) {
    game.delete(`/${type}/pending/${id}`);
    if (pull(game, `/${type}/lastOffer`, {default: null}) === id) {
        game.delete(`/${type}/lastOffer`);
    }
}


function fight(manager, type, offer, player1, player2) {

    let p1, p2, state, msg;
    if (type === 'arena') {
        p1 = player1.equip.companion;
        p2 = player2.equip.companion;
        type = 'arena battle';

    } else {
        p1 = player1.stats;
        p2 = player2.stats;
    }

    // do battle
    let result = battle(p1, p2, 5);

    // player1 wins
    if (result.winner < 0) {
        player1.currency += offer.bet * 2;
        state = 'has won';

    // player2 wins
    } else if (result.winner > 0) {
        player2.currency += offer.bet * 2;
        state = 'has lost';

    // tie
    } else {
        player1.currency += offer.bet;
        player2.currency += offer.bet;
        state = 'tied in';
    }

    // output result
    msg = `After 5 rounds ${player1.username} ${state} the ${type} against ${player2.username}! (${result.wins.p1}-${result.wins.tie}-${result.wins.p2})`;
    if (manager.responseType === 'broadcast') {
        manager.reply(msg);

    } else {
        manager.whisper(player1.username, msg);
        manager.whisper(player2.username, msg);
    }
}

async function process(manager, type, config, player, msgdata) {

    let tokens = parameters(msgdata.message.message);
    let command = manager.command;

    // Too many parameters
    if (tokens.length > 2) {
        manager.errorreply(`${command}: Too many parameters`);

    // player wants to engage in last offered duel/arena
    } else if (tokens.length === 1) {

        // retrieve last offered duel/arena
        let lastOffer = pull(game, `/${type}/lastOffer`, {default: null});

        // Last offered duel either completed or has expired
        if (lastOffer == null) {
            manager.errorreply(`${command}: The last offered ${type} has expired`);
            return;
        }

        // last offer was made by player
        if (lastOffer === player.id) {
            manager.whisper(`${command}: You can't ${type} yourself`);
            return;
        }

        // Player that offered the duel no longer exists
        let player2 = await players(lastOffer);
        if (!player2) {
            game.delete(`/${type}/lastOffer`);
            game.delete(`/${type}/pending/${lastOffer}`);
            manager.whisper(`${command}: The player offering the last ${type} no longer exists`);
            return;
        }

        // retrieve last offered duel/arena info
        let offer = pull(game, `/${type}/pending/${lastOffer}`, {default: null});

        // last offered duel info already deleted
        if (offer == null) {
            game.delete(`/${type}/lastOffer`);
            manager.whisper(`${command}: The last offered ${type} has expired`);
            return;
        }

        // last offered duel has timed out
        if (offer.expires <= Date.now()) {
            remove(type, offer.id);
            manager.whisper(`${command}: The last offered ${type} has expired`);
            return;
        }

        // player is poor
        if (player.currency < offer.bet) {
            manager.whisper(`${command}: You do not have the required ${offer.bet} ${manager.currencyName} to meet the bet`);
            return;
        }

        // player has no companion
        if (type === 'arena' && player.equiped.companion.name === 'none') {
            manager.whisper(`${command}: You don't have a companion to do battle!`);
            return;
        }

        // remove offer from the pending duels database
        remove(type, lastOffer);

        // deduct bet from player
        player.currency -= offer.bet;

        // fight me bro!
        fight(manager, type, offer, player, player2);

    // player is offering a duel/arena
    } else if (tokens[1].type === 'text' && /^\d+$/.test(tokens[1].text)) {

        // player has a stored duel
        let inDuel = pull(game, `/${type}/pending/${player.id}`, {default: null});
        if (inDuel != null) {

            // duel has not expired
            if (inDuel.expires > Date.now()) {
                manager.whisper(`${command}: You already have a pending ${type}`);
                return;
            }

            // return currency to player
            player.currency += inDuel.bet;

            // remove the duel entry
            remove(type, player.id);
        }

        let playerbet = Number(tokens[1].text);

        // player needs to bet more
        if (playerbet < config.minbet) {
            manager.whisper(`${command}: You must bet at least ${config.minbet} ${manager.currencyName}`);
            return;
        }

        // player is poor
        if (player.currency < playerbet) {
            manager.whisper(`${command}: You do not have enough ${manager.currencyName} to make that bet.`);
            return;
        }

        // Store pending duel
        let offer = {
            id: player.id,
            expires: Date.now() + (config.timeout * 1000),
            bet: playerbet
        };
        push(game, `/${type}/pending/${player.id}`, offer);
        push(game, `/${type}/lastOffer`, player.id);

        // deduct bet from player
        player.currency -= playerbet;

        // broadcast duel message
        manager.broadcast(`${player.username} has offered ${playerbet} ${manager.currencyName} to anyone that can beat them in a round of combat; to take them up on the offer: ${command} ${player.username}`);


    } else {

        // Attempt to retrieve user id of the supecified user
        getPlayerFromToken(manager.mixer, player, tokens[1])
            .then(player2 => {

                // player1 & player2 are same user
                if (player.id === player2.id) {
                    manager.whisper(`${manager.command}: You can not battle yourself`);
                    return;
                }

                // Retrieve duel info
                let offer = pull(game, `/${type}/pending/${player2.id}`, {default: null});

                // player2's duel offer has expired
                if (offer && offer.expires < Date.now()) {
                    remove(offer.id);
                    offer = null;
                }

                // player2 does not have a pending duel
                if (offer == null) {
                    manager.whisper(`${manager.command}: ${player2.username} does not have a ${type} pending`);
                    return;
                }

                // no companion for arena
                if (type === 'arena' && player.equiped.companion.name === 'none') {
                    manager.whisper(`${command}: You don't have a companion to do battle!`);
                    return;
                }

                // player1 can't meet player2's bet
                if (player.currency < offer.bet) {
                    manager.whisper(`${manager.command}: You do not have the required ${offer.bet} ${manager.currencyName} to meet the bet`);
                    return;
                }

                // remove pending duel
                remove(type, offer.id);

                // deduct bet from player
                player.currency -= offer.bet;

                // fight me bro!
                fight(manager, type, offer, player, player2);
            })
            .catch(err => {
                manager.whisper(`${manager.command}: ${err.message}`);
            });
    }
}


module.exports = function factoryBattles(register) {
    register({
        name: 'duel',
        help: 'Pro-offers a duel that any user can take you up on',
        format: '[bet]',
        config: {
            command: '-duel',
            minbet: 50,
            timeout: 300
        },
        handle: function (manager, config, player, msgdata) {
            process(manager, 'duel', config, player, msgdata);
        }
    });

    register({
        name: 'arena',
        help: 'Pro-offers a companion battle that any user can take you up on',
        format: '[bet]',
        config: {
            command: '-arena',
            minbet: 50,
            timeout: 300
        },
        handle: function (manager, config, player, msgdata) {
            process(manager, 'arena', config, player, msgdata);
        }
    });
};