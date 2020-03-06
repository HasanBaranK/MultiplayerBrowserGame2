
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

const imageFolder = './static/images';

let mapFunctions = require("./server/map.js");
let timeFunctions = require("./server/time.js");
let hitCheckFunctions = require("./server/hitCheck.js");
let collisionFunctions = require("./server/collision.js");

let gridSizeX =64;
let gridSizeY =64;
//get collisions
let rawdata = fs.readFileSync("server/collisions.json");
let rectangles = JSON.parse(rawdata);

//generate Map
let maps = mapFunctions.generateMap(0,0,1000,1000,"Forest",gridSizeX,gridSizeY,rectangles)
let map = maps.map
let collisionMap = maps.collisionMap
let treeMap = maps.treeMap
let quadtree = maps.quadtree
let projectiles = []
//game time
let gameTime = 0;
var players = {};

let images = {};
images = getImages(images)
quadtree = collisionFunctions.initializeQuadTree(quadtree,collisionMap);

function getImages(images) {
    fs.readdir(imageFolder, (err, files) => {
        files.forEach(folder => {
            console.log(folder);
            fs.readdir(imageFolder + "/" + folder, (err, files) => {
                images[folder] = files
            });
        });
    });
    return images
}

// Starts the server.
server.listen(5000, function () {
    console.log('Starting server on port 5000');
});
let socket2;
io.on('connection', function (socket) {
    socket2 = socket;
    console.log('Player ' + socket.id + ' has joined the game');
    socket.on('newplayer', function () {
        players[socket.id] = {
            x: 320,
            y: 100,
            status: 0,
            maximumHealth: 150,
            health: 100,
            maximumEnergy: 100,
            energy: 100,
            width: 14,
            height: 14,
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
            healingDelay: 0,
            lastPressTime: 0,
            lastJumpTime: 0,
            lastMoveTime: 0,
            followLight: null,
            data: null,
        };
        let player = players[socket.id]
        socket.join('players');
        console.log("Player joined");
        socket.emit("joined","success");
        let obj = {
            gameTime: gameTime,
            players: players,
        };
        socket.emit("players",obj);
    });
    socket.on('getimages', function (click) {
        socket.emit('images', images);
    });
    socket.on('updatecollision', function (data) {
        let rawdata = fs.readFileSync("server/collisions.json");
        let rectangles = JSON.parse(rawdata);
        rectangles[data.name] = data.rectangles;
        let  result= JSON.stringify(rectangles);
        fs.writeFileSync('server/collisions.json', result);
    });
    socket.on('getdata', function (click) {
        let gameData = {
            map: map,
            treeMap: treeMap,
            gameTime: gameTime,
            collisionMap:collisionMap
        };
        socket.emit('data', gameData);
    });
    socket.on('movement', function (data) {

        let player = players[socket.id] || {};
        player.data = data;
        if (player.isDead === false) {
            if (data.a || data.w || data.d || data.s || data[' ']) {

            } else {
                player.status = 0;
            }
        }

    });
    socket.on('players', function (data){
        let obj = {
            gameTime: gameTime,
            players: players,
        };
        socket.emit("players",obj);
    });
    socket.on('projectile', function (projectile){

        projectile.origin = socket.id;

        let obj = {
            projectile: projectile,
            gameTime: gameTime,
        }
        projectiles.push(projectile);
        io.emit("projectile",obj);
    });
    socket.on('disconnect', function(evt){
       delete players[socket.id];
    });
})
;

function movePlayer(player, data, speed) {
    if (data == null) {
        //console.log("data null")
        return
    }
    let d = new Date();
    let currentTime = Math.round(d.getTime());
    if (player.lastMoveTime + 5 < currentTime) {
        player.lastMoveTime = currentTime;
        if(data.x){
            player.x = data.x;
        }
        if(data.y){
            player.y = data.y;
        }
    }
}
function movePlayers(players) {

    let speed = 0.45//5
    for (let player in players) {
        player = players[player];
        if (player.isDead == false) {
            movePlayer(player, player.data, speed);
        }
    }
}
setInterval(function () {
    movePlayers(players);
    gameTime = timeFunctions.updateGameTime(gameTime, 1)
    hitCheckFunctions.calculateAllProjectiles(projectiles,gameTime,players,quadtree);
}, 1000/60);
