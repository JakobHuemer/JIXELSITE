const HtmlEscape = require('escape-html');
const crypto = require('crypto');
const fs = require('fs');

// const formatDate = (date) => `${ date.getFullYear() }-${ (date.getMonth() + 1).toString().padStart(2, '0') }-${ date.getDate().toString().padStart(2, '0') } ${ date.getHours().toString().padStart(2, '0') }:${ date.getMinutes().toString().padStart(2, '0') }:${ date.getSeconds().toString().padStart(2, '0') }:${ date.getMilliseconds().toString().padStart(3, '0') }`;
const { formatDate } = require("../../server")

const { Server: server } = require('ws');

const axios = require('axios');


const { parseMessage, parseTags, parseCommand, parseSource, parseParameters } = require('./ircParser');
let { channel, clientId, clientSecrete, username, password } = require('../data/userdata.json');

const { connection, twitchWebsocketClient } = require('websocket');
const webSocketClient = require('websocket').client;
const commands = new Map();

const scopesString = '?scope=analytics:read:extensions+user:edit+user:read:email+clips:edit+bits:read+analytics:read:games+user:edit:broadcast+user:read:broadcast+chat:read+chat:edit+channel:moderate+channel:read:subscriptions+whispers:read+whispers:edit+moderation:read+channel:read:redemptions+channel:edit:commercial+channel:read:hype_train+channel:read:stream_key+channel:manage:extensions+channel:manage:broadcast+user:edit:follows+channel:manage:redemptions+channel:read:editors+channel:manage:videos+user:read:blocked_users+user:manage:blocked_users+user:read:subscriptions+user:read:follows+channel:manage:polls+channel:manage:predictions+channel:read:polls+channel:read:predictions+moderator:manage:automod+channel:manage:schedule+channel:read:goals+moderator:read:automod_settings+moderator:manage:automod_settings+moderator:manage:banned_users+moderator:read:blocked_terms+moderator:manage:blocked_terms+moderator:read:chat_settings+moderator:manage:chat_settings+channel:manage:raids+moderator:manage:announcements+moderator:manage:chat_messages+user:manage:chat_color+channel:manage:moderators+channel:read:vips+channel:manage:vips+user:manage:whispers+channel:read:charity+moderator:read:chatters+moderator:read:shield_mode+moderator:manage:shield_mode+moderator:read:shoutouts+moderator:manage:shoutouts+moderator:read:followers';


function startWebSocketMessageServer(twitchBot1) {
    twitchBot1.webSocketMessageServer.on('connection', (ws) => {

        twitchBot1.webSocketMessageServerConnection = ws;

        twitchBot1.webSocketMessageServerConnection.on('message', (message) => {
            let parsedMessage = JSON.parse(message);
        });

        twitchBot1.webSocketMessageServerConnection.on('close', () => {
            console.log('Connection closed');
        });

        twitchBot1.webSocketMessageServerConnection.broadcast = function (data) {
            twitchBot1.webSocketMessageServer.clients.forEach(function each(client) {
                client.send(data);
            });
        };

        twitchBot1.sendTwitchMessageWSS = function (parsedMessage) {

            let tempTime = new Date().toUTCString();
            let isBot = parsedMessage.tags['display-name'] === twitchBot1.USERNAME;
            let isCommand = parsedMessage.parameters.startsWith('!');


            let comment = {
                message: parsedMessage.parameters,
                author: parsedMessage.tags['display-name'],
                timestamp: tempTime,
                color: parsedMessage.tags.color,
                bot: isBot,
                command: isCommand,
            };

            twitchBot1.webSocketMessageServerConnection.broadcast(JSON.stringify({
                'type': 'twitch', 'data': comment
            }));
        };

        twitchBot1.log('Connected to websocket', 'WSS');
    });

}

