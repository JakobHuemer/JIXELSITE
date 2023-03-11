const { sendMsg } = require("../../twitchbot")

module.exports = {
    name: 'ping',
    description: 'Ping!',
    label: "ping",
    valid_args: [-1],

    execute( command, conn) {
        let channel = command.command.channel
        sendMsg(`Pong @${command.source.nick}!`, conn)
    },

    help(command, conn) {
        let channel = command.command.channel
        sendMsg(`Usage: !ping`, conn)
    }
}