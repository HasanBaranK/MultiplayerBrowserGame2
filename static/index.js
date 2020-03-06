/////////////////////INITIALIZATION CODE//////////////////////////


let cvs, ctx, keys = {}, socket, data = {}, images = {}, imageNames = {}, promises = [], players = {}, me = undefined,
    currentCoords = {}, animator = {state: "idle"}, uis = {}, gameState = {};
let camera = new Camera(0, 0, 0);
let requestId;
let quadTree = {};
let projectiles = [];
let gameTime = 0;
import {Camera, Player, Inventory} from "./classes.js";
import {initializeQuadTree,move,cloneMe} from "./collision.js";
import {calculateAllProjectiles,createProjectile} from "./projectiles.js";

$(document).ready(init);

/////////////////////GAME FUNCTIONS//////////////////////////////

function init() {
    cvs = $("#canvas")[0];
    ctx = cvs.getContext("2d");

    editorConfig(ctx,cvs,camera,requestId);
    configure();

    socket = io.connect('http://localhost:5000');
    socket.on("connect", () => {
        socket.emit("getimages", {});
        socket.on("data", (res) => {
            data = res;
            gameTime = res.gameTime
            quadTree = initializeQuadTree(quadTree,data.collisionMap);
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
            gameTime = res.gameTime;
            projectiles.push(res.projectile)

        });
        socket.on("players", (res) => {
            players = res.players;
            gameTime = res.gameTime;


            if (me === undefined) {
                me = players[socket.id]

            } else {
                let updated = players[socket.id];
                updated.x = me.x;
                updated.y = me.y;
                me = updated;


            }

            socket.emit("players");
        });
    });
}

function configure() {
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    cvs.style.border = 'solid black 1px';

    currentCoords.x = cvs.width / 2 - 16;
    currentCoords.y = cvs.height / 2 - 16;
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
    uis["inventory"] = new Inventory(images["itemframe2"], 16, 200, 4, 4, 10, 5, gameState);
}


function update() {
    cameraFollow();
    ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
    drawTiles(14, 16, 64);
    //drawMapBack(14, 16, 64);
    drawPlayer();
    drawMapFront(14, 16, 64);
    calculateAllProjectiles(projectiles,gameTime,quadTree,players)
    for (let ui in uis) {
        uis[ui].draw(ctx, camera);
    }
    //Debug

    //drawPlayerCollision()
    drawPlayers();
    //drawMapCollision(data.collisionMap)
    //drawPlayerCollision()
}

setInterval(function () {
    doTheMovement();
    gameTime = updateGameTime(gameTime,1);

}, 1000/60);

function doTheMovement() {
    let locationChanged = false;

    let step = 8;
    if (keys["a"]) {
        locationChanged = true;
        if (move(me,0, quadTree, 2)) {
        }

    }
    if (keys["d"]) {
        locationChanged = true;
        if (move(me,1, quadTree, 2)) {
        }

    }
    if (keys["s"]) {
        locationChanged = true;
        if (move(me,2, quadTree, 2)) {
        }
    }
    if (keys["w"]) {
        locationChanged = true;
        if (move(me,3, quadTree, 2)) {
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

        socket.emit("movement", {"w": keys["w"], "a": keys["a"], "s": keys["s"], "d": keys["d"], "x": me.x, "y": me.y});
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

function drawPlayers(){
    for (let playerIndex in players){
        let player = players[playerIndex];
        if(playerIndex !== socket.id){
            ctx.drawImage(images["idle"], 0, 0, 32, 32, player.x, player.y, 32, 32);
        }
    }
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
   createProjectile(projectiles,"arrow2",me.x,me.y,me.x,me.y,event.clientX+camera.x,event.clientY+camera.y,10 ,quadTree,players,gameTime)
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
    let blockX = meX - gridSize * Xsize
    if (blockX < 0) {
        blockX = 0;
    }
    for (; blockX <= meX + gridSize * Xsize; blockX += gridSize) {
        if (data.map[blockX] != null) {

            let blockY = meY - gridSize * Ysize
            if (blockY < 0) { blockY = 0;}
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
    if (key.key === "i") {
        gameState.inInventory = !gameState.inInventory;
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
function updateGameTime(gameTime,speed) {
    gameTime = gameTime + speed;
    return gameTime
}
function sendProjectileServer(projectile) {
    //console.log("Sending to server")
    //console.log(projectile)
    socket.emit("projectile",projectile)
}
function drawImageRotation(image, x, y, scale, rotation,sin,cos) {
    ctx.save()
    ctx.translate(x, y)
    //ctx.rotate(-projectiles[projectile].angle)
    //ctx.setTransform(scale, 0, 0, scale, x, y); // sets scale and origin
    if(Math.asin(sin) <0){
        ctx.rotate(-Math.acos(cos));
    } else {
        ctx.rotate(Math.acos(cos));
    }
    /*console.log("arccos: "+radians_to_degrees(Math.acos(cos)));
    console.log("arcsin: "+radians_to_degrees(Math.asin(sin)));
    console.log("arctan: "+radians_to_degrees(Math.atan(sin/cos)));*/
    ctx.drawImage(images[image],0,0);
    ctx.restore()
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";

    //ctx.rotate(Math.atan(rotation));
    ctx.fillRect(x+16, y+9, 7, 5);

    ctx.restore()
}
function radians_to_degrees(radians)
{
    var pi = Math.PI;
    return radians * (180/pi);
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
            $("#editor")[0].innerText = "Editor";
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
    drawImageRotation
}
