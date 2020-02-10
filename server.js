let path = require('path');
let socketIO = require('socket.io');
let express = require('express');
const fs = require('fs');

const app = express();
let server = require('http').createServer(app);
let io = socketIO(server);
app.set('port', 5000);

//Directory of static files
const static_dir = 'static';
app.use(express.static(static_dir));


let mapFunctions = require("./server/map.js");
let timeFunctions = require("./server/time.js");

//generate Map
let maps = mapFunctions.generateMap(0,0,1000,1000,"Forest",10,10)
let map = maps.map
let collisionMap = maps.map

//game time
let gameTime = 0;

// Starts the server.
server.listen(5000, function () {
    console.log('Starting server on port 5000');
});



io.on('connection', function (socket) {
    console.log('Player ' + socket.id + ' has joined the game');
    socket.on('new player', function () {
        players[socket.id] = {
            x: 320,
            y: 100,
            status: 0,
            maximumHealth: 150,
            health: 100,
            maximumEnergy: 100,
            energy: 100,
            sizex: 32,
            sizey: 32,
            isDead: false,
            isMob: false,
            inventory: [],
            attacking: false,
            jumping: false,
            facing: "right",
            equipped: [],
            holding: [],
            xp: 0,
            xpToLevel: 1000,
            level: 1,
            followLight: null,
            data: null,
        };
        let player = players[socket.id]
        let gameData = {
            map: map,
            gameTime: gameTime,
        }

            io.sockets.emit('startData', gameData);
        socket.join('players');
    });
})
;

setInterval(function () {

    gameTime = timeFunctions.updateGameTime(gameTime, 600)
}, 1000/60);
