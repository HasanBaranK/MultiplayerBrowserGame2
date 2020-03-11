/////////////////////INITIALIZATION CODE//////////////////////////
import {Camera, Player, Inventory, PopUpManager, Bar, ImageList} from "./classes.js";
import {initializeQuadTree, move, cloneMe} from "./collision.js";
import {calculateAllProjectiles, createProjectile} from "./projectiles.js";

let cvs, ctx, keys = {}, socket, data = {}, images = {}, imageNames = {}, promises = [], players = {}, me = undefined,
    currentCoords = {}, animator = {state: "idle"}, uis = {}, gameState = {}, popUpManager = new PopUpManager(),
    vendors = {};
let camera = new Camera(0, 0, 0);
let mapEditorCamera = new Camera(0, 0, 0);
let requestId;
let quadTree = {};
let projectiles = [];
let gameTime = 0;
let mapcvs, mapctx;
let actualmapcvs, actualmapctx;
let actualMousePosition = {};
let items = [];
let inStatsScreen = false;
let coins = 0;
let isInDeadScreen = false;
let fadingDeathScreen = 0;
let fadingDeathScreenInc = 0.01;

let matrix = null;
let mobs;

$(document).ready(init);

/////////////////////GAME FUNCTIONS//////////////////////////////

function init() {
    document.addEventListener('contextmenu', event => event.preventDefault());
    cvs = $("#canvas")[0];

    ctx = cvs.getContext("2d");
    mapcvs = $("#mapeditorcanvas")[0];
    mapctx = mapcvs.getContext("2d");
    actualmapcvs = $("#actualmapcanvas")[0];
    actualmapctx = mapcvs.getContext("2d");

    editorConfig();
    mapEditorConfig();
    configure();

    socket = io.connect({reconnectionDelay: 1000, reconnection: false});
    socket.on("connect", () => {
        socket.emit("getimages", {});
        socket.on("data", (res) => {
            data = res;
            gameTime = res.gameTime;
            vendors = res.vendors;
            items = res.items;
            matrix = data.matrix;
            mobs = data.mobs;
            gameTime = res.gameTime;
            quadTree = initializeQuadTree(quadTree, data.collisionMap);
            //quadTree = data.quadtree;
            socket.emit("newplayer", {});
        });
        socket.on("images", (res) => {
            imageNames = res;
            socket.emit("getdata");
        });
        socket.on("items", (res) => {
            items = res;
        });
        socket.on("joined", (res) => {
            loadImagesThenAnimate(imageNames);
            console.log("joined game");
        });
        socket.on("projectile", (res) => {
            //console.log("received from server")
            //console.log(res)
            //console.log("projectilebefore" + gameTime)
            gameTime = res.gameTime;
            //console.log("projectilenew" + gameTime)
            projectiles.push(res.projectile)

        });
        socket.on("inventory", (res) => {a
            gameState.inventory = res;
        });
        socket.on("mobs", (res) => {
            mobs = res;
        });
        socket.on("coins", (res) => {
            coins = res.amount;
        });
        socket.on("players", (res) => {
            players = res.players;
            //console.log(res.players)
            //console.log("playertimebefore" + gameTime)
            gameTime = res.gameTime;
            if(res.mobs){
                mobs = res.mobs;
            }
            if (me === undefined) {
                me = players[socket.id]

            } else {
                let updated = players[socket.id];
                updated.x = me.x;
                updated.y = me.y;
                me = updated;


            }
            if(me && me.isDead){
                isInDeadScreen = true;
            }
        });
    });
}

function configure() {
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    cvs.style.border = 'solid black 1px';
    cvs.style.position = "absolute";
    cvs.zIndex = 9;

    mapcvs.width = window.innerWidth;
    mapcvs.height = window.innerHeight;
    mapcvs.style.border = 'solid black 1px';
    mapcvs.style.position = "absolute";
    mapcvs.style.zIndex = 10;

    actualmapcvs.width = window.innerWidth;
    actualmapcvs.height = window.innerHeight;
    actualmapcvs.style.border = 'solid black 1px';
    actualmapcvs.style.position = "absolute";
    actualmapcvs.style.zIndex = 8;


    currentCoords.x = cvs.width / 2 - 16;
    currentCoords.y = cvs.height / 2 - 16;

    $("#canvas").click((evt) => {
        mousePosition.x = evt.offsetX || evt.layerX;
        mousePosition.y = evt.offsetY || evt.layerY;
        actualMousePosition.x = mousePosition.x + camera.x;
        actualMousePosition.y = mousePosition.y + camera.y;
        openVendorInventory(actualMousePosition);
    });
}

function openVendorInventory(pos){
    for (let vendorIndex in vendors) {
        let vendor = vendors[vendorIndex];
        if (pos.x >= vendor.x && pos.x < vendor.x + 64 && pos.y >= vendor.y && pos.y < vendor.y + 64) {
            console.log(vendor);
        }
    }
}


