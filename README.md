# Mixer RPG  
A chat-based RPG game bot for [mixer](https://mixer.com) based on Firebottle's [original work](https://github.com/firebottle/mixer-rpg)

# Configure
Before you can use this bot you will need to edit `/db/settings.json`'s channelId entry to the channel you want to bot to join.

# Setup
0. install nodejs  
2. Open a command line
3. Within the command line, navigate to where you extract the source
4. Within the command line enter `npm install` and wait

After setup, to run the bot, from a command line use `node index.js`

# Help and support
Found a bug? Want a feature? Submit an issue or join me on [discord](https://discord.gg/sRTY4hE)

# Playing - (default settings)
| **Command**                             | **Usage**                                                                    |
|-----------------------------------------|------------------------------------------------------------------------------|
| !rpg                                    | List all commands                                                            |
| !rpg-help [command]                     | Returns information related to the specified command                         |
| !rpg-daily                              | Gives the player their daily reward                                          |
| !rpg-dailyreset                         | (Streamer Only) Resets the daily reward cooldown for players                 |
| !rpg-inventory [player]                 | Checks a players inventory                                                   |
| !rpg-stats [player]                     | Returns a player's stats and coins                                           |
| !rpg-coins [player]                     | Returns the amount of coins a player has                                     |
| !rpg-pay \<player\> \<amount\>          | Transfers coins from one player to another                                   |
| !rpg-givecoins \<player\> \<amount\>    | (Streamer|Mod only) Gives a player coins                                     |
| !rpg-adventure                          | The player goes on an adventure with a chance to find loot or face a monster |
| !rpg-train                              | The player trains with a chance to increase stats or earn coins              |
| !rpg-pack \<type\>                      | Allows the player to list items in their pack                                |
| !rpg-equip [id]                         | Equips the item                                                              |
| !rpg-sell [id]                          | Sells the item                                                               |
| !rpg-duel \<bet\>                       | Offers up a duel for coin                                                    |
| !rpg-duel [player]                      | Accepts an offered duel                                                      |
| !rpg-arena \<bet\>                      | Offers a companion battle for coin                                           |
| !rpg-arena [player]                     | Accepts an offered companion battle                                          |
| !rpg-shop                               | Lists items current in the shop                                              |
| !rpg-shop \<id\>                        | Buys the specified item                                                      |
| !rpg-shop refresh                       | Refreshes the shop                                                           |
| !rpg-groups add \<player\> \<group\>    | Adds a permissions group to a player                                         |
| !rpg-groups list \<player\>             | Lists all permissions groups the player belongs to                           |
| !rpg-groups remove \<player\> \<group\> | (Stream|Mod only) Removes a specified permission group from a player         |
| !rpg-boss \<duration\>                  | Starts a group battle                                                        |

Items in []'s are optional  
Items in \<\> are required