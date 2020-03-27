let path = require('path');
let socketIO = require('socket.io');
let express = require('express');
const fs = require('fs');

const app = express();
let server = require('http').createServer(app);
let io = socketIO(server);
const port = process.env.PORT || 5000;
app.set('port', port);

//Directory of static files
const static_dir = 'static';
app.use(express.static(static_dir));

const imageFolder = './static/images';

let mapFunctions = require("./server/map.js");
let timeFunctions = require("./server/time.js");
let hitCheckFunctions = require("./server/hitCheck.js");
let collisionFunctions = require("./server/collision.js");
let mobFunctions = require("./server/mob.js");

let gridSizeX = 64;
let gridSizeY = 64;
//get collisions
let rawdata = fs.readFileSync("server/collisions.json");
let rectangles = JSON.parse(rawdata);
let coinsForPlayers = [];

let mapSizeX = 3000;
let mapSizeY = 3000;
let pathFindingGridSize = 32;
//generate Map
//let maps = mapFunctions.generateMap(0,0,1000,1000,"Forest",gridSizeX,gridSizeY,rectangles)
//Promise pro = new Promise(mapFunctions.mapParser("./maps/1583654261340",rectangles));
//pro.then()
let maps = mapFunctions.mapParser("./maps/1584234167781", rectangles);
let map = maps.map;
let collisionMap = maps.collisionMap;
let treeMap = maps.treeMap;
let quadtree;//= maps.quadtree


let offsets = getOffsets();

let projectiles = [];
//game time
let gameTime = 0;
var players = {};
var inventories = {};
var vendors = {};
var items = [];
let playerChanged = false;
let images = {};
images = getImages(images);
quadtree = collisionFunctions.initializeQuadTree(quadtree, collisionMap);
//console.log(quadtree)
let matrix = mapFunctions.createGridForPathFinder(quadtree, mapSizeX, mapSizeY, pathFindingGridSize);
let mobs = [];
let gridPathFinder = mobFunctions.initializePathFinder(matrix);
for (let i = 0; i < 4; i++) {
    let rand = Math.floor(Math.random() * 70) + 1;
    //console.log(rand)
    let rand2 = Math.floor(Math.random() * 40) + 4;
    //console.log(rand2)
    mobs.push(mobFunctions.createMob(rand * pathFindingGridSize, rand2 * pathFindingGridSize, 1, 1, null, matrix));
}


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


function addVendors(name, x, y, items) {
    vendors[name] = {name: name, x: x, y: y, items: items};
}


addVendors("KFC", 150, 150, {chicken: 10});

// function addItems (numItems, itemName) {
//     for (let i = 0; i < numItems; i++) {
//         addItem(itemName, 0, 0, 300, 300);
//     }
// }

//numCoins = 20;
//addItems(numCoins, "coin");

