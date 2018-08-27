// native module imports
const {randomBytes} = require('crypto');

// custom module imports
const {has} = require('../misc/util.js');
const {game, push, pull} = require('../misc/db.js');
const generate = require('./_generate.js');

// variables to be set at initialization
let shopRefreshRate,
    shopRefreshTimeout,
    command,
    mixer;

// refreshes items in the shop
function refreshShop(amount, manager = {}) {

    // reset timeout in cases where the shop was force-refreshed
    if (shopRefreshTimeout) {
        clearTimeout(shopRefreshTimeout);
        if (shopRefreshRate) {
            shopRefreshTimeout = setTimeout(refreshShop, shopRefreshRate * 1000);
        }
    }

    // store for later use
    if (manager.mixer) {
        mixer = manager.mixer;
        command = manager.command;
    }

    // state variables
    let shopItems = {},
        itemId;

    // easy wraper
    const gen = type => Object.assign({type: type, itemId: itemId}, generate[type]());

    // loop until we've generated enough items
    while (amount > 0) {

        // generate a unique id for the item
        do {
            itemId = randomBytes(2).toString('hex');
        } while (has(shopItems, itemId));

        // generate an item and add it to the shop's item list
        switch (Math.floor(Math.random() * 20)) {
        case 0:
        case 1:
            shopItems[itemId] = gen('title');
            break;

        case 2:
        case 3:
        case 4:
            shopItems[itemId] = gen('melee');
            break;

        case 5:
        case 6:
        case 7:
            shopItems[itemId] = gen('ranged');
            break;

        case 8:
        case 9:
        case 10:
            shopItems[itemId] = gen('magic');
            break;

        case 11:
        case 12:
        case 13:
            shopItems[itemId] = gen('armor');
            break;

        case 14:
        case 15:
            shopItems[itemId] = gen('mount');
            break;

        case 16:
        case 17:
            shopItems[itemId] = gen('companion');
            break;

        default:
            shopItems[itemId] = gen('potion');
        }
        amount -= 1;
    }

    // store the shop's items list
    push(game, '/shop', shopItems);

    // output the list of items
    if (mixer) {
        mixer.broadcast(`A travelling merchant has appeared; use ${command} to access their inventory!`);
    }
}

module.exports = function factoryShop(register) {
    register({
        name: 'shop',
        help: 'Allows a user to buy items from the shop',
        format: 'refresh|[id]',
        config: {
            command: '-shop',
            response: 'whisper',

            // cost to purchase an item
            cost: 300,

            // Number of items in the shop
            itemcount: 3,

            // True: Items won't be removed from the shop after purchase allowing multiple users to purchase the same item
            // false: After an item is purchased, it is removed from the shop
            multibuys: true,

            // seconds between auto refreshes; to disable set to 0 or false*
            refreshRate: 1800,

            // Cost to force the shop to refresh
            // set to false to disable forced shop refresh*
            refreshCost: 1000,

            // Make shop refresh free for streamer
            overrides: [
                {
                    name: 'role:owner',
                    refreshCost: 0
                }
            ]
        },

        init: (config = {}) => {

            // if a refresh rate has been specified
            let refreshRate = Number(config.refreshRate);
            if (
                !isNaN(refreshRate) &&
                isFinite(refreshRate) &&
                parseInt(refreshRate) === refreshRate &&
                refreshRate > 0
            ) {

                // start a timer to refresh the shop
                shopRefreshRate = refreshRate;
                shopRefreshTimeout = setTimeout(refreshShop, shopRefreshRate * 1000);
            }
        },

        handle: async function (manager, config, player, msgdata) {

            // grab tokens list
            let tokens = msgdata.message.tokens,
                refreshed = false;

            // basic parameter validation
            if (tokens.length > 2) {
                mixer.whisper(`${manager.command}: Too many parameters`);
            } else if (tokens.length === 2 && tokens[1].type !== 'text') {
                mixer.whisper(`${manager.command}: Parameter must be an item id or the text "refresh"`);

            // basic parameter validation passed
            } else {

                // Attempt to retrieve items in shop
                let shop = pull(game, '/shop', {default: null});

                // Shop not generated; attempt to refresh
                if (shop == null) {
                    refreshShop(config.itemcount, manager);
                    refreshed = true;

                    shop = pull(game, '/shop', {default: null});
                    if (shop == null) {
                        manager.whisper(`${manager.command}: Failed to refresh shop`);
                        return;
                    }
                }

                // player is requesting a list of items in the shop
                if (tokens.length === 1) {

                    // get a list of ids of shop items
                    let itemIds = Object.keys(shop);

                    // no items left in shop
                    if (itemIds.length === 0) {
                        manager.whisper(`${manager.command}: The travelling merchant has already left`);

                    // List items in shop
                    } else {

                        // build message
                        let msg = [];
                        itemIds.forEach(id => {
                            let item = shop[id];
                            msg.push(`[${id}] ${item.name} (${item.type}: ${item.strength}/${item.accuracy}/${item.wisdom})`);
                        });

                        // output message
                        manager.reply(`The shop is currently selling: ${msg.join(' || ')}`);
                    }


                // player is attempting to refresh the shop
                } else if (tokens[1].text === 'refresh') {
                    let cost = config.refreshCost;

                    // shop not refreshed and refresh via currency is enabled
                    if (!refreshed && cost !== false) {

                        // player is poor
                        if (player.currency < cost) {
                            manager.whisper(`${manager.command}: You do not have enough ${manager.currencyName} to refresh the shop`);

                        // Player has the currency to refresh shop
                        } else {

                            // remove currency from player
                            player.currency -= cost;

                            // refresh shop
                            refreshShop(config.itemcount, manager);
                        }
                    }

                // player is attempting to purchase an item from the shop
                } else {

                    // Invalid id
                    if (!/^[a-z\d]+$/i.test(tokens[1].text) || !has(shop, tokens[1].text)) {
                        manager.whisper(`${manager.command}: Invalid item id`);

                    // player is poor
                    } else if (player.currency < config.cost) {
                        manager.whisper(`${manager.command}: You do not have enough ${manager.currencyName} to purchase that item`);

                    // player can purchase item
                    } else {

                        // duduct cost of item from player's currency
                        player.currency -= config.cost;

                        // retrieve the item from the shop
                        let item = shop[tokens[1].text];

                        // if multibuys is disabled, delete the bought item
                        if (config.multibuys === false) {
                            game.delete(`/shop/${item.id}`);
                        }

                        // bought a potion
                        //   Which requires a manual equip
                        if (item.type === 'potion') {
                            player.backpack.store(item);

                        // bought non-potion
                        } else {

                            // if the player already has an item equiped of the same type
                            // unequip that item and store it in the player's backpack
                            let equiped = player.equiped[item.type].unequip();
                            if (equiped.name !== 'none') {
                                player.backpack.store(equiped);
                            }

                            // equip the bought item
                            player.equiped[item.type].equip(item);
                        }

                        // output message
                        manager.reply(`${player.username} has purchased the ${item.name} (${item.type}: ${item.strength}/${item.accuracy}/${item.wisdom})`);
                    }
                }
            }
        }
    });
};