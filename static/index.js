/////////////////////INITIALIZATION CODE//////////////////////////
import {Camera, Player, Inventory, PopUpManager, Bar} from "./classes.js";
import {initializeQuadTree, move, cloneMe} from "./collision.js";
import {calculateAllProjectiles, createProjectile} from "./projectiles.js";

let cvs, ctx, keys = {}, socket, data = {}, images = {}, imageNames = {}, promises = [], players = {}, me = undefined,
    currentCoords = {}, animator = {state: "idle"}, uis = {}, gameState = {}, popUpManager = new PopUpManager(), vendors = {};
let camera = new Camera(0, 0, 0);
let requestId;
let quadTree = {};
let projectiles = [];
let gameTime = 0;
let actualMousePosition = {};
let items = [];
let inStatsScreen = false;

let matrix = null;
let mobs;

$(document).ready(init);

/////////////////////GAME FUNCTIONS//////////////////////////////

function init() {
    cvs = $("#canvas")[0];
    ctx = cvs.getContext("2d");

    editorConfig(ctx, cvs, camera, requestId);
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
            gameTime = res.gameTime
            quadTree = initializeQuadTree(quadTree, data.collisionMap);
            //quadTree = data.quadtree;
            socket.emit("newplayer", {});
        });
        socket.on("images", (res) => {
            imageNames = res;
            socket.emit("getdata");
        });
        socket.on("joined", (res) => {
            loadImagesThenAnimate(imageNames);
            console.log("joined game");
        });
        socket.on("projectile", (res) => {
            //console.log("received from server")
            //console.log(res)
            console.log("projectilebefore" + gameTime)
            gameTime = res.gameTime;
            console.log("projectilenew" + gameTime)
            projectiles.push(res.projectile)

        });
        socket.on("inventory", (res) => {
            gameState.inventory = res;
        });
        socket.on("mobs", (res) => {
            mobs = res;
        });
        socket.on("players", (res) => {
            players = res.players;
            console.log(res.players)
            console.log("playertimebefore" + gameTime)
            gameTime = res.gameTime;
            mobs = res.mobs;
            if (me === undefined) {
                me = players[socket.id]

            } else {
                let updated = players[socket.id];
                updated.x = me.x;
                updated.y = me.y;
                me = updated;


            }

        });
    });
}

function configure() {
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    cvs.style.border = 'solid black 1px';

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


function update() {
    cameraFollow();
    ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
    drawTiles(14, 16, 64);
    //drawMapBack(14, 16, 64);
    drawPlayer();
    drawPlayers();
    drawMobs(mobs)
    drawMapFront(14, 16, 64);
    calculateAllProjectiles(projectiles, gameTime, quadTree, players)
    for (let ui in uis) {
        uis[ui].draw(ctx, camera);
    }
    //Debug

    //drawPlayerCollision()
    drawVendors();
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
}
function drawMobs(mobs){
    if(mobs !== null && mobs !== undefined){
        ctx.save()
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        for (let i = 0; i < mobs.length; i++) {
            ctx.fillRect(mobs[i].x, mobs[i].y, 16, 16);
        }
        ctx.restore()
    }
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
            items.splice(itemIndex, 1);
            console.log(item);
            if (item.name === "coin") {
                console.log(players[socket.id]);
            }
        }
        else {
            ctx.drawImage(images[item.name], item.x, item.y, 8, 8);
        }
    }
}

setInterval(function () {
    doTheMovement();
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
                    console.log("error1")
                }
                try {
                    if (isNaN(predictedMoveY)) {
                    } else {
                        predicted.y += predictedMoveY;
                    }
                    predicted.y += predictedMoveY;
                } catch (e) {
                    console.log("error2")
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
                if (player.isDead) {
                    //dont delete this
                    ctx.drawImage(images["stick"], player.x, player.y);
                } else {
                    ctx.drawImage(images["idle"], 0, 0, 32, 32, player.x, player.y, 32, 32);
                }
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
        let xDifference = (currentCoords.x - me.x);
        let yDifference = (currentCoords.y - me.y);
        camera.move(ctx, -xDifference, -yDifference);
        currentCoords.x = me.x;
        currentCoords.y = me.y;
    }
}

function printMousePos(event) {
    /*console.log(
         "clientX: " + (event.clientX+camera.x) +
         " - clientY: " + (event.clientY+camera.y));
    console.log(currentCoords.x,currentCoords.y);
    console.log(currentCoords.x,currentCoords.y);*/
    createProjectile(projectiles, "arrow2", me.x, me.y, me.x, me.y, event.clientX + camera.x, event.clientY + camera.y, 10, quadTree, players, gameTime)
}

document.getElementById("canvas").addEventListener("click", printMousePos);

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
    ctx.restore()
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";

    //ctx.rotate(Math.atan(rotation));
    ctx.fillRect(x + 16, y + 9, 7, 5);

    ctx.restore()
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

    $("#canvas").click((evt) => {
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
// let mapEditorMode = false;
// let mapMousePosition = {};
// let mapImageName;
// let mapTimebefore = Date.now();
// let mapTimenow = Date.now();
//
// function mapEditorConfig() {
//     $("#mapeditor").click(() => {
//         if (!editorMode) {
//             $("#editor")[0].innerText = "Game";
//             $("#mapeditor")[0].style.display = "none";
//             $("#add")[0].style.display = "block";
//             $("#imagename")[0].style.display = "block";
//             $("#select")[0].style.display = "block";
//             editorMode = true;
//             ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
//             camera.set(ctx, 0, 0);
//             window.cancelAnimationFrame(requestId);
//             requestId = window.requestAnimationFrame(editor);
//         } else {
//             $("#editor")[0].innerText = "Collision Editor";
//             $("#mapeditor")[0].style.display = "none";
//             $("#add")[0].style.display = "none";
//             $("#imagename")[0].style.display = "none";
//             $("#select")[0].style.display = "none";
//             editorMode = false;
//             ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
//             camera.restore(ctx);
//             window.cancelAnimationFrame(requestId);
//             requestId = window.requestAnimationFrame(animate);
//         }
//     });
//
//     $("#add").click(() => {
//         addRectangle(camera.x + cvs.width / 2 - 50, camera.y + cvs.height / 2 - 50, 100, 100);
//     });
//
//     $("#select").click(() => {
//         imageName = $("#imagename")[0].value;
//     });
//
//     $("#canvas").click((evt) => {
//         mousePosition.x = evt.offsetX || evt.layerX;
//         mousePosition.y = evt.offsetY || evt.layerY;
//         checkRectangleIndex(mousePosition.x + camera.x, mousePosition.y + camera.y);
//     });
// }
//
//
