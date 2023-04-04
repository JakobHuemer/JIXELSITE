const { Server: server } = require('ws');
'use strict';
const EventEmitter = require('events');


function messageHandler(message, ws, manager) {
    switch (message.type.toLowerCase()) {
        case 'pong':
            console.log('Pong received');
            break;
    }
}

function eventHandler(message, ws, manager) {
    manager.emit(message.data.event, message.data);
}

export class discordManager extends EventEmitter {
    constructor() {
        super();
        this.websocketServer = new server({ port: 6810 });
    }

    async start() {
        this.websocketServer.on('connection', (ws) => {
            ws.on('message', (message) => {
                console.log(`Received message => ${ message }`);

                if (message.type === 'event') {
                    eventHandler(message, ws, this);
                } else {
                    messageHandler(message, ws, this);
                }
            });

            /*
            *
            * Example request:
            * data = {
            *   type: 'event',
            *   data: {
            *       event: 'stream.online',
            *       viewer: 100
            *   }
            * }
            *
            * */

            this.websocketServer.broadcast = (data) => {
                this.websocketServer.clients.forEach((client) => {
                    if (client.readyState === server.OPEN) {
                        client.send(data);
                    }
                });
            };

        });
    }

}