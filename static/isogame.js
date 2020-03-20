import {CanvasManager, GameManager, IsoGrid, SocketManager, Player} from "./classes.js";

let cvsManager, gameManager, socketManager, isoGrid;


$(document).ready(init);

function init() {
    socketManager = new SocketManager();
    cvsManager = new CanvasManager($("#canvas")[0]);
    gameManager = new GameManager(cvsManager, socketManager);
    cvsManager.configure(window.innerWidth, window.innerHeight, 0, false, true, true);
    isoGrid = new IsoGrid(cvsManager.cvs.width / 2, 0, 256, 128, 5, 5, cvsManager, gameManager);
    socketManager.connect();
    socketManager.on("connect", () => {
        socketManager.emit("getimages");
    });
    socketManager.on("data", (data) => {
        gameManager.data = data;
        socketManager.emit("newplayer");
    });
    socketManager.on("joined", () => {
        window.requestAnimationFrame(animate);
    });
    socketManager.on("images", (images) => {
        gameManager.loadImages(images).then(() => {
            socketManager.emit("getdata");
        });
    });
    socketManager.on("players", (data) => {
        for (let playerKey in data.players) {
            let player = data.players[playerKey];
            if (!gameManager.players[playerKey]) {
                gameManager.addPlayer(new Player(playerKey, player.x, player.y, player));
                setUpPlayerAnimations(gameManager.getPlayer(playerKey));
            }
        }
    });
    gameManager.addKeyListener((evt) => {
        if (evt.key === "g") {
            isoGrid.showGrid = !isoGrid.showGrid;
        }
        if(evt.key === "q"){
            isoGrid.rotate(-1);
        }
        if(evt.key === "e"){
            isoGrid.rotate(1)
        }
    });
    cvsManager.listenFor("mousemove", (evt) => {
        let x = evt.offsetX || evt.layerX;
        let y = evt.offsetY || evt.layerY;
        cvsManager.mouseWorld.x = x + cvsManager.camera.x;
        cvsManager.mouseWorld.y = y + cvsManager.camera.y;
        cvsManager.mouseScreen.x = x;
        cvsManager.mouseScreen.y = y;
    });
    cvsManager.listenFor("mousedown", (evt) => {
        let iso = isoGrid.twoDToIso(cvsManager.mouseWorld.x, cvsManager.mouseWorld.y);
        console.log(iso.gridX * isoGrid.tw + " " + iso.gridY * isoGrid.th);
    });
    isoGrid.fillLevelWithTile(0, "block_East");
}

function setUpPlayerAnimations(player) {
    let speed = 100;
    player.addAnimation("runUP", gameManager.images["run"], 0, 7, 0, 32, 32, 32, 32, speed);
    player.addAnimation("runUPRIGHT", gameManager.images["run"], 0, 7, 1, 32, 32, 32, 32, speed);
    player.addAnimation("runRIGHT", gameManager.images["run"], 0, 7, 2, 32, 32, 32, 32, speed);
    player.addAnimation("runDOWNRIGHT", gameManager.images["run"], 0, 7, 3, 32, 32, 32, 32, speed);
    player.addAnimation("runDOWN", gameManager.images["run"], 0, 7, 4, 32, 32, 32, 32, speed);
    player.addAnimation("runDOWNLEFT", gameManager.images["run"], 0, 7, 5, 32, 32, 32, 32, speed);
    player.addAnimation("runLEFT", gameManager.images["run"], 0, 7, 6, 32, 32, 32, 32, speed);
    player.addAnimation("runUPLEFT", gameManager.images["run"], 0, 7, 7, 32, 32, 32, 32, speed);
    player.addAnimation("idle", gameManager.images["idle"], 0, 7, 4, 32, 32, 32, 32, 120);
}

function animate() {
    requestAnimationFrame(animate);
    cvsManager.clear();
    isoGrid.drawImagesOfGrid();
    isoGrid.drawGridOutline();
    for (let playerKey in gameManager.players) {
        let player = gameManager.players[playerKey];
        let x = player.x;
        let y = player.y;
        if (playerKey === socketManager.socket.id) {
            cvsManager.followWithCamera(x, y, cvsManager.cvs.width / 2, cvsManager.cvs.height / 2);
        }
        determineAnimationForPlayer(player);
    }
    move(3);
}

function determineAnimationForPlayer(player) {
    if (gameManager.keys["w"] && gameManager.keys["d"]) {
        player.draw(cvsManager.ctx, "runUPRIGHT");
    } else if (gameManager.keys["w"] && gameManager.keys["a"]) {
        player.draw(cvsManager.ctx, "runUPLEFT");
    } else if (gameManager.keys["s"] && gameManager.keys["d"]) {
        player.draw(cvsManager.ctx, "runDOWNRIGHT");
    } else if (gameManager.keys["s"] && gameManager.keys["a"]) {
        player.draw(cvsManager.ctx, "runDOWNLEFT");
    } else if (gameManager.keys["w"]) {
        player.draw(cvsManager.ctx, "runUP");
    } else if (gameManager.keys["d"]) {
        player.draw(cvsManager.ctx, "runRIGHT");
    } else if (gameManager.keys["s"]) {
        player.draw(cvsManager.ctx, "runDOWN");
    } else if (gameManager.keys["a"]) {
        player.draw(cvsManager.ctx, "runLEFT");
    } else {
        player.draw(cvsManager.ctx, "idle");
    }
}

function move(speed) {
    let player = gameManager.getPlayer();
    let movedX = 0;
    let movedY = 0;
    if (gameManager.keys["w"]) {
        player.move(0, -speed);
        movedY -= speed;
    }
    if (gameManager.keys["a"]) {
        player.move(-speed, 0);
        movedX -= speed;
    }
    if (gameManager.keys["s"]) {
        player.move(0, speed);
        movedY += speed;
    }
    if (gameManager.keys["d"]) {
        player.move(speed, 0);
        movedX += speed;
    }
    let iso = isoGrid.twoDToIso(player.x + 16, player.y + 16);
    if (iso.gridX >= isoGrid.maxX || iso.gridY >= isoGrid.maxY || iso.gridX < 0 || iso.gridY < 0) {
        player.move(-movedX, -movedY);
    }
}