function animate() {
    update();
    requestId = requestAnimationFrame(animate);
}

function setUpAnimations() {
    animator.player = new Player();
    let speed = 80;
    animator.player.addAnimation("runUP", images["run"], 0, 7, 0, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runUPRIGHT", images["run"], 0, 7, 1, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runRIGHT", images["run"], 0, 7, 2, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runDOWNRIGHT", images["run"], 0, 7, 3, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runDOWN", images["run"], 0, 7, 4, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runDOWNLEFT", images["run"], 0, 7, 5, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runLEFT", images["run"], 0, 7, 6, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runUPLEFT", images["run"], 0, 7, 7, 32, 32, 32, 32, speed);

    animator.player.addAnimation("idle", images["idle"], 0, 7, 4, 32, 32, 32, 32, 120);
}

function setUpUI() {
    uis["inventory"] = new Inventory(images["itemframe2"], 16, 200, 4, 4, 10, 5, gameState, images);
    uis["healthbar"] = new Bar(images["healthbar"], 8, cvs.height - 32, 0, 100);
    uis["healthbarframe"] = new Bar(images["healthbarframe"], 8, cvs.height - 32, 100, 100)
}

let scale = 1;
document.getElementById("mapeditorcanvas").addEventListener('wheel',function(event){
    //console.log(event.deltaY)
    if(event.deltaY < 0){
        if(scale <= 0.05){

        }else {
            scale -= 0.05;
        }
    }else {
        scale += 0.05;
    }
    console.log(scale)
    cameraFollow()
    return false;
}, false);

function update() {

    cameraFollow();
    ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);

    drawTiles2(14, 16, 64);
    //drawMapBack(14, 16, 64);
    drawPlayer();
    drawPlayers();
    drawMobs(mobs)
    calculateAllProjectiles(projectiles, gameTime, quadTree, players,mobs)
    drawMapFront2(14, 16, 64);



    for (let ui in uis) {
        uis[ui].draw(ctx, camera);
    }
    //Debug

    //drawPlayerCollision()

    //drawVendors();
    drawItems();
   /* if(matrix!==null) {
        drawMatrix(matrix, 16)
    }*/
    drawPopUps();
    drawUI();
    if(inStatsScreen){
        drawStats();
    }
    //drawMapCollision(data.collisionMap)
    //drawPlayerCollision()
    if(isInDeadScreen){
        drawDeadScreen();
    }
}
function drawMobs(mobs){
    if(mobs !== null && mobs !== undefined){
        ctx.save()
        ctx.scale(scale,scale)
        for (let i = 0; i < mobs.length; i++) {
            ctx.drawImage(images["archer"], 0, 0, 128, 128, mobs[i].x-48, mobs[i].y-40, 128,128);
            //ctx.fillRect(mobs[i].x, mobs[i].y, 32, 32);
        }
        ctx.restore()
    }
}

function drawDeadScreen(){
    ctx.fillStyle = "rgba(0, 0, 0," + fadingDeathScreen + ")";
    ctx.fillRect(camera.x,camera.y, cvs.width, cvs.height);
    fadingDeathScreen += fadingDeathScreenInc;
    if(fadingDeathScreen >= 0.8){
        fadingDeathScreenInc = 0;
    }
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    ctx.fillText("YOU ARE DEAD",camera.x + cvs.width/2 - 30, camera.y + cvs.height/2)
}

function drawCoinsAmount(size = 32){
    ctx.drawImage(images["coin"], (size+images["healthbar"].width + camera.x), (cvs.height + camera.y - size - 5), size, size);
    ctx.fillStyle = "gold";
    ctx.font = "34px Arial";
    ctx.fillText(coins, (size+images["healthbar"].width + camera.x) + 50, (cvs.height + camera.y - size - 5) + 27)
}


function drawStats(){
    //draw big rectangle
    //draw stats on it but you have to position properly
    //array of stats each with an offset increment offset and change y coord and draw stats afterwards
    //ctx.fillText(text, x, y)
    //ctx.fillRect(x,y,w,h)
    ctx.fillStyle = "green";
    ctx.fillRect(0 + camera.x, 0 + camera.y, cvs.width, cvs.height);
    ctx.fillStyle = "black";

}

function drawVendors () {
    for (let vendorIndex in vendors) {
        let vendor = vendors[vendorIndex];
        ctx.drawImage(images[vendor.name], vendor.x, vendor.y, 64, 64);
    }
}


