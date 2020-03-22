import {CanvasManager, GameManager, SocketManager, IsoGrid} from "./classes.js";
import {ChatInput, ImageList, Button} from "./uiclasses.js";
import {TextList} from "./uiclasses.js";

let gameManager;
let cvsManager;
let socketManager;
$(document).ready(onDocLoad);
let imageList;
let isoGrid;
let chatInput;
let sendMapButton;
let loadMapButton;
let deleteMapButton;
let textList;

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
            chatInput = new ChatInput( imageList.getWidth() + imageList.x + 10, 10, 200, 20);
            sendMapButton = new Button(gameManager.images["upload2"], chatInput.getWidth() + chatInput.x + 10, 10, 20, 20);
            loadMapButton = new Button(gameManager.images["download"], sendMapButton.x + sendMapButton.width + 10, 10, 20, 20);
            deleteMapButton = new Button(gameManager.images["delete"], loadMapButton.x + loadMapButton.width + 10, 10, 20, 20);
            sendMapButton.addCallbackWhenClicked(uploadMap);
            loadMapButton.addCallbackWhenClicked(loadMap);
            deleteMapButton.addCallbackWhenClicked(deleteMap);
            socketManager.emit("offsets");
            socketManager.emit("getisomaplist");
            textList = new TextList(imageList.getWidth() + imageList.x + 10,chatInput.getHeight() + chatInput.y + 10, 150, 200);
        });
    });
    socketManager.on("offsets", (data) => {
        gameManager.data.offsets = data;
        window.requestAnimationFrame(animate);
    });
    socketManager.on("getisomaplist", (data) => {
        textList.setTexts(data, cvsManager);
    });
    socketManager.on("getisomap", (data) => {
        isoGrid = new IsoGrid(isoGrid.originX, isoGrid.originY, data.tw, data.th, data.maxX, data.maxY, cvsManager, gameManager);
        isoGrid.grid = data.map;
    });
    socketManager.on("sendisomap", () =>{
        socketManager.emit("getisomaplist");
    })
    socketManager.on("deleteisomap", () => {
        socketManager.emit("getisomaplist");
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
    cvsManager.listenFor("contextmenu", () => {
        event.preventDefault();
    });
    cvsManager.listenFor("mousedown", (evt) => {
        if (evt.button === 0) {
            cvsManager.leftMouseClicked = true;
            if (!imageList.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
                isoGrid.addTile(isoGrid.currentLevel, cvsManager.mouseWorld.x, cvsManager.mouseWorld.y, imageList.selectedImage);
            }
            if(chatInput.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)){
                chatInput.setFocus(true);
            }
            deleteMapButton.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
            sendMapButton.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
            loadMapButton.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
            textList.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
        } else if (evt.button === 2) {
            cvsManager.rightMouseClicked = true;
            isoGrid.removeTile(isoGrid.currentLevel, cvsManager.mouseWorld.x, cvsManager.mouseWorld.y);
        }
    });
    cvsManager.listenFor("mouseup", () => {
        cvsManager.leftMouseClicked = false;
        cvsManager.rightMouseClicked = false;
    });
    gameManager.addKeyListener((evt) => {
        if(chatInput.focus && ((evt.keyCode >= 65 && evt.keyCode <= 90) || evt.keyCode === 32 || evt.keyCode === 191 || (evt.keyCode >= 48 && evt.keyCode <= 57))){
            chatInput.addText(evt.key);
            return;
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
        if(evt.key === "Escape"){
            chatInput.setFocus(false);
        }
        if(evt.key === "Backspace"){
            chatInput.removeText();
        }
        if(evt.key === "Enter"){
            uploadMap();
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
    imageList.draw(cvsManager);
    chatInput.draw(cvsManager);
    textList.draw(cvsManager);
    sendMapButton.draw(cvsManager);
    loadMapButton.draw(cvsManager);
    deleteMapButton.draw(cvsManager);
    moveAroundWithCamera(10);
    requestAnimationFrame(animate);
}

function uploadMap(){
    alert("uploaded map to server");
    socketManager.emit("sendisomap",
    {
        name: chatInput.text,
        tw: isoGrid.tw,
        th: isoGrid.th,
        maxX:isoGrid.maxX,
        maxY: isoGrid.maxY,
        rotation: isoGrid.currentRotation,
        map: isoGrid.grid
    });
    console.log(isoGrid);
}

function loadMap(){
    if(textList.selectedTextIndex === -1) return;
    alert("loaded map");
    socketManager.emit("getisomap", {name: textList.getSelectedText()});
}

function deleteMap(){
    if(textList.selectedTextIndex === -1) return;
    alert("deleted map");
    socketManager.emit("deleteisomap", {name: textList.getSelectedText()});
}

function moveAroundWithCamera(speed = 2) {
    if(chatInput.focus) return;

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

