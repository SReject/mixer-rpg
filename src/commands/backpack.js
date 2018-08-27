module.exports = function factorySellItem(register) {

    // !rpg-sell
    register({
        name: 'sellitem',
        help: 'Sells an item; if [id] is not specified, the last item found is sold',
        format: '[id]',
        isSellCommand: true,
        config: {
            command: '-sell',
            response: 'whisper',
            sellValue: 200
        },
        handle: function (manager, config, player, msgdata) {

            // deduce parameters
            let params = msgdata.message.tokens;
            let command = params[0].text.toLowerCase();

            let item;

            // too many parameters
            if (params.length > 2) {
                manager.whisper(`${command}: too many parameters`);
                return;

            // no id specified; assume the user wants to equip last item recieved
            } else if (params.length === 1) {
                item = player.backpack.lastAdded;

                if (!item) {
                    manager.whisper(`${command}: You do not have an item in holding`);
                    return;
                }

            // specified id is invalid
            } else if (params[1].type !== 'text' || !/^[a-z\d]+$/.test(params[1].text)) {
                manager.whisper(`${command}: Invalid item id`);
                return;

            // seemingly valid item id
            } else {
                let id = params[1].text.toLowerCase();
                item = player.backpack.get(id);

                if (!item) {
                    manager.whisper(`${command}: You do not have an item in your backpack with an id of ${id}`);
                    return;
                }
            }

            // delete item from backpack
            player.backpack.remove(item.id);
            item = item.item;

            // give player currency for the items
            player.currency += config.sellValue;

            // output message
            manager.reply(`${player.username} sold their ${item.name} (${item.strength}/${item.accuracy}/${item.wisdom}) for ${config.sellValue} ${manager.currencyName}`);
        }
    });

    // !rpg-equip
    register({
        name: 'equipitem',
        help: 'Equips an item; if [id] is not specified, the last item found is equiped',
        format: '[id]',
        isEquipCommand: true,
        config: {
            command: '-equip',
            response: 'whisper'
        },
        handle: function (manager, config, player, msgdata) {

            // deduce parameters
            let params = msgdata.message.tokens;
            let command = params[0].text.toLowerCase();

            let item;

            // too many parameters
            if (params.length > 2) {
                manager.whisper(`${command}: too many parameters`);
                return;

            // no id specified; assume the user wants to equip last item recieved
            } else if (params.length === 1) {
                item = player.backpack.lastAdded;

                if (!item) {
                    manager.whisper(`${command}: You do not have an item in holding`);
                    return;
                }

            // invalid id
            } else if (params[1].type !== 'text' || !/^[a-z\d]+$/.test(params[1].text)) {
                manager.whisper(`${command}: Invalid item id`);
                return;

            // seemingly valid item id
            } else {
                let id = params[1].text.toLowerCase();
                item = player.backpack.get(id);

                if (!item) {
                    manager.whisper(`${command}: You do not have an item in your backpack with an id of ${id}`);
                    return;
                }
            }


            // equip the item
            player.backpack.remove(item.id);
            player.equiped[item.type].equip(item.item);

            // grab item info and output message
            item = item.item;
            manager.reply(`${player.username} has equipped ${item.name} (${item.strength}/${item.accuracy}/${item.wisdom})`);
        }
    });

    // !rpg-pack
    register({
        name: 'backpack',
        help: 'Returns item information stored in your pack',
        format: '[type|id]',
        config: {
            command: '-pack',
            response: 'whisper'
        },
        handle: function (manager, config, player, msgdata) {

            let tokens = msgdata.message.tokens;

            // validate parameters
            if (tokens.length < 2) {
                manager.whisper(`${manager.command}: Missing parameters`);
            } else if (tokens.length > 2) {
                manager.whisper(`${manager.command}: Too many parameters`);
            } else if (tokens[1].type !== 'text') {
                manager.whisper(`${manager.command}: Invalid parameter`);
            } else {
                let param = tokens[1]
                    .text
                    .trim()
                    .toLowerCase();

                // id specified
                if (/^[a-z\d]{4}$/.test(param)) {
                    let item = player.backpack.get(param);

                    if (!item) {
                        manager.whisper(`${manager.command}: No item found in your backpack with an id of ${param}`);
                    } else {
                        let type = item.type;
                        item = item.item;
                        manager.reply(`[${param}] ${item.name} (${type}: ${item.strength}/${item.accuracy}/${item.wisdom})`);
                    }

                } else if (/^(?:title|melee|ranged|magic|armor|mount|companion|potion|trophy)$/.test(param)) {

                    let items = player.backpack.getByType(param);

                    // no items of specified type
                    if (!items.length) {
                        manager.whisper(`${manager.command}: You do not have any ${param} items stored in your backpack`);

                    // list items of specified type
                    } else {
                        manager.whisper(`${manager.command}: not implemented yet`);

                        let list = [];
                        items.forEach(item => {
                            let info = item.item;
                            list.push(`[${item.id}] ${info.name} (${item.strength}/${item.accuracy}/${item.wisdom})`);
                        });

                        let msg = `Current ${param} items in your pack`,
                            idx = 0;

                        do {

                            msg += list.slice(idx, idx === 0 ? 3 : 4).join(' || ');
                            manager.reply(msg);

                            msg = '';
                            idx += (idx === 0 ? 3 : 4);
                        } while (idx < list.length);
                    }
                }
            }
        }
    });
};