function drawItems () {
    for (let itemIndex in items) {
        let item = items[itemIndex];
        if (item.x >= me.x && item.x < me.x + me.width + 8 && item.y >= me.y && item.y < me.y + me.height + 8) {
            //items.splice(itemIndex, 1);
            if (item.name === "coin") {
                socket.emit("deleteItem",{itemIndex:itemIndex});
                socket.emit("addCoin",{amount:1});
            }
        }
        else {
            ctx.save()
            ctx.scale(scale,scale)
        ctx.drawImage(images[item.name], item.x, item.y, 8, 8);
            ctx.restore();
        }
    }
}

setInterval(function () {
    if(!isInDeadScreen){
        doTheMovement();
    }
    gameTime = updateGameTime(gameTime, 1);

}, 1000 / 60);

function doTheMovement() {
    let locationChanged = false;

    let step = 8;
    if (keys["a"]) {
        locationChanged = true;
        if (move(me, 0, quadTree, 2)) {
        }

    }
    if (keys["d"]) {
        locationChanged = true;
        if (move(me, 1, quadTree, 2)) {
        }

    }
    if (keys["s"]) {
        locationChanged = true;
        if (move(me, 2, quadTree, 2)) {
        }
    }
    if (keys["w"]) {
        locationChanged = true;
        if (move(me, 3, quadTree, 2)) {
        }
    }
    if (keys["p"]) {
        //console.log(me.x+","+me.y)
        let meX = Math.floor(me.x);
        let meY = Math.floor(me.y);
        meX = meX - meX % 32;
        meY = meY - meY % 32;
        console.log(meX + "," + meY)
    }
    if (locationChanged) {

        socket.emit("movement", {
            "w": keys["w"],
            "a": keys["a"],
            "s": keys["s"],
            "d": keys["d"],
            "x": me.x,
            "y": me.y,
            "gametime": gameTime
        });
    }

}

function drawPlayer() {
    if(!isInDeadScreen){
        ctx.save()
        ctx.scale(scale,scale)
        if (keys["w"] && keys["d"]) {
            animationChecker("runUPRIGHT");
        } else if (keys["w"] && keys["a"]) {
            animationChecker("runUPLEFT");
        } else if (keys["s"] && keys["d"]) {
            animationChecker("runDOWNRIGHT");
        } else if (keys["s"] && keys["a"]) {
            animationChecker("runDOWNLEFT");
        } else if (keys["w"]) {
            animationChecker("runUP");
        } else if (keys["s"]) {
            animationChecker("runDOWN");
        } else if (keys["a"]) {
            animationChecker("runLEFT");
        } else if (keys["d"]) {
            animationChecker("runRIGHT");
        } else {
            animationChecker("idle");
        }
        ctx.restore();
    }
}

function createFakePlayer() {
    return {
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
    }
}

function predictPlayerPosition(player) {
    try {
        let predicted = createFakePlayer();
        predicted = Object.assign(predicted, player);

        //console.log(predicted);
        let dif = gameTime - player.lastgametime;
        //console.log("dif:" + dif)
        if (player.delay * 2 > dif && dif > 2) {
            //console.log("predicting")
            let lastMoveTimeDiff = player.lastgametime - player.histgametime;
            if (lastMoveTimeDiff > 1) {
                let moveAmountX = player.x - player.histX;
                let moveAmountY = player.y - player.histY;
                //console.log("lastMoveTimeDiff:" + lastMoveTimeDiff)
                let predictedMoveX = dif * moveAmountX / lastMoveTimeDiff;
                let predictedMoveY = dif * moveAmountY / lastMoveTimeDiff;
                //console.log("preMoveX" + predictedMoveX)
                //console.log("preMoveY" + predictedMoveY)
                try {

                    if (isNaN(predictedMoveX)) {
                    } else {
                        predicted.x += predictedMoveX;
                    }
                } catch (e) {
                }
                try {
                    if (isNaN(predictedMoveY)) {
                    } else {
                        predicted.y += predictedMoveY;
                    }
                    predicted.y += predictedMoveY;
                } catch (e) {
                }
                return predicted
            }
        }
    } catch (e) {
        console.log("error3")
        return player;
    }
    return player;

}

function drawPlayers() {
    for (let playerIndex in players) {
        if (playerIndex !== socket.id) {

            let player = players[playerIndex];


            //ctx.drawImage(images["idle"], 0, 0, 32, 32, player.x, player.y, 32, 32);
            let predicted = predictPlayerPosition(player);
            try {
                ctx.save()
                ctx.scale(scale,scale)
                if (player.isDead) {
                    //dont delete this
                    ctx.drawImage(images["stick"], player.x, player.y);
                } else {
                    ctx.drawImage(images["idle"], 0, 0, 32, 32, player.x, player.y, 32, 32);
                }
                ctx.restore()
            } catch (e) {
                //  console.log("important")
            }


        }
    }
}

function drawUI() {
    uis["healthbar"].update(me.health);
    for (let ui in uis) {
        uis[ui].draw(ctx, camera);
    }
    drawCoinsAmount();
}

function drawPopUps() {
    popUpManager.drawPopUps(ctx);
}


