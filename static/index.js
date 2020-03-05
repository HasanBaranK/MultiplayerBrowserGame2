/////////////////////INITIALIZATION CODE//////////////////////////


let cvs, ctx, keys = {}, socket, data = {}, images = {}, imageNames = {}, promises = [], players = {}, me = undefined,
    currentCoords = {}, animator = {state: "idle"}, uis = {}, gameState = {};
let camera = new Camera(0, 0, 0);
let requestId;
let quadTree = {};
import {Camera, Player, Inventory} from "./classes.js";
import {initializeQuadTree,move} from "./collision.js";
import {editorConfig} from "./editor.js";
import {drawPlayerCollision,drawMapCollision} from "./debug.js";

$(document).ready(init);

/////////////////////GAME FUNCTIONS//////////////////////////////

function init() {
    cvs = $("#canvas")[0];
    ctx = cvs.getContext("2d");

    editorConfig(ctx,camera,requestId);
    configure();

    socket = io.connect('http://localhost:5000');
    socket.on("connect", () => {
        socket.emit("getimages", {});
        socket.on("data", (res) => {
            data = res;
            console.log(data.map)
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
        socket.on("players", (res) => {
            players = res;


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
    for (let ui in uis) {
        uis[ui].draw(ctx, camera);
    }
    //Debug
    //drawPlayerCollision()
    //drawMapCollision(data.collisionMap)
}

setInterval(function () {
    doTheMovement();
}, 20);

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

export {
    animate
}
