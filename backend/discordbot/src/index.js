require("dotenv").config();

const fs = require("fs");
const {REST} = require("@discordjs/rest");
const {Routes, InteractionType} = require("discord-api-types/v10");
// const strftime = require("strftime");
const {Client, Collection} = require("discord.js");
let cfgData = require("./config.json");

function discordBot(applicationId) {

    const stroke = "---------------------------------------------------------------------------";
    const strokeX = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    console.log("   ___  _              _  ______         _   \n" +
        "  |_  |(_)            | | | ___ \\       | |  \n" +
        "    | | _ __  __  ___ | | | |_/ /  ___  | |_ \n" +
        "    | || |\\ \\/ / / _ \\| | | ___ \\ / _ \\ | __|\n" +
        "/\\__/ /| | >  < |  __/| | | |_/ /| (_) || |_ \n" +
        "\\____/ |_|/_/\\_\\ \\___||_| \\____/  \\___/  \\__|\n" +
        "                                             \n" +
        "                                             ")

    console.log(stroke);

// Methods

    function getTimestamp() {
        let date = new Date().toISOString()
        return "[" + date + "]";
    }

    function pLog(toLog, protocol) {
        console.error(getTimestamp() + ' [' + protocol.toUpperCase() + ']: ' + toLog);
    }

    function pLogErr(toLog, protocol) {
        console.error(getTimestamp() + ' [' + protocol.toUpperCase() + ']: ' + toLog);
    }

    module.exports = {pLog, pLogErr, cfgData}


    const client = new Client({
        intents: 32767,
    })
    client.commands = new Collection();

    const commands = []


//loading events

    fs.readdirSync("./backend/discordbot/src/events/").forEach((subFolder) => {
        if (fs.readdirSync("./backend/discordbot/src/events/" + subFolder).length !== 0) {
            fs.readdirSync(`./backend/discordbot/src/events/${subFolder}`).forEach((eventFile) => {

                const event = require(`./events/${subFolder}/${eventFile}`);
                // const eventName = eventFile.split(".")[0];
                pLog(`Loading event ${eventFile}`, "SYSTEM E");
                client.on(event.name, (...args) => event.execute(...args));
            });
        }
    })

    console.log(stroke)

//loading commands
    try {

        fs.readdirSync("./backend/discordbot/src/cogs/").forEach((subFolder) => {
            if (fs.readdirSync("./backend/discordbot/src/cogs/" + subFolder).length !== 0) {
                fs.readdirSync(`./backend/discordbot/src/cogs/${subFolder}`).forEach((commandFile) => {
                    const command = require(`./cogs/${subFolder}/${commandFile}`);

                    pLog(`Loading command ${commandFile}`, "SYSTEM C");
                    client.commands.set(command.data.name, command);
                    commands.push(command.data.toJSON());
                })
            }
        })

        console.log(stroke)
        pLog("✅ Commands loaded!", "SYSTEM C")
        console.log(stroke)

    } catch (e) {
        console.log(strokeX)
        pLogErr("❌ Commands NOT loaded!", "SYSTEM C")
        console.log(strokeX)
    }

//registering commands
    const rest = new REST({version: "10"}).setToken(process.env.DISCORDJS_TOKEN);


    (async applicationId => {
        try {
            pLog("🟠 Started refreshing application (/) commands.", "SYSTEM C");

            await rest.put(Routes.applicationCommands(process.env.DISCORDJS_APPLICATION_ID, process.env.DISCORDJS_SERVER_ID), {
                body: commands,
            })

            pLog("🟢 Successfully reloaded application (/) commands.", "SYSTEM C");
        } catch (err) {
            console.error(err);
        }
    })()



//Online
    client.once("ready", () => {
        console.log(stroke)
        pLog(`🥾 [${client.user.tag}] successfully booted on {${client.guilds.cache.size}} server(s) and is ready for use!`, "SYSTEM");
        console.log(stroke)

        client.user.setActivity('v1.0.0	', {type: 3});
    })

    client.on("interactionCreate", async (interaction) => {
        // Autocomplete
        if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
            const {commands} = client;
            const {commandName} = interaction;
            const command = commands.get(commandName);
            if (!command) return;

            try {
                await command.autocomplete(interaction, client);
            } catch (err) {
                console.error(err);
            }
        }

        if (interaction.type !== InteractionType.ApplicationCommand) return;

        const command = client.commands.get(interaction.commandName);

        pLog(`🔎 [${interaction.user.tag}] used command [${interaction.commandName}]`, "SYSTEM C")

//     Execute command if it is
        if (command) {
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                // console.error("ERROR ---------------------------------------------------------");

                if (interaction.deferred || interaction.replied) {
                    pLogErr(`⚠️ [${interaction.user.tag}] failed command [${command.data.name}]`)

                    await interaction.editReply({
                        content: ':x: Ops, seems something went wrong!', ephemeral: true,
                    });
                } else {
                    pLogErr(`⚠️ [${interaction.user.tag}] failed command [${command.data.name}]`)
                    await interaction.reply({
                        content: ':x: Ops, seems something went wrong!', ephemeral: true,
                    });
                }
            }
        } else {
            await interaction.reply({
                content: ":x: Ops, seems this command doesn't exist!", ephemeral: true,
            });
        }
    })


    client.login(process.env.DISCORDJS_TOKEN)
}
discordBot()

module.exports = { discordBot }