function animationChecker(stateName) {
    if (animator.state !== stateName) {
        animator.player.animations[animator.state].reset();
    }
    animator.state = stateName;
    animator.player.draw(ctx, stateName, me.x, me.y);
}

function cameraFollow() {
    if (me.x !== currentCoords.x || me.y !== currentCoords.y) {
        let xDifference = (currentCoords.x  - me.x);
        let yDifference = (currentCoords.y - me.y);
        camera.move(ctx, -xDifference, -yDifference);
        currentCoords.x = me.x ;
        currentCoords.y = me.y ;
    }
}

function printMousePos(event) {
    /*console.log(
         "clientX: " + (event.clientX+camera.x) +
         " - clientY: " + (event.clientY+camera.y));
    console.log(currentCoords.x,currentCoords.y);
    console.log(currentCoords.x,currentCoords.y);*/
    if (!mapEditorMode && !editorMode && !isInDeadScreen) {
        createProjectile(projectiles, "arrow2", me.x, me.y, me.x, me.y, event.clientX + camera.x, event.clientY + camera.y, 10, quadTree, players, gameTime)
    }
}

document.getElementById("mapeditorcanvas").addEventListener("click", printMousePos);

function drawTiles(Xsize, Ysize, gridSize) {
    let meX = Math.floor(me.x);
    let meY = Math.floor(me.y);
    meX = meX - meX % gridSize;
    meY = meY - meY % gridSize;
    let blockX = meX - gridSize * Xsize
    if (blockX < 0) {
        blockX = 0;
    }

    //console.log(blockX + "," + blockY)
    for (; blockX <= meX + gridSize * Xsize;) {
        if (data.map[blockX] != null) {

            let blockY = meY - gridSize * Ysize
            if (blockY < 0) {
                blockY = 0;
            }
            for (; blockY <= meY + gridSize * Ysize; blockY += gridSize) {
                if (data.map[blockX][blockY] != null) {

                    let block = data.map[blockX][blockY];
                    //console.log("found" + blockX + "," + blockY)
                    if (block) {
                        ctx.drawImage(images[block.tile], blockX, blockY, 64, 64);
                    }


                } else {
                    //              console.log("not found: "+blockX+","+blockY)
                }
            }

        }
        blockX += gridSize
    }
}
function drawTiles2(Xsize, Ysize, gridSize) {
    let meX = Math.floor(me.x);
    let meY = Math.floor(me.y);
    meX = meX - meX % gridSize;
    meY = meY - meY % gridSize;
    let blockX = meX - gridSize * Xsize
    if (blockX < 0) {
        blockX = 0;
    }

    //console.log(blockX + "," + blockY)
    for (let x in data.map) {
        for (let y in data.map[x]) {
            let thing = data.map[x][y];
            if(thing !== null ){
            if(thing.tile !== null ) {
                ctx.save()
                ctx.scale(scale,scale)
                ctx.drawImage(images[thing.tile], thing.x, thing.y, 64, 64);
                ctx.restore()
            }
            }
        }
    }

}

function drawMapFront(Xsize, Ysize, gridSize) {
    let meX = Math.floor(me.x);
    let meY = Math.floor(me.y);
    meX = meX - meX % gridSize;
    meY = meY - meY % gridSize;
    let blockX = meX - gridSize * Xsize;
    if (blockX < 0) {
        blockX = 0;
    }
    for (; blockX <= meX + gridSize * Xsize; blockX += gridSize) {
        if (data.map[blockX] != null) {

            let blockY = meY - gridSize * Ysize
            if (blockY < 0) {
                blockY = 0;
            }
            for (; blockY <= meY + gridSize * Ysize; blockY += gridSize) {
                let block = data.map[blockX][blockY];
                if (block != null) {
                    //console.log("found" + blockX + "," + blockY)
                    if (block.plant != null) {
                        ctx.drawImage(images[block.plant.name], block.plant.x, block.plant.y, 64, 64);
                    }
                    if (block.tree != null) {
                        ctx.drawImage(images[block.tree.name], block.tree.x, block.tree.y);
                    }
                }
            }

        }

    }


}
function drawMapFront2(Xsize, Ysize, gridSize) {
    let meX = Math.floor(me.x);
    let meY = Math.floor(me.y);
    meX = meX - meX % gridSize;
    meY = meY - meY % gridSize;
    let blockX = meX - gridSize * Xsize;
    if (blockX < 0) {
        blockX = 0;
    }
    for (let x in data.treeMap) {
        let thing = data.treeMap[x];
        ctx.save()
        ctx.scale(scale,scale)
        ctx.drawImage(images[thing.name], thing.x, thing.y);
        ctx.restore()
    }


}
////////////////HTML EVENTS CODE////////////////////////

