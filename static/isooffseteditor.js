import {CanvasManager, GameManager, SocketManager} from "./classes.js";
import {ImageList} from "./uiclasses.js";
import {IsoGrid} from "./classes.js";

let gameManager;
let cvsManager;
let socketManager;
let isoGrid;
$(document).ready(onDocLoad);
let tileWidth = 256;
let tileHeight = tileWidth / 2;
let imageList;
let xOffset = 0;
let yOffset = 0;
let delayOfOffsetMoving = 10;
let checkTime = Date.now();
let zOffSetMode = false;
let defaultOffset = {x: 0, y: 0, z: 0};
let defaultMode = false;
let folder = 'sand';

function onDocLoad() {
    socketManager = new SocketManager();
    cvsManager = new CanvasManager($("#canvas")[0]);
    gameManager = new GameManager(cvsManager, socketManager);
    gameManager.data.offsets = {};
    cvsManager.configure(window.innerWidth, window.innerHeight, 0, false, true, true);
    isoGrid = new IsoGrid(cvsManager.cvs.width / 2, cvsManager.cvs.height / 2, 256, 128, 1, 1, cvsManager, gameManager);
    isoGrid.showGrid = true;
    socketManager.connect();
    socketManager.emit("getimages");
    socketManager.on("offsets", (data) => {
        gameManager.data.offsets = data;
        window.requestAnimationFrame(animate);
    });
    socketManager.on("images", (data) => {
        gameManager.loadImages(data).then(() => {
            imageList = new ImageList(gameManager.originalImages[folder], gameManager.images, 0, 0, 40, 40, 5, 18);
            socketManager.emit("offsets");
        });
    });
    cvsManager.listenFor("wheel", (evt) => {
        if (evt.deltaY > 0) {
            imageList.scroll(imageList.xLimit);
        } else {
            imageList.scroll(-imageList.xLimit);
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
    cvsManager.listenFor("contextmenu", (evt) => {
        evt.preventDefault();
    });
    cvsManager.listenFor("mousedown", (evt) => {
        if (evt.button === 0) {
            cvsManager.leftMouseClicked = true;
            if (imageList.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
                isoGrid.removeTileGivenGrid(0, 0, 0, imageList.selectedImage);
                isoGrid.addTileGivenGrid(0, 0, 0, imageList.selectedImage);
                if (!gameManager.data.offsets[imageList.selectedImage]) {
                    gameManager.data.offsets[imageList.selectedImage] = {
                        x: defaultOffset.x,
                        y: defaultOffset.y,
                        z: defaultOffset.z
                    };
                    console.log(gameManager.data.offsets[imageList.selectedImage]);
                }
                if (zOffSetMode) {
                    isoGrid.removeTileGivenGrid(1, 0, 0, imageList.selectedImage);
                    isoGrid.addTileGivenGrid(1, 0, 0, imageList.selectedImage);
                } else {
                    isoGrid.removeTileGivenGrid(1, 0, 0, imageList.selectedImage);
                }
            }
        } else if (evt.button === 2) {
            cvsManager.rightMouseClicked = true;
        }

    });
    cvsManager.listenFor("mouseup", (evt) => {
        cvsManager.leftMouseClicked = false;
        cvsManager.rightMouseClicked = false;
    });
    gameManager.addKeyListener((evt) => {
        if (evt.key === "p") {
            socketManager.emit("updateoffsets", {
                name: imageList.selectedImage,
                offsets: gameManager.data.offsets[imageList.selectedImage]
            });
        }
        if (evt.key === "m") {
            console.log(gameManager.data.offsets[imageList.selectedImage]);
            socketManager.emit("updateoffsetsfolder", {
                name: folder,
                offsets: gameManager.data.offsets[imageList.selectedImage]
            })
        }
        if (evt.key === "z") {
            zOffSetMode = !zOffSetMode;
            if (zOffSetMode) {
                isoGrid.addTileGivenGrid(1, 0, 0, imageList.selectedImage);
            } else {
                isoGrid.removeTileGivenGrid(1, 0, 0, imageList.selectedImage);
            }
        }
        if (evt.key === "g") {
            isoGrid.showGrid = !isoGrid.showGrid;
        }
        if (evt.key === "u") {
            defaultMode = !defaultMode;
        }
    });
    cvsManager.moveCamera(0, 0);
}

function animate() {
    requestAnimationFrame(animate);
    let currentTime = Date.now();
    cvsManager.clear();
    isoGrid.drawImagesOfGrid();
    isoGrid.drawGridOutline();
    cvsManager.ctx.font = "24px ariel";
    if (defaultMode) {
        cvsManager.ctx.fillStyle = "rgb(255,0,20)";
    } else {
        cvsManager.ctx.fillStyle = "rgb(0,0,0)";
    }
    if (imageList.selectedImage !== "") {
        cvsManager.ctx.fillText(gameManager.data.offsets[imageList.selectedImage].x + " " + gameManager.data.offsets[imageList.selectedImage].y + " " + gameManager.data.offsets[imageList.selectedImage].z, cvsManager.camera.x + cvsManager.cvs.width / 2, cvsManager.camera.y + 100);
    }
    imageList.draw(cvsManager);
    moveAroundWithCamera(2);
    if (currentTime - checkTime >= delayOfOffsetMoving) {
        moveImage();
        checkTime = currentTime + delayOfOffsetMoving;
    }
    adjustDelayOfOffset();
}

function strokeIsoTile(x, y, w, h) {
    cvsManager.ctx.beginPath();
    cvsManager.ctx.moveTo(x, y);
    cvsManager.ctx.lineTo(x - w / 2, y + h / 2);
    cvsManager.ctx.lineTo(x, y + h);
    cvsManager.ctx.lineTo(x + w / 2, y + h / 2);
    cvsManager.ctx.lineTo(x, y);
    cvsManager.ctx.stroke();
}

function moveAroundWithCamera(speed = 2) {
    if (gameManager.keys["w"]) {
        cvsManager.moveCamera(0, -speed);
    }
    if (gameManager.keys["a"]) {
        cvsManager.moveCamera(-speed, 0);
    }
    if (gameManager.keys["s"]) {
        cvsManager.moveCamera(0, speed);
    }
    if (gameManager.keys["d"]) {
        cvsManager.moveCamera(speed, 0);
    }
}

function adjustDelayOfOffset() {
    if (gameManager.keys["t"]) {
        delayOfOffsetMoving -= 5;
    }
    if (gameManager.keys["y"]) {
        delayOfOffsetMoving += 5;
    }
}

function moveImage() {
    if (gameManager.keys["ArrowLeft"]) {
        gameManager.data.offsets[imageList.selectedImage].x--;
    }
    if (gameManager.keys["ArrowRight"]) {
        gameManager.data.offsets[imageList.selectedImage].x++;
    }
    if (gameManager.keys["ArrowDown"]) {
        if (zOffSetMode) {
            gameManager.data.offsets[imageList.selectedImage].z++;
        } else {
            gameManager.data.offsets[imageList.selectedImage].y++;
        }
    }
    if (gameManager.keys["ArrowUp"]) {
        if (zOffSetMode) {
            gameManager.data.offsets[imageList.selectedImage].z--;
        } else {
            gameManager.data.offsets[imageList.selectedImage].y--;
        }
    }
    if (defaultMode) {
        let a = gameManager.data.offsets[imageList.selectedImage];
        defaultOffset = {x: a.x, y: a.y, z: a.z};
    }
}