// Starts the server.
server.listen(port, function () {
    console.log('Starting server on port 5000');
});
let socket2;
io.on('connection', function (socket) {
    socket2 = socket;
    console.log('Player ' + socket.id + ' has joined the game');
    socket.on('newplayer', function () {
        players[socket.id] = {
            x: 400,
            histX: 400,
            y: 400,
            histY: 400,
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
        coinsForPlayers[socket.id] = 0;
        let player = players[socket.id];
        socket.join('players');
        console.log("Player joined");
        socket.emit("joined", "success");
        let obj = {
            gameTime: gameTime,
            players: players,
        };
        socket.emit("players", obj);
    });
    socket.on('getimages', function (click) {
        socket.emit('images', images);
    });
    socket.on('updatecollision', function (data) {
        let rawdata = fs.readFileSync("server/collisions.json");
        let rectangles = JSON.parse(rawdata);
        rectangles[data.name] = data.rectangles;
        let result = JSON.stringify(rectangles);
        fs.writeFileSync('server/collisions.json', result);
    });
    socket.on('updateoffsets', function (data) {
        let rawdata = fs.readFileSync("server/offsets.json");
        let offsets = JSON.parse(rawdata);
        offsets[data.name] = data.offsets;
        let result = JSON.stringify(offsets);
        fs.writeFileSync('server/offsets.json', result);
    });
    socket.on('getdata', function (click) {
        let gameData = {
            map: map,
            treeMap: treeMap,
            gameTime: gameTime,
            collisionMap: collisionMap,
            vendors: vendors,
            items: items,
            matrix: matrix,
            mobs: mobs,
            offsets: offsets
        };
        socket.emit('data', gameData);
    });
    socket.on('offsets', function (data) {
        socket.emit('offsets', offsets);
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
                player.coins = data.coins
                player.lastMoveTime = data.LastMoveTime;
            } else {
                player.status = 0;
            }
        }
        let obj = {
            gameTime: gameTime,
            players: players,
            mobs: mobs,
        };
        playerChanged = true;
        //console.log(mobs.length);
        //io.emit("players",obj);

    });
    socket.on('updatePlayer', function (data) {
        let player = players[socket.id] || {};
        player = data;

        let obj = {
            gameTime: gameTime,
            players: players,
        };
        io.emit("players", obj);

    });
    socket.on('players', function (data) {
        let obj = {
            gameTime: gameTime,
            players: players,
        };
        socket.emit("players", obj);
    });
    socket.on('deleteItem', function (data) {
        let indexToDelete = Number(data.itemIndex);
        items.splice(indexToDelete, 1);
        io.emit("items", items);
    });
    socket.on('addCoin', function (data) {
        coinsForPlayers[socket.id] += (Number(data.amount));
        socket.emit("coins", {amount: coinsForPlayers[socket.id]});
    });
    socket.on('inventory', function () {
        socket.emit("inventory", inventories[socket.id]);
    });
    socket.on('message', function (data) {
        io.emit("message", {text: data.text, origin: socket.id});
    });
    socket.on('getisomaplist', function () {
        let isomaps = [];
        fs.readdir("./isomaps", (err, files) => {
            files.forEach(folder => {
                isomaps.push(folder);
            });
            socket.emit('getisomaplist', isomaps);
        });
    });
    socket.on('getisomap', function (data) {
        let isomaps = {};
        fs.readdir("./isomaps", (err, files) => {
            files.forEach(folder => {
                isomaps[folder] = true;
            });
            if (isomaps[data.name]) {
                let raw = fs.readFileSync("./isomaps/" + data.name, 'utf8');
                socket.emit("getisomap", JSON.parse(raw));
            }
        });
    });
    socket.on('deleteisomap', function (data) {
        let isomaps = {};
        fs.readdir("./isomaps", (err, files) => {
            files.forEach(folder => {
                isomaps[folder] = true;
            });
            if (isomaps[data.name] && data.name !== "Basic") {
                fs.unlinkSync('./isomaps/'+data.name);
                io.emit('deleteisomap', {});
            }
        });
    });
    socket.on("updateoffsetsfolder", function (data) {
        let rawdata = fs.readFileSync("server/offsets.json");
        let offsets = JSON.parse(rawdata);
        fs.readdir(imageFolder + "/" + data.name, (err, files) => {
            files.forEach(folder => {
                folder = folder.split(".")[0];
                offsets[folder] = data.offsets;
            });
            let result = JSON.stringify(offsets);
            fs.writeFileSync('server/offsets.json', result);
        });
    });
    socket.on('sendisomap', function (data) {
        let isomaps = {};
        if(data.name.trim() === "") return;
        fs.readdir("./isomaps", (err, files) => {
            files.forEach(folder => {
                isomaps[folder] = true;
            });
            if (isomaps[data.name]) {
                data.name = Date.now();
            }
            let json = JSON.stringify(data);
            fs.writeFile("./isomaps/" + data.name, json, function (err) {
                if (err) throw err;
                console.log('Saved!');
            });
            io.emit('sendisomap', {});
        });
    });
    socket.on('projectile', function (projectile) {

        projectile.origin = socket.id;
        projectile.gameTimeFire = gameTime;
        let obj = {
            projectile: projectile,
            gameTime: gameTime,
        };
        projectiles.push(projectile);
        io.emit("projectile", obj);
    });
    socket.on('newmap', function (data) {
        fs.writeFile("./maps/" + data.name, JSON.stringify(data, null, 4), (err) => {
            if (err) {
                console.error(err);
                return;
            }
            ;
            console.log("File has been created");
        });
    });
    socket.on('disconnect', function (evt) {
        delete players[socket.id];
    });
})
;

function getOffsets() {
    let rawdata = fs.readFileSync("server/offsets.json");
    let offsets = JSON.parse(rawdata);
    return offsets;
}

function movePlayer(player, data, speed) {
    if (data == null) {
        //console.log("data null")
        return
    }
    let d = new Date();
    let currentTime = Math.round(d.getTime());
    if (player.lastMoveTime + 5 < currentTime) {
        player.lastMoveTime = currentTime;
        if (data.x) {
            player.x = data.x;
        }
        if (data.y) {
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
    hitCheckFunctions.calculateAllProjectiles(io, projectiles, gameTime, players, quadtree, mobs, items);
    //mobFunctions.calculateAllMobs(mobs,players,matrix,pathFindingGridSize,gridPathFinder)
    //mobFunctions.moveMobs(mobs,gridPathFinder)
}, 1000 / 60);
setInterval(function () {
    //console.time('calculation');
    if (mobs.length < 4) {
        for (let i = 0; i < 1; i++) {
            let rand = Math.floor(Math.random() * 70) + 1
            //console.log(rand)
            let rand2 = Math.floor(Math.random() * 30) + 4
            //console.log(rand2)
            mobs.push(mobFunctions.createMob(rand * pathFindingGridSize, rand2 * pathFindingGridSize, 1, 1, null, matrix));
        }
        //console.log("generatedMobs")
    }

    mobFunctions.calculateAllMobs(io, mobs, players, matrix, pathFindingGridSize, gridPathFinder, projectiles, quadtree, gameTime)
    //console.timeEnd('calculation');


    //mobFunctions.moveMobs(mobs,gridPathFinder)
    //console.log(mobs.length)
}, 1000);
setInterval(function () {

    mobFunctions.moveMobs(io, mobs, pathFindingGridSize);
    //mobFunctions.moveMobs(mobs,gridPathFinder)

}, 300);
setInterval(function () {

    //mobFunctions.moveMobs(mobs,gridPathFinder)

    //console.log(mobs.length);
    if (playerChanged) {
        let obj = {
            gameTime: gameTime,
            players: players,
            mobs: mobs,
        };
        io.emit("players", obj);
        playerChanged = false;
    }
    //io.emit("players",players);
}, 50);