// window.addEventListener("resize", () => {
//     let width = window.innerWidth;
//     let height = window.innerHeight;
//     cvs.width = width;
//     cvs.height = height;
// });

$(window).keydown((key) => {
    keys[key.key] = true;
    let keyPressed = key.key;
    if (key.key === "i") {
        gameState.inInventory = !gameState.inInventory;
        socket.emit("inventory",);
    }
    if (key.key === "m" && mapEditorMode) {
        drawSelection = true;
    }
    if(key.key === "l" && mapEditorMode){
        socket.emit("newmap", {name:Date.now().toString(),gridSize:gridSize, gridBasedMapArray:gridBasedMapArray, nonGridBasedMapArray:nonGridBasedMapArray})
    }
    if(key.key === "z" && mapEditorMode){
        if(nonGridBasedMapArray.length > 0){
            nonGridBasedMapArray.splice(nonGridBasedMapArray.length - 1, 1);
        }
    }
    if(keyPressed === "q"){
        inStatsScreen = !inStatsScreen;
    }
});

$(window).keyup((key) => {
    keys[key.key] = false;
});

//////////////////////UTILS/////////////////////////////////

function loadImagesThenAnimate(folders) {
    for (let folder in folders) {
        for (let image in folders[folder]) {
            promises.push(new Promise((resolve, reject) => {
                let img = new Image();
                img.onload = function () {
                    resolve('resolved')
                };
                img.src = './images/' + folder + '/' + folders[folder][image];
                images[folders[folder][image].split('.png')[0]] = img
            }))
        }
    }
    Promise.all(promises).then(() => {
        setUpAnimations();
        setUpImagesListForMapEditor();
        setUpUI();
        requestId = window.requestAnimationFrame(animate);
    });
}

function updateGameTime(gameTime, speed) {
    gameTime = gameTime + speed;
    return gameTime
}

function sendProjectileServer(projectile) {
    //console.log("Sending to server")
    //console.log(projectile)
    socket.emit("projectile", projectile)
}

function drawImageRotation(image, x, y, scale, rotation, sin, cos) {
    ctx.save()
    ctx.translate(x, y)
    //ctx.rotate(-projectiles[projectile].angle)
    //ctx.setTransform(scale, 0, 0, scale, x, y); // sets scale and origin
    if (Math.asin(sin) < 0) {
        ctx.rotate(-Math.acos(cos));
    } else {
        ctx.rotate(Math.acos(cos));
    }
    /*console.log("arccos: "+radians_to_degrees(Math.acos(cos)));
    console.log("arcsin: "+radians_to_degrees(Math.asin(sin)));
    console.log("arctan: "+radians_to_degrees(Math.atan(sin/cos)));*/
    ctx.drawImage(images[image], 0, 0);
    //console.log(ctx.getTransform());
    //ctx.fillRect(16, 9, 7, 5);
    ctx.restore()
    ctx.save()
    let pos;
    if (Math.asin(sin) < 0) {
        pos = rotate(x,y,x+16,y+9,-Math.acos(cos))
    } else {
        pos = rotate(x,y,x+16,y+9,Math.acos(cos))
    }
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    /*if (Math.asin(sin) < 0) {
        ctx.rotate(-Math.acos(cos));
    } else {
        ctx.rotate(Math.acos(cos));
    }*/
    //ctx.rotate(Math.atan(rotation));
    //console.log(x +","+y+","+pos)
    ctx.fillRect(pos[0], pos[1], 7, 5);

    ctx.restore()
}
function rotate(cx, cy, x, y, angle) {
    let radians = angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return [nx, ny];
}
function radians_to_degrees(radians) {
    var pi = Math.PI;
    return radians * (180 / pi);
}


//////////////////////Editor//////////////////////////////////

let editorMode = false;
let rectangles = [];
let selectedRectangleIndex = -1;
let mousePosition = {};
let imageName;
let timebefore = Date.now();
let timenow = Date.now();


function editorConfig() {
    $("#editor").click(() => {
        if (!editorMode) {
            $("#editor")[0].innerText = "Game";
            $("#mapeditor")[0].style.display = "none";
            $("#add")[0].style.display = "block";
            $("#imagename")[0].style.display = "block";
            $("#select")[0].style.display = "block";
            editorMode = true;
            ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
            camera.set(ctx, 0, 0);
            window.cancelAnimationFrame(requestId);
            requestId = window.requestAnimationFrame(editor);
        } else {
            $("#editor")[0].innerText = "Collision Editor";
            $("#mapeditor")[0].style.display = "block";
            $("#add")[0].style.display = "none";
            $("#imagename")[0].style.display = "none";
            $("#select")[0].style.display = "none";
            editorMode = false;
            ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
            camera.restore(ctx);
            window.cancelAnimationFrame(requestId);
            requestId = window.requestAnimationFrame(animate);
        }
    });

    $("#add").click(() => {
        addRectangle(camera.x + cvs.width / 2 - 50, camera.y + cvs.height / 2 - 50, 100, 100);
    });

    $("#select").click(() => {
        imageName = $("#imagename")[0].value;
    });

    $("#mapeditorcanvas").click((evt) => {
        mousePosition.x = evt.offsetX || evt.layerX;
        mousePosition.y = evt.offsetY || evt.layerY;
        checkRectangleIndex(mousePosition.x + camera.x, mousePosition.y + camera.y);
    });
}


