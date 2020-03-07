
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
let mobFunctions = require("./server/mob.js");

let gridSizeX =64;
let gridSizeY =64;
//get collisions
let rawdata = fs.readFileSync("server/collisions.json");
let rectangles = JSON.parse(rawdata);

//generate Map
let mapSizeX = 3000;
let mapSizeY = 3000;
let pathFindingGridSize = 16;
let maps = mapFunctions.generateMap(0,0,mapSizeX,mapSizeY,"Forest",gridSizeX,gridSizeY,rectangles)
let map = maps.map
let collisionMap = maps.collisionMap
let treeMap = maps.treeMap
let quadtree = maps.quadtree
let projectiles = []
//game time
let gameTime = 0;
var players = {};
var inventories = {};
let images = {};
images = getImages(images)
quadtree = collisionFunctions.initializeQuadTree(quadtree,collisionMap);
let matrix = mapFunctions.createGridForPathFinder(quadtree,mapSizeX,mapSizeY,pathFindingGridSize);
let mobs = [];
let gridPathFinder = mobFunctions.initializePathFinder(matrix);
mobs.push(mobFunctions.createMob(0,0,1,1,null,matrix));

mobs.push(mobFunctions.createMob(32,0,1,1,null,matrix));
mobs.push(mobFunctions.createMob(64,0,1,1,null,matrix));
mobs.push(mobFunctions.createMob(96,0,1,1,null,matrix));
mobs.push(mobFunctions.createMob(128,0,1,1,null,matrix));
mobs.push(mobFunctions.createMob(144,0,1,1,null,matrix));
mobs.push(mobFunctions.createMob(160,0,1,1,null,matrix));


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
            histX: 320,
            y: 100,
            histY: 100,
            delay: 0,
            histgametime: 0,
            lastgametime: 0,
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
        inventories[socket.id] = {};
        inventories[socket.id]["sword"] = 1;
        let player = players[socket.id];
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
            collisionMap:collisionMap,
            matrix:matrix,
            mobs: mobs,
    };
        socket.emit('data', gameData);
    });
    socket.on('movement', function (data) {
        let player = players[socket.id] || {};
        player.data = data;
        if (player.isDead === false) {
            if (data.a || data.w || data.d || data.s || data[' ']) {
                player.histX = player.x
                player.histY = player.y
                player.histgametime = player.lastgametime
                player.lastgametime = data.gametime
                player.delay = gameTime - data.gametime
                player.x = data.x
                player.y = data.y

            } else {
                player.status = 0;
            }
        }
        let obj = {
            gameTime: gameTime,
            players: players,
            mobs: mobs,
        };
        io.emit("players",obj);

    });
    socket.on('players', function (data){
        let obj = {
            gameTime: gameTime,
            players: players,
        };
        socket.emit("players",obj);
    });
    socket.on('inventory', function(){
      socket.emit("inventory", inventories[socket.id]);
    });
    socket.on('projectile', function (projectile){

        projectile.origin = socket.id;
        projectile.gameTimeFire = gameTime;
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
    //movePlayers(players)
    gameTime = timeFunctions.updateGameTime(gameTime, 1)
    hitCheckFunctions.calculateAllProjectiles(io,projectiles,gameTime,players,quadtree);
    //mobFunctions.calculateAllMobs(mobs,players,matrix,pathFindingGridSize,gridPathFinder)
    //mobFunctions.moveMobs(mobs,gridPathFinder)
}, 1000/60);
setInterval(function () {
    mobFunctions.calculateAllMobs(io,mobs,players,matrix,pathFindingGridSize,gridPathFinder)
    //mobFunctions.moveMobs(mobs,gridPathFinder)
}, 1000);
setInterval(function () {
    mobFunctions.moveMobs(io,mobs,pathFindingGridSize);
    //mobFunctions.moveMobs(mobs,gridPathFinder)
}, 150);