async function connectWebsocketTwitchClient(twitchBot1) {

    twitchBot1.log('Connecting to Twitch IRC', 'conn');

    twitchBot1.webSocketTwitchClient.on('connectFailed', function (error) {
        console.log('Connect Error: ' + error.toString());
    });

    twitchBot1.webSocketTwitchClient.on('connect', function (connection) {
        // console.log('WebSocket Client Connected');
        twitchBot1.webSocketTwitchClientConnection = connection;

        twitchBot1.log('Connected to Twitch IRC', 'conn');
        twitchBot1.log('Sending authentication data . . .', 'conn');
        // twitchBot1.log('Sending authentication data:\nPASS: ' + twitchBot1.CLIENT_OAUTH_TOKEN + '\nUSERNAME: ' + twitchBot1.USERNAME, 'conn');
        // Send CAP (optional), PASS, and NICK messages
        twitchBot1.webSocketTwitchClientConnection.sendUTF('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
        twitchBot1.webSocketTwitchClientConnection.sendUTF('PASS ' + twitchBot1.CLIENT_OAUTH_TOKEN);
        twitchBot1.webSocketTwitchClientConnection.sendUTF('NICK ' + twitchBot1.USERNAME);

        // sending ping message every minute
        setInterval(() => {
            twitchBot1.webSocketTwitchClientConnection.sendUTF('PONG :tmi.twitch.tv');
            twitchBot1.log('Sending PONG', 'conn');

        }, 60000);


        // Send JOIN messages for each channel
        twitchBot1.CHANNELS.forEach(channel => {
            twitchBot1.log(`Joining #${ channel }`, 'conn');
            twitchBot1.webSocketTwitchClientConnection.sendUTF('JOIN #' + channel);
            twitchBot1.webSocketTwitchClientConnection.sendUTF(`PRIVMSG #${ channel } :HalloHallo`);
        });


        messageHandler(twitchBot1);
    });

    await twitchBot1.webSocketTwitchClient.connect('ws://irc-ws.chat.twitch.tv:80');
}

class TwitchBot {
    constructor(channels, username, clientId, clientSecrete, client_oauth_token, port = 8412) {
        this.PORT = port;
        this.SESSION_DATE = new Date();


        // Websocket Server to send messages to frontend
        this.webSocketMessageServer = new server({ port: this.PORT });
        this.webSocketMessageServerConnection = null;

        this.webSocketTwitchClient = new webSocketClient();
        this.webSocketTwitchClientConnection = null;


        this.CHANNELS = channels;
        this.USERNAME = username;
        this.CLIENT_ID = clientId;
        this.CLIENT_SECRETE = clientSecrete;
        this.CLIENT_OAUTH_TOKEN = client_oauth_token;
    }

    log(msg, ttvProtocol) {
        // let date = new Date().toISOString();
        let date = new Date();
        console.log(`[${ formatDate(date) }] TTV ${ ttvProtocol }: ${ msg }`);
    }

    logErr(msg, ttvProtocol) {
        let date = new Date().toISOString();
        console.error(`[${ date }] TTV ${ ttvProtocol }: ${ msg }`);
    }


    async start() {
        this.log('Starting bot...', 'start');
        this.SESSION_DATE = new Date();
        await startWebSocketMessageServer(this);
        await connectWebsocketTwitchClient(this);
    }

    async stop() {
        this.log('Stopping bot...', 'stop');
        await this.webSocketMessageServerConnection.close();
    }

    sendTwitchMessageWSS(parsedMessage) {
        this.log('WebSocket not connected', 'WSS');
    }

    sendTwitchMessage(msg, channel) {
        this.webSocketTwitchClientConnection.sendUTF(`PRIVMSG #${ channel } :${ msg }`);

        let parsedMessage = {
            parameters: msg,
            tags: {
                color: '#FF0000',
                'display-name': this.USERNAME
            }
        };

        this.sendTwitchMessageWSS(parsedMessage);
    }

    replyTwitchMessage(msg, channel, msgId) {
        this.webSocketTwitchClientConnection.sendUTF(`@reply-parent-msg=${ msgId } PRIVMSG ${ channel } :${ msg }`);

        let parsedMessage = {
            parameters: msg,
            tags: {
                color: '#FF0000',
                'display-name': this.USERNAME
            }
        };

        this.sendTwitchMessageWSS(parsedMessage);
    }
}


// function pLog(msg, protocol) {
//     let date = new Date().toISOString();
//     console.log(`[${ date }] ${ protocol }: ${ msg }`);
// }


// let sendTwitchMessage = function (channel = 'jstjxel', msg) {
//     connection.sendUTF(`PRIVMSG #${ channel } :${ msg }`);
//
//     twitchbot.sendWS({
//         parameters: msg,
//         tags: {
//             color: '#FF0000',
//             'display-name': 'jakkibot'
//         }
//     });
// };

// let sendWS = function (parsedMessage) {
//     pLog('WebSocket not connected', 'WSS');
// };

// WEBSOCKET SERVER --------------------------------------------------------------------

// const websocketServer = new server({port: 8412})
//
// websocketServer.on("connection", (ws) => {
//
//     ws.on("message", (message) => {
//         let parsedMessage = JSON.parse(message)
//     })
//
//     ws.on("close", () => {
//         console.log("Connection closed")
//     });
//
//     ws.broadcast = function broadcast(data) {
//         websocketServer.clients.forEach(function each(client) {
//             client.send(data);
//         });
//     }
//     sendWS = function (parsedMessage) {
//
//         let tempTime = new Date().toUTCString()
//         let isBot = parsedMessage.tags["display-name"] === "jakkibot"
//         let isCommand = parsedMessage.parameters.startsWith("!")
//
//
//         let comment = {
//             message: parsedMessage.parameters,
//             author: parsedMessage.tags["display-name"],
//             timestamp: tempTime,
//             color: parsedMessage.tags.color,
//             bot: isBot,
//             command: isCommand,
//         }
//
//         ws.broadcast(JSON.stringify({
//             "type": "twitch", "data": comment
//         }))
//     }
//
//     pLog("Connected to websocket", "TWITCH WEBSOCKET")
//
// });


// map commands from subfolders from commands folder
// const {connection, twitchWebsocketClient} = require("websocket");
const { twitchbot } = require('./index');
const subFolders = fs.readdirSync('./backend/twitchbot/src/commands');
for (const subFolder of subFolders) {
    const commandFiles = fs.readdirSync(`./backend/twitchbot/src/commands/${ subFolder }`);
    for (const file of commandFiles) {
        const command = require(`./commands/${ subFolder }/${ file }`);
        commands.set(command.name, command);
    }
}

function getOAuthToken() {
    axios.post('https://id.twitch.tv/oauth2/token', `client_id=${ clientId }&client_secret=${ clientSecrete }&grant_type=client_credentials`, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then((res) => {
        console.log(res.data.access_token);
        return res.data.access_token;
    }).catch((err) => {
        console.log(err);
    });
    return null;
}


//
// oauthToken = getOAuthToken();
// console.log(getAuthToken())
oauthToken = 'fa2njf8qip2rl9ll0cuttcnrlx84ml';


function messageHandler(twitchBot1) {
    twitchBot1.webSocketTwitchClientConnection.on('message', (ircMessage) => {

        if (ircMessage.type === 'utf8') {
            let rawIrcMessage = ircMessage.utf8Data.trimEnd();
            // console.log(`Message received (${new Date().toISOString()}): '${rawIrcMessage}'\n`);

            let messages = rawIrcMessage.split('\r\n');  // The IRC message may contain one or more messages.
            messages.forEach(message => {

                let parsedMessage = parseMessage(message, twitchBot1.log);

                if (parsedMessage) {

                    // console.log(parsedMessage);

                    switch (parsedMessage.command.command) {
                        case 'PRIVMSG':
                            // Ignore all messages except the '!move' bot
                            // command. A user can post a !move command to change the
                            // interval for when the bot posts its move message.
                            let commandMessage = parsedMessage.parameters;
                            twitchBot1.sendTwitchMessageWSS(parsedMessage);

                            twitchBot1.log('MESSAGE: ' + parsedMessage.parameters, 'MESSAGE');

                            if (commandMessage.startsWith('!')) {
                                //     Command Handler

                                let commandName = parsedMessage.command.botCommand.toLocaleLowerCase();
                                let args = 0;
                                if (parsedMessage.command.botCommandParams) {
                                    args = parsedMessage.command.botCommandParams.split(' ').length;
                                }

                                if (commands.has(commandName)) {
                                    let commandObj = commands.get(commandName);
                                    if (!commandObj.valid_args.includes(args) && !commandObj.valid_args.includes(-1)) {
                                        commandObj.help(parsedMessage, twitchBot1);
                                    } else {
                                        try {
                                            // console.log(`COMMAND (${new Date().toISOString()}):`, commandObj.name.toUpperCase());
                                            twitchBot1.log(`COMMAND:`, commandObj.label.toUpperCase());
                                            commandObj.execute(parsedMessage, twitchBot1);
                                        } catch (err) {
                                            console.log('ERR:', err);
                                            // pLog("ERR: " + err, "ERR");
                                            twitchBot1.webSocketTwitchClientConnection.sendUTF(`@reply-parent-msg=${ parsedMessage.tags.id } PRIVMSG ${ channel } :Ups, something went wrong`);
                                        }

                                    }
                                }
                            }

                            break;
                        case
                        'PING'
                        :
                            twitchBot1.log('PING', 'PING');
                            twitchBot1.webSocketTwitchClientConnection.sendUTF('PONG ' + parsedMessage.parameters);
                            break;
                        case
                        '001'
                        :
                            // Successfully logged in, so join the channel.
                            // webSocketMessageServerConnection.sendUTF("JOIN #" + channel);
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
                            // pLog('The channel must have banned (/ban) the bot.', 'TWITCH');
                            twitchBot1.webSocketTwitchClientConnection.close();
                            break;
                        case
                        'NOTICE'
                        :
                            // If the authentication failed, leave the channel.
                            // The server will close the webSocketMessageServerConnection.
                            if ('Login authentication failed' === parsedMessage.parameters) {
                                // console.log(`Authentication failed; left ${channel}`);
                                twitchBot1.log(`Authentication failed; left ${ channel }`, 'TWITCH');
                                twitchBot1.webSocketTwitchClientConnection.sendUTF(`PART ${ channel }`);
                            } else if ('You don’t have permission to perform that action' === parsedMessage.parameters) {
                                // console.log(`No permission. Check if the access token is still valid. Left ${channel}`);
                                twitchBot1.log(`No permission. Check if the access token is still valid. Left ${ channel }`, 'TWITCH');
                                twitchBot1.webSocketTwitchClientConnection.sendUTF(`PART ${ channel }`);
                            }
                            break;
                        default:
                        // Ignore all other IRC messages.
                    }
                }
            });
        }
    });
}


// const twitchWebsocketClient = require('websocket').client;
// const twitchClient = new twitchWebsocketClient();
//
// twitchClient.on('connectFailed', function (error) {
//     console.log('Connect Error: ' + error.toString());
// });
//
// twitchClient.on('connect', function (webSocketMessageServerConnection) {
//     // console.log('WebSocket Client Connected');
//
//     pLog("Connected to Twitch IRC", "TWITCH")
//
//     // Send CAP (optional), PASS, and NICK messages
//     webSocketMessageServerConnection.sendUTF("CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership");
//     webSocketMessageServerConnection.sendUTF("PASS " + password);
//     webSocketMessageServerConnection.sendUTF("NICK " + username);
//     webSocketMessageServerConnection.sendUTF("JOIN #" + channel);
//
//     // Send JOIN message
//     webSocketMessageServerConnection.sendUTF("PRIVMSG #jakkibot :HalloHallo")
//
//
//     webSocketMessageServerConnection.on('error', function (error) {
//         console.log("Connection Error: " + error.toString());
//     });
//
//
//     webSocketMessageServerConnection.on("message", (ircMessage) => {
//
//         if (ircMessage.type === 'utf8') {
//             let rawIrcMessage = ircMessage.utf8Data.trimEnd();
//             // console.log(`Message received (${new Date().toISOString()}): '${rawIrcMessage}'\n`);
//
//             let messages = rawIrcMessage.split('\r\n');  // The IRC message may contain one or more messages.
//             messages.forEach(message => {
//                 let parsedMessage = parseMessage(message);
//
//                 if (parsedMessage) {
//
//                    sendWS(parsedMessage)
//
//                     switch (parsedMessage.command.command) {
//                         case 'PRIVMSG':
//                             // Ignore all messages except the '!move' bot
//                             // command. A user can post a !move command to change the
//                             // interval for when the bot posts its move message.
//                             let commandMessage = parsedMessage.parameters;
//
//
//                             if (commandMessage.startsWith("!")) {
//                                 //     Command Handler
//
//                                 let commandName = parsedMessage.command.botCommand.toLocaleLowerCase()
//                                 let args = 0
//                                 if (parsedMessage.command.botCommandParams) {
//                                     args = parsedMessage.command.botCommandParams.split(" ").length;
//                                 }
//
//                                 if (commands.has(commandName)) {
//                                     let commandObj = commands.get(commandName);
//                                     if (!commandObj.valid_args.includes(args) && !commandObj.valid_args.includes(-1)) {
//                                         commandObj.help(parsedMessage, webSocketMessageServerConnection);
//                                     } else {
//                                         try {
//                                             // console.log(`COMMAND (${new Date().toISOString()}):`, commandObj.name.toUpperCase());
//                                             pLog(`COMMAND (${new Date().toISOString()}):`, commandObj.name.toUpperCase());
//                                             commandObj.execute(parsedMessage, webSocketMessageServerConnection);
//                                         } catch (err) {
//                                             console.log("ERR:", err);
//                                             // pLog("ERR: " + err, "ERR");
//                                             webSocketMessageServerConnection.sendUTF(`@reply-parent-msg=${parsedMessage.tags.id} PRIVMSG ${channel} :Ups, something went wrong`);
//                                         }
//
//                                     }
//                                 }
//                             }
//
//                             break;
//                         case
//                         'PING'
//                         :
//                             webSocketMessageServerConnection.sendUTF('PONG ' + parsedMessage.parameters);
//                             break;
//                         case
//                         '001'
//                         :
//                             // Successfully logged in, so join the channel.
//                             // webSocketMessageServerConnection.sendUTF("JOIN #" + channel);
//                             break;
//                         case
//                         'JOIN'
//                         :
//                             // Send the initial move message. All other move messages are
//                             // sent by the timer.
//                             break;
//                         case
//                         'PART'
//                         :
//                             // console.log('The channel must have banned (/ban) the bot.');
//                             pLog('The channel must have banned (/ban) the bot.', "TWITCH");
//                             webSocketMessageServerConnection.close();
//                             break;
//                         case
//                         'NOTICE'
//                         :
//                             // If the authentication failed, leave the channel.
//                             // The server will close the webSocketMessageServerConnection.
//                             if ('Login authentication failed' === parsedMessage.parameters) {
//                                 // console.log(`Authentication failed; left ${channel}`);
//                                 pLog(`Authentication failed; left ${channel}`, "TWITCH")
//                                 webSocketMessageServerConnection.sendUTF(`PART ${channel}`);
//                             } else if ('You don’t have permission to perform that action' === parsedMessage.parameters) {
//                                 // console.log(`No permission. Check if the access token is still valid. Left ${channel}`);
//                                 pLog(`No permission. Check if the access token is still valid. Left ${channel}`, "TWITCH")
//                                 webSocketMessageServerConnection.sendUTF(`PART ${channel}`);
//                             }
//                             break;
//                         default:
//                         // Ignore all other IRC messages.
//                     }
//                 }
//             });
//         }
//     })
// });


module.exports = { TwitchBot };