function editor() {
    updateEditor();
    requestId = requestAnimationFrame(editor);
}

function updateEditor() {
    timenow = Date.now();
    if (timenow - timebefore > 30) {
        timebefore = timenow;
        if (selectedRectangleIndex != -1) {
            let r = rectangles[selectedRectangleIndex];
            if (keys["w"]) {
                rectangles[selectedRectangleIndex].y--;
            }
            if (keys["s"]) {
                rectangles[selectedRectangleIndex].y++;
            }
            if (keys["a"]) {
                rectangles[selectedRectangleIndex].x--;
            }
            if (keys["d"]) {
                rectangles[selectedRectangleIndex].x++;
            }
            if (keys["ArrowUp"] && r.h > 5) {
                rectangles[selectedRectangleIndex].h--;
            }
            if (keys["ArrowDown"]) {
                rectangles[selectedRectangleIndex].h++;
            }
            if (keys["ArrowLeft"] && r.w > 5) {
                rectangles[selectedRectangleIndex].w--;
            }
            if (keys["ArrowRight"]) {
                rectangles[selectedRectangleIndex].w++;
            }
            if (keys["x"]) {
                rectangles.splice(selectedRectangleIndex, 1);
                selectedRectangleIndex = -1;
            }
            if (keys["p"]) {
                let message = {name: imageName, rectangles: []};
                for (let rectangle in rectangles) {
                    let r = rectangles[rectangle];
                    let xOffset = r.x - (camera.x + cvs.width / 2);
                    let yOffset = r.y - (camera.y + cvs.height / 2);
                    message.rectangles.push({x: xOffset, y: yOffset, width: r.w, height: r.h})
                }
                console.log(message);
                //alert(JSON.stringify(message))
                socket.emit("updatecollision", message);
            }
        }
    }
    ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
    if (imageName) {
        try {
            ctx.drawImage(images[imageName], camera.x + cvs.width / 2, camera.y + cvs.height / 2);
            ctx.beginPath();
            ctx.rect(camera.x + cvs.width / 2, camera.y + cvs.height / 2, images[imageName].width, images[imageName].height);
            ctx.stroke();
        } catch (e) {

        }

    }
    for (let rectangle in rectangles) {
        let r = rectangles[rectangle];
        if (rectangle == selectedRectangleIndex) {
            ctx.strokeStyle = "yellow";
            ctx.beginPath();
            ctx.rect(r.x, r.y, r.w, r.h);
            ctx.stroke();
            ctx.strokeStyle = "black"
        }
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w, r.h);
        ctx.stroke();
    }
}

function addRectangle(x, y, w, h) {
    rectangles.push(new Rectangle(x, y, w, h));
}

function checkRectangleIndex(x, y) {
    for (let rectangle in rectangles) {
        let r = rectangles[rectangle];
        if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) {
            selectedRectangleIndex = rectangle;
            return;
        }
    }
}

function drawPlayerCollision() {
    for (let key in players) {
        if (key === origin) {
            continue
        }
        let player = cloneMe(players[key]);
        let offset = {
            x: 10,
            y: 17,
            width: 14,
            height: 14,
        }
        player.x += offset.x
        player.y += offset.y
        player.width = offset.width
        player.height = offset.height
        ctx.save()
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(player.x, player.y, player.width, player.height);
        //ctx.fillStyle = "rgba(255,0,18,0.7)";
        //ctx.fillRect(me.x, me.y, me.width, me.height);
        ctx.restore()
    }
}

function drawMapCollision(map) {
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    for (let i = 0; i < map.length; i++) {

        ctx.fillRect(map[i].x, map[i].y, map[i].width, map[i].height);

    }
    ctx.restore()
}
function drawMatrix(matrix,gridSize) {
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    for (let i = 0; i < matrix.length; i++) {

        for (let j = 0; j < matrix[i].length ; j++) {
            if ( matrix[i][j] === 1) {
                ctx.fillRect(i * gridSize, j*gridSize, gridSize, gridSize);
            }
        }


    }
    ctx.restore()
}

var startPathfinding = function() {

    for (var i = 0; i < mobs.length; i++) {

        findPathForHero(mobs[i], function() {

        });
    }
};

function calculateAllMobs(mobs){
    for (let i = 0; i < mobs.length; i++) {

    }
}




class Rectangle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

