// custom module imports
const {has} = require('../misc/util.js');
const {settings, pull} = require('../misc/db.js');
const buildConfig = require('./_config.js');

// Import commands to register
const commandList = [
    require('./groups.js'),
    require('./commandlist.js'),
    require('./dailyreward.js'),
    require('./inventory.js'),
    require('./training.js'),
    require('./adventure.js'),
    require('./battles.js'),
    require('./backpack.js'),
    require('./shop.js')
];

// Pull data from db
let cmdPrefix = pull(settings, '/commandPrefix', {default: '!rpg', write: true});
let currencyName = pull(settings, '/currencyName', {default: 'coins', write: true});


let sellCommand,
    equipCommand,
    joinBossCommand;

const plugins = {};

function register(plugin) {
    if (plugin == null) {
        return;
    }
    if (plugin.config == null) {
        throw new TypeError('plugin is missing config');
    }

    let command = (cmdPrefix + plugin.config.command).toLowerCase();
    if (has(plugins, command)) {
        throw new TypeError(`${command} already registered`);
    }

    if (plugin.isSellCommand) {
        if (sellCommand) {
            throw new Error('sell command already registered');
        }
        register.sellCommand = sellCommand = command;
    }
    if (plugin.isEquipCommand) {
        if (equipCommand) {
            throw new Error('equip command already registered');
        }
        register.equipCommand = equipCommand = command;
    }
    if (plugin.isJoinBossCommand) {
        if (equipCommand) {
            throw new Error('equip command already registered');
        }
        register.joinBossCommand = joinBossCommand = command;
    }
    plugins[command] = plugin;

    // plugin has init function
    if (typeof plugin.init === 'function') {
        plugin.init(buildConfig(plugin));
    }
}
register.currencyName = currencyName;

// Register plugins
commandList.forEach(plugin => plugin(register));

if (sellCommand == null) {
    throw new Error('No sell command registered');
}
if (equipCommand === null) {
    throw new Error('No equip command registered');
}
if (joinBossCommand === null) {
    throw new Error('No join boss command registered');
}

// Export list of registered plugins
module.exports = {
    cmdPrefix: cmdPrefix,

    sellCommand: sellCommand,
    equipCommand: equipCommand,
    joinBossCommand: joinBossCommand,

    plugins: plugins
};