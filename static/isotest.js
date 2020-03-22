import {CanvasManager, GameManager, SocketManager, ImageList, IsoGrid} from "./classes.js";

let gameManager;
let cvsManager;
let socketManager;
$(document).ready(onDocLoad);
let imageList;
let isoGrid;
let tempTile;

function onDocLoad() {
    gameManager = new GameManager();
    socketManager = new SocketManager();
    cvsManager = new CanvasManager($("#canvas")[0]);
    cvsManager.configure(window.innerWidth, window.innerHeight, 0, false);
    isoGrid = new IsoGrid(cvsManager.cvs.width / 2, 0, 256, 128, 5, 5, cvsManager, gameManager);
    socketManager.connect();
    socketManager.emit("getimages");
    socketManager.on("images", (data) => {
        gameManager.loadImages(data).then(() => {
            imageList = new ImageList(gameManager.originalImages["sand"], gameManager.images, 0, 0, 40, 40, 5, 18);
            socketManager.emit("offsets");
        });
    });
    socketManager.on("offsets", (data) => {
        gameManager.data.offsets = data;
        window.requestAnimationFrame(animate);
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
        if (cvsManager.leftMouseClicked) {
            if (!imageList.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
                isoGrid.addTile(isoGrid.currentLevel, cvsManager.mouseWorld.x, cvsManager.mouseWorld.y, imageList.selectedImage);
            }
        } else if (cvsManager.rightMouseClicked) {
            isoGrid.removeTile(isoGrid.currentLevel, cvsManager.mouseWorld.x, cvsManager.mouseWorld.y);
        }
    });
    cvsManager.listenFor("contextmenu", (evt) => {
        event.preventDefault();
    });
    cvsManager.listenFor("mousedown", (evt) => {
        if (evt.button === 0) {
            cvsManager.leftMouseClicked = true;
            if (!imageList.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
                isoGrid.addTile(isoGrid.currentLevel, cvsManager.mouseWorld.x, cvsManager.mouseWorld.y, imageList.selectedImage);
            }
        } else if (evt.button === 2) {
            cvsManager.rightMouseClicked = true;
            isoGrid.removeTile(isoGrid.currentLevel, cvsManager.mouseWorld.x, cvsManager.mouseWorld.y);
        }
    });
    cvsManager.listenFor("mouseup", (evt) => {
        cvsManager.leftMouseClicked = false;
        cvsManager.rightMouseClicked = false;
    });
    gameManager.addKeyListener((evt) => {
        if (evt.key === "p") {
            socketManager.emit("isomap", {name: "map", map: isoGrid.grid});
        }
        if (evt.key === "g") {
            isoGrid.showGrid = !isoGrid.showGrid;
        }
        if (evt.key === "q") {
            isoGrid.rotate(-1);
        }
        if (evt.keyCode >= 48 && evt.keyCode <= 57) {
            isoGrid.currentLevel = Number(evt.key)
        }
        if (evt.key === "e") {
            isoGrid.rotate(1);
        }
        if (evt.key === "r") {
            imageList.rotateSelectedImage(1);
        }
    });
    cvsManager.moveCamera(-600, -100);
    isoGrid.fillLevelWithTile(0, "block_E");
    setInterval(selectedImage, 50);
}

function selectedImage() {
    if (imageList) {
        isoGrid.setTempTile(isoGrid.currentLevel, cvsManager.mouseWorld.x, cvsManager.mouseWorld.y, imageList.selectedImage);
    }
}

function animate() {
    cvsManager.clear();
    isoGrid.drawImagesOfGrid();
    isoGrid.drawGridOutline();
    imageList.draw(cvsManager.ctx, cvsManager.camera);
    moveAroundWithCamera(10);
    requestAnimationFrame(animate);
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