export {
    animate,
    sendProjectileServer,
    drawImageRotation,
    popUpManager
}

/////////////////////////Map Editor/////////////////////////////
let mapEditorMode = false;
let mapMousePosition = {};
let mapImageName;
let mapTimebefore = Date.now();
let mapTimenow = Date.now();
let imageListObject;
let imageIndexes = [];
let imageSelected = undefined;
let gridSize = 64;
let gridBasedMapArray = [];
let nonGridBasedMapArray = [];
let mapXMin = 0;
let mapXMax = gridSize * 100;
let mapYMin = 0;
let mapYMax = gridSize * 100;
let delayForMovingCam = Date.now();
let drawSelection = true;
let leftMouseClicked = false;
let rightMouseClicked = false;
let delayForRightClick = Date.now();
let sprayOn = true;
let sprayAmount = 5*gridSize;
function mapEditor() {
    updateMapEditor();
    requestId = requestAnimationFrame(mapEditor);
}

function updateMapEditor() {
    let currentTime = Date.now();
    let allowedToMove = false;
    if (currentTime - delayForMovingCam > 50) {
        allowedToMove = true;
        delayForMovingCam = Date.now();
    }
    actualmapctx.clearRect(mapEditorCamera.x, mapEditorCamera.y, actualmapcvs.width + mapEditorCamera.x, actualmapcvs.height + mapEditorCamera.y);

    if (allowedToMove) {
        if (keys["a"]) {
            mapEditorCamera.move(actualmapctx, -gridSize, 0);
            if (mapEditorCamera.x < 0 || mapEditorCamera.y < 0) {
                mapEditorCamera.move(actualmapctx, gridSize, 0);
            }
        }
        if (keys["d"]) {
            mapEditorCamera.move(actualmapctx, gridSize, 0);
            if (mapEditorCamera.x < 0 || mapEditorCamera.y < 0) {
                mapEditorCamera.move(actualmapctx, -gridSize, 0);
            }
        }
        if (keys["s"]) {
            mapEditorCamera.move(actualmapctx, 0, gridSize);
            if (mapEditorCamera.x < 0 || mapEditorCamera.y < 0) {
                mapEditorCamera.move(actualmapctx, 0, -gridSize);
            }
        }
        if (keys["w"]) {
            mapEditorCamera.move(actualmapctx, 0, -gridSize);
            if (mapEditorCamera.x < 0 || mapEditorCamera.y < 0) {
                mapEditorCamera.move(actualmapctx, 0, gridSize);
            }
        }
    }
    if (leftMouseClicked) {
        if (imageSelected) {


            let sprayX = 0;
            let sprayY = 0;

            if(sprayOn){
                sprayX = Math.floor(Math.random()*sprayAmount)
                sprayY = Math.floor(Math.random()*sprayAmount)
            }
            let placedXGrid = (mousePosition.x * 1/scale + mapEditorCamera.x)+sprayX;
            let placedYGrid = (mousePosition.y * 1/scale + mapEditorCamera.y)+sprayY;

            if(placedXGrid>mapXMin&&placedXGrid < mapXMax&&placedYGrid>mapYMin && placedYGrid < mapYMax){
            placedXGrid = Math.floor((placedXGrid / gridSize)) * gridSize;
            placedYGrid = Math.floor((placedYGrid / gridSize)) * gridSize;

            if (!gridBasedMapArray[placedXGrid / gridSize]) {
                gridBasedMapArray[placedXGrid / gridSize] = [];
            }
            gridBasedMapArray[placedXGrid / gridSize][placedYGrid / gridSize] = {
                tile: imageSelected,
                x: placedXGrid,
                y: placedYGrid
            };
            }
        }
    }
    if (currentTime - delayForRightClick > 200) {
        if (rightMouseClicked) {
            if (imageSelected) {
                nonGridBasedMapArray.push({
                    name: imageSelected,
                    x: mousePosition.x*1/scale + mapEditorCamera.x,
                    y: mousePosition.y*1/scale + mapEditorCamera.y
                });
            }
        }

        delayForRightClick = Date.now();
    }

    drawMapCreated();
    drawMapCreatedNonGrid();
    if (drawSelection) {
        imageListObject.draw(actualmapctx, mapEditorCamera);
    }

    if (imageSelected) {
        actualmapctx.drawImage(images[imageSelected], mousePosition.x + mapEditorCamera.x, mousePosition.y + mapEditorCamera.y, gridSize, gridSize);
    }
}

function setUpImagesListForMapEditor() {
    imageListObject = new ImageList(images, 10, 100, 32, 32, 10, 5, 5);
}

function drawGrid() {
    for (let x = 0; x < mapcvs.width; x++) {
        for (let y = 0; y < mapcvs.height; y++) {
            mapctx.save()
            mapctx.scale(scale,scale)
            mapctx.beginPath();
            mapctx.rect(x * gridSize, y * gridSize, gridSize, gridSize);
            mapctx.stroke();
            mapctx.restore()
        }
    }
}

