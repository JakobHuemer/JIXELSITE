module.exports = {
    name: 'ban',
    description: 'Ban a user',
    label: 'ban',
    valid_args: [1],

    execute(command, twitchBot1) {
        let channel = command.command.channel;
        let msgId = command.tags.id;
        twitchBot1.sendTwitchMessage(`Banning @${ command.command.botCommandParams }`, channel);
    },

    help(command, twitchBot1) {
        let channel = command.command.channel;
        let msgId = command.tags.id;
        twitchBot1.sendTwitchMessage(`Usage: !ban <user>`, channel);
    }
};