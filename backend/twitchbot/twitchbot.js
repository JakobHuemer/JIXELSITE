const HtmlEscape = require("escape-html");
const crypto = require("crypto");

const WebSocketClient = require('websocket').client;

const client = new WebSocketClient();
const eventSub = new WebSocketClient()
const axios = require('axios');
let {channel, clientId, clientSecrete, username, password} = require('./data/userdata.json');
module.exports = {twitchbot, sendMsg, pLog}
const {parseMessage, parseTags, parseCommand, parseSource, parseParameters} = require('./ircParser');
const fs = require("fs");
const {Server: server} = require("ws");


const scopesString = "?scope=analytics:read:extensions+user:edit+user:read:email+clips:edit+bits:read+analytics:read:games+user:edit:broadcast+user:read:broadcast+chat:read+chat:edit+channel:moderate+channel:read:subscriptions+whispers:read+whispers:edit+moderation:read+channel:read:redemptions+channel:edit:commercial+channel:read:hype_train+channel:read:stream_key+channel:manage:extensions+channel:manage:broadcast+user:edit:follows+channel:manage:redemptions+channel:read:editors+channel:manage:videos+user:read:blocked_users+user:manage:blocked_users+user:read:subscriptions+user:read:follows+channel:manage:polls+channel:manage:predictions+channel:read:polls+channel:read:predictions+moderator:manage:automod+channel:manage:schedule+channel:read:goals+moderator:read:automod_settings+moderator:manage:automod_settings+moderator:manage:banned_users+moderator:read:blocked_terms+moderator:manage:blocked_terms+moderator:read:chat_settings+moderator:manage:chat_settings+channel:manage:raids+moderator:manage:announcements+moderator:manage:chat_messages+user:manage:chat_color+channel:manage:moderators+channel:read:vips+channel:manage:vips+user:manage:whispers+channel:read:charity+moderator:read:chatters+moderator:read:shield_mode+moderator:manage:shield_mode+moderator:read:shoutouts+moderator:manage:shoutouts+moderator:read:followers"

function sendMsg(msg, connection) {
    connection.sendUTF(`PRIVMSG #${channel} :${msg}`)

    sendWS({
        parameters: msg, tags: {
            color: "#FF0000", "display-name": "jakkibot"
        }
    })
}


function pLog(msg, protocol) {
    let date = new Date().toISOString();
    console.log(`[${date}] ${protocol}: ${msg}`);
}

var sendWS = function (parsedMessage) {
    pLog("WebSocket not connected", "SSE")
}

let connections = {
    "uuid": {
        uuid: "uuid", subscription: "discord",
    }, "uuid2": {
        uuid: "uuid2", subscription: "twitch",
    }
}

function genUUID() {
    let uuid = crypto.randomUUID()
    while (connections[uuid]) {
        uuid = crypto.randomUUID()
    }
    return uuid
}