function drawMapCreated() {
    for (let x in gridBasedMapArray) {
        for (let y in gridBasedMapArray[x]) {
            let thing = gridBasedMapArray[x][y];
            actualmapctx.save()
            actualmapctx.scale(scale,scale)
            actualmapctx.drawImage(images[thing.tile], thing.x, thing.y, gridSize, gridSize);
            actualmapctx.restore()
        }
    }
    actualmapctx.beginPath();
    actualmapctx.rect(mapXMin, mapYMin, mapXMax, mapYMax);
    actualmapctx.stroke();
}

function drawMapCreatedNonGrid() {
    for (let x in nonGridBasedMapArray) {
        let thing = nonGridBasedMapArray[x];
        actualmapctx.save()
        actualmapctx.scale(scale,scale)
        actualmapctx.drawImage(images[thing.name], thing.x, thing.y);
        actualmapctx.restore()
    }
    actualmapctx.save()
    actualmapctx.scale(scale,scale)
    actualmapctx.beginPath();
    actualmapctx.rect(mapXMin, mapYMin, mapXMax, mapYMax);
    actualmapctx.stroke();
    actualmapctx.restore()
}


function mapEditorConfig() {
    $("#mapeditor").click(() => {
        if (!mapEditorMode) {
            $("#editor")[0].style.display = "none";
            $("#mapeditor")[0].innerText = "Game";
            mapEditorMode = true;
            ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
            camera.set(ctx, 0, 0);
            drawGrid();
            window.cancelAnimationFrame(requestId);
            requestId = window.requestAnimationFrame(mapEditor);
        } else {
            $("#editor")[0].style.display = "block";
            $("#mapeditor")[0].innerText = "Map Editor";
            mapEditorMode = false;
            ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
            camera.restore(ctx);
            mapctx.clearRect(0, 0, mapcvs.width, mapcvs.height);
            window.cancelAnimationFrame(requestId);
            requestId = window.requestAnimationFrame(animate);
        }
    });
    $("#mapeditorcanvas").contextmenu((evt) => {
        if (imageSelected) {
            nonGridBasedMapArray.push({
                name: imageSelected,
                x: mousePosition.x + mapEditorCamera.x,
                y: mousePosition.y + mapEditorCamera.y
            });
        }
    });
    $("#mapeditorcanvas").mouseup((evt) => {
        leftMouseClicked = false;
        rightMouseClicked = false;
    });
    $("#mapeditorcanvas").mousedown((evt) => {
        if (evt.button === 2) {
            rightMouseClicked = true;
        } else if (evt.button === 0) {
            leftMouseClicked = true;
        }
    });
    $("#mapeditorcanvas").click((evt) => {
        let imgWidth = 32;
        let imgHeight = 32;
        let x = 10;
        let y = 100;
        let xOff = 5;
        let yOff = 5;
        let xIndex = 0;
        let yIndex = 0;
        let xLimit = 10;
        if (drawSelection) {
            for (let imageName in images) {
                let xReal = x + (xIndex * (xOff + imgWidth)) + camera.x;
                let yReal = y + (yIndex * (yOff + imgHeight)) + camera.y;
                if (mousePosition.x >= xReal && mousePosition.x <= xReal + imgWidth && mousePosition.y >= yReal && mousePosition.y < yReal + imgHeight) {
                    imageSelected = imageName;
                    drawSelection = false;
                    console.log(imageSelected)
                }
                xIndex++;
                if (xIndex === xLimit) {
                    yIndex++;
                    xIndex = 0;
                }
            }
        }
        if (imageSelected) {
            let placedXGrid = (mousePosition.x *1/scale+ mapEditorCamera.x);
            let placedYGrid = (mousePosition.y*1/scale+ mapEditorCamera.y);
            if(placedXGrid>mapXMin&&placedXGrid < mapXMax&&placedYGrid>mapYMin && placedYGrid < mapYMax) {
                placedXGrid = Math.floor((placedXGrid / gridSize)) * gridSize;
                placedYGrid = Math.floor((placedYGrid / gridSize)) * gridSize;
                if (!gridBasedMapArray[placedXGrid / gridSize]) {
                    gridBasedMapArray[placedXGrid / gridSize] = [];
                }
                gridBasedMapArray[placedXGrid / gridSize][placedYGrid / gridSize] = {
                    tile: imageSelected,
                    x: placedXGrid,
                    y: placedYGrid
                };
            }
        }
    });
    $("#mapeditorcanvas").mousemove(function (evt) {
        mousePosition.x = evt.offsetX || evt.layerX;
        mousePosition.y = evt.offsetY || evt.layerY;
    });
}



//
//
//
//
///1000 LINES !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
