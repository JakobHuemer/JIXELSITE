const { sendMsg } = require("../../twitchbot")

module.exports = {
    name: 'ban',
    description: 'Ban a user',
    label: "ban",
    valid_args: [1],

    execute(command, conn) {
        let channel = command.command.channel
        sendMsg(`Banning @${command.command.botCommandParams}`, conn)
    },

    help(command, conn) {
        let channel = command.command.channel
        sendMsg(`Usage: !ban <user>`, conn)
    }
}