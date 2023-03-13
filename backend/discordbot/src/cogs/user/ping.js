const {SlashCommandBuilder} = require('discord.js');
const {InteractionResponseType} = require('discord-api-types/v10');

let { pLog, pLogErr, cfgData} = require('../../index.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Pong!"),

    async execute(interaction) {
        await interaction.reply({content: ". . . Pong :ping_pong:!"});
        var bot_ping = Math.round(interaction.client.ws.ping);
        var user_ping = new Date().getTime() - interaction.createdTimestamp;
        await interaction.editReply(". . . Pong :ping_pong:! . . You requested in `" + user_ping + "` ms and <@!" + interaction.client.application.id + "> replied in `" + bot_ping + "`!");
    }
}
