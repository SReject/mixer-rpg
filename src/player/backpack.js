// native module imports
const {randomBytes} = require('crypto');

// custom module imports
const {players, push, pull} = require('../misc/db.js');
const {has} = require('../misc/util.js');

module.exports = function factoryBackpack(player) {
    let id = player.id;
    let backpackItems = pull(players, `/${id}/backpack`, {default: {}, write: true});

    const generateId = () => {
        let id;
        do {
            id = randomBytes(2).toString('hex');
        } while (has(backpackItems, id));
        return id;
    };

    // build backpack object
    let backpack = {};
    Object.defineProperties(backpack, {

        // adds an item to the backpack
        store: {
            enumerable: true,
            value: function (item, options = {}) {
                if (!item.type || !item.item) {
                    throw new TypeError('invalid item to store');
                }

                let packItem = {
                    type: item.type,
                    id: options.forceId ? options.forceId : generateId(),
                    item: item.item,
                    added: Date.now()
                };

                // store the item
                backpackItems[packItem.id] = packItem;

                if (!options.notLastAdded) {
                    backpackItems.__lastAdded = packItem.id;
                }

                // update database
                push(players, `/${player.id}/backpack`, backpackItems);

                // only one item was added so return its id
                return packItem;
            }
        },

        // Retrieves the item at the specified id
        get: {
            enumerable: true,
            value: function (id) {
                return backpackItems[id];
            }
        },

        getByType: {
            enumerable: true,
            value: function (type, idx) {

                let itemIds = Object.keys(backpackItems);

                // an index has been specified
                if (idx != null) {
                    let matched = 0;

                    // loop over item ids
                    let id = itemIds.find(id => {

                        // retrieve the backpack item info
                        let item = backpackItems[id];

                        // not specified type, so skip
                        if (item.type !== type) {
                            return false;
                        }

                        // idx matched, return true indicating this is the matched item
                        if (matched === idx) {
                            return true;
                        }

                        // not to the specified index so move on to the next item
                        matched += 1;
                        return false;
                    });

                    // id found, return the result
                    if (id) {
                        return backpackItems[id];
                    }

                    // return undefined for no matching item
                    return;
                }

                // no index specified, return all items of the specified type
                let items = [];
                itemIds.forEach(id => {
                    let item = backpackItems[id];
                    if (item.type === type) {
                        items.push(item);
                    }
                });
                return items.length ? items : undefined;
            }
        },

        lastAdded: {
            enumerable: true,
            get () {
                if (
                    has(backpackItems, '__lastAdded') &&
                    backpackItems.__lastAdded &&
                    has(backpackItems, backpackItems.__lastAdded)
                ) {
                    return backpackItems[backpackItems.__lastAdded];
                }
                return undefined;
            }
        },

        // removes the item via specified id
        remove: {
            enumerable: true,
            value: function (id) {

                if (has(backpackItems, id)) {

                    // retrieve item data from backpack
                    let item = backpackItems[id];

                    // remove item
                    delete backpackItems[id];

                    // Item was the last one added; remove the id reference
                    if (item.id === backpackItems.__lastAdded) {
                        delete backpackItems.__lastAdded;
                    }

                    // update database
                    push(players, `/${player.id}/backpack`, backpackItems);

                    // return the item removed
                    return item;
                }
            }
        },

        // empties the backpack
        empty: {
            enumerable: true,
            value: function () {
                push(players, `/${player.id}/backpack`, backpackItems = {});
            }
        }
    });

    Object.defineProperty(player, 'backpack', {
        enumerable: true,
        value: backpack
    });
};