function twitchbot() {
    const server = require("ws").Server
    const websocketServer = new server({port: 8412})

    websocketServer.on("connection", (ws) => {

        ws.on("message", (message) => {
            let parsedMessage = JSON.parse(message)

        })

        ws.on("close", () => {
            console.log("Connection closed")
        });

        ws.broadcast = function broadcast(data) {
            websocketServer.clients.forEach(function each(client) {
                client.send(data);
            });
        }

        sendWS = function (parsedMessage) {

            let tempTime = new Date().toUTCString()
            let isBot = parsedMessage.tags["display-name"] === "jakkibot"
            let isCommand = parsedMessage.parameters.startsWith("!")


            let comment = {
                message: parsedMessage.parameters,
                author: parsedMessage.tags["display-name"],
                timestamp: tempTime,
                color: parsedMessage.tags.color,
                bot: isBot,
                command: isCommand,
            }

            ws.broadcast(JSON.stringify({
                "type": "twitch", "data": comment
            }))
        }

        pLog("Connected to websocket", "TWITCH WEBSOCKET")

    });


// map commands from subfolders from commands folder
    const fs = require('fs');
    const commands = new Map();
    const subFolders = fs.readdirSync('./backend/twitchbot/commands');
    for (const subFolder of subFolders) {
        const commandFiles = fs.readdirSync(`./backend/twitchbot/commands/${subFolder}`);
        for (const file of commandFiles) {
            const command = require(`./commands/${subFolder}/${file}`);
            commands.set(command.name, command);
        }
    }

    function getOAuthToken() {
        axios.post('https://id.twitch.tv/oauth2/token', `client_id=${clientId}&client_secret=${clientSecrete}&grant_type=client_credentials`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then((res) => {
            console.log(res.data.access_token)
            return res.data.access_token
        }).catch((err) => {
            console.log(err)
        })
        return null
    }

//
// oauthToken = getOAuthToken();
// console.log(getAuthToken())
    oauthToken = "fa2njf8qip2rl9ll0cuttcnrlx84ml"

    client.on('connectFailed', function (error) {
        console.log('Connect Error: ' + error.toString());
    });

    client.on('connect', function (connection) {
        // console.log('WebSocket Client Connected');
        pLog("Connected to Twitch IRC", "TWITCH")

        // Send CAP (optional), PASS, and NICK messages
        connection.sendUTF("CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership");
        connection.sendUTF("PASS " + password);
        connection.sendUTF("NICK " + username);
        connection.sendUTF("JOIN #" + channel);

        // Send JOIN message
        connection.sendUTF("PRIVMSG #jakkibot :HalloHallo")


        connection.on('error', function (error) {
            console.log("Connection Error: " + error.toString());
        });


        connection.on("message", (ircMessage) => {

            if (ircMessage.type === 'utf8') {
                let rawIrcMessage = ircMessage.utf8Data.trimEnd();
                // console.log(`Message received (${new Date().toISOString()}): '${rawIrcMessage}'\n`);

                let messages = rawIrcMessage.split('\r\n');  // The IRC message may contain one or more messages.
                messages.forEach(message => {
                    let parsedMessage = parseMessage(message);

                    if (parsedMessage) {


                        switch (parsedMessage.command.command) {
                            case 'PRIVMSG':
                                // Ignore all messages except the '!move' bot
                                // command. A user can post a !move command to change the
                                // interval for when the bot posts its move message.
                                let commandMessage = parsedMessage.parameters;

                                sendWS(parsedMessage)

                                if (commandMessage.startsWith("!")) {
                                    //     Command Handler

                                    let commandName = parsedMessage.command.botCommand.toLocaleLowerCase()
                                    let args = 0
                                    if (parsedMessage.command.botCommandParams) {
                                        args = parsedMessage.command.botCommandParams.split(" ").length;
                                    }

                                    if (commands.has(commandName)) {
                                        let commandObj = commands.get(commandName);
                                        if (!commandObj.valid_args.includes(args) && !commandObj.valid_args.includes(-1)) {
                                            commandObj.help(parsedMessage, connection);
                                        } else {
                                            try {
                                                // console.log(`COMMAND (${new Date().toISOString()}):`, commandObj.name.toUpperCase());
                                                pLog(`COMMAND (${new Date().toISOString()}):`, commandObj.name.toUpperCase());
                                                commandObj.execute(parsedMessage, connection);
                                            } catch (err) {
                                                console.log("ERR:", err);
                                                // pLog("ERR: " + err, "ERR");
                                                connection.sendUTF(`@reply-parent-msg=${parsedMessage.tags.id} PRIVMSG ${channel} :Ups, something went wrong`);
                                            }

                                        }
                                    }
                                }

                                break;
                            case
                            'PING'
                            :
                                connection.sendUTF('PONG ' + parsedMessage.parameters);
                                break;
                            case
                            '001'
                            :
                                // Successfully logged in, so join the channel.
                                // connection.sendUTF("JOIN #" + channel);
                                break;
                            case
                            'JOIN'
                            :
                                // Send the initial move message. All other move messages are
                                // sent by the timer.
                                break;
                            case
                            'PART'
                            :
                                // console.log('The channel must have banned (/ban) the bot.');
                                pLog('The channel must have banned (/ban) the bot.', "TWITCH");
                                connection.close();
                                break;
                            case
                            'NOTICE'
                            :
                                // If the authentication failed, leave the channel.
                                // The server will close the connection.
                                if ('Login authentication failed' === parsedMessage.parameters) {
                                    // console.log(`Authentication failed; left ${channel}`);
                                    pLog(`Authentication failed; left ${channel}`, "TWITCH")
                                    connection.sendUTF(`PART ${channel}`);
                                } else if ('You don’t have permission to perform that action' === parsedMessage.parameters) {
                                    // console.log(`No permission. Check if the access token is still valid. Left ${channel}`);
                                    pLog(`No permission. Check if the access token is still valid. Left ${channel}`, "TWITCH")
                                    connection.sendUTF(`PART ${channel}`);
                                }
                                break;
                            default:
                            // Ignore all other IRC messages.
                        }
                    }
                });
            }
        })
    });


// eventSub.on("connect", (connection) => {
//     connection.on("message", (message) => {
//         console.log("EVENTSUB MESSAGE:", JSON.parse(message.utf8Data, null, 2))
//     })
// });
//
// eventSub.connect("wss://eventsub-beta.wss.twitch.tv/ws")

    client.connect('ws://irc-ws.chat.twitch.tv:80');

}

