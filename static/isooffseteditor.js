import {CanvasManager, GameManager, SocketManager, ImageList} from "./classes.js";

let gameManager;
let cvsManager;
let socketManager;
$(document).ready(onDocLoad);
let tileWidth = 256;
let tileHeight = tileWidth / 2;
let imageList;
let imageToDraw = "";
let xOffset = 0;
let yOffset = 0;
let delayOfOffsetMoving = 10;
let checkTime = Date.now();

function onDocLoad() {
    gameManager = new GameManager();
    socketManager = new SocketManager();
    cvsManager = new CanvasManager($("#canvas")[0]);
    cvsManager.configure(window.innerWidth, window.innerHeight, 0, false, true, true);
    socketManager.connect();
    socketManager.emit("getimages");
    socketManager.on("images", (data) => {
        gameManager.loadImages(data).then(() => {
            imageList = new ImageList(gameManager.originalImages["sand"], gameManager.images, 0, 0, 40, 40, 5, 18);
            window.requestAnimationFrame(animate);
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
        event.preventDefault();
    });
    cvsManager.listenFor("mousedown", (evt) => {
        if (evt.button === 0) {
            cvsManager.leftMouseClicked = true;
            let imageToChecked = imageList.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
            if(imageToChecked){
                imageToDraw = imageList.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
            }
        } else if (evt.button === 2) {
            cvsManager.rightMouseClicked = true;
        }

    });
    cvsManager.listenFor("mouseup", (evt) => {
        cvsManager.leftMouseClicked = false;
        cvsManager.rightMouseClicked = false;
    });
    gameManager.addKeyListener((evt)=>{
        if(evt.key === "p"){
            socketManager.emit("updateoffsets", {name: imageToDraw, offsets: {x:xOffset, y:yOffset}});
        }
    });
    cvsManager.moveCamera(0, 0);
}

function animate() {
    requestAnimationFrame(animate);
    let currentTime = Date.now();
    cvsManager.clear();
    if(gameManager.images[imageToDraw]){
        cvsManager.ctx.drawImage(gameManager.images[imageToDraw], cvsManager.cvs.width / 2 + xOffset, cvsManager.cvs.height/2 + yOffset);
    }
    cvsManager.ctx.font = "24px ariel";
    cvsManager.ctx.fillText(xOffset + " " + yOffset, cvsManager.camera.x + cvsManager.cvs.width/2, cvsManager.camera.y + 100);
    strokeIsoTile(cvsManager.cvs.width / 2, cvsManager.cvs.height/2, tileWidth, tileHeight);
    imageList.draw(cvsManager.ctx, cvsManager.camera);
    moveAroundWithCamera(1);
    if(currentTime - checkTime >= delayOfOffsetMoving){
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

function adjustDelayOfOffset(){
    if(gameManager.keys["t"]){
        delayOfOffsetMoving--;
    }
    if(gameManager.keys["y"]){
        delayOfOffsetMoving++;
    }
}

function moveImage(){
    if(gameManager.keys["ArrowLeft"]){
        xOffset--;
    }
    if(gameManager.keys["ArrowRight"]){
        xOffset++;
    }
    if(gameManager.keys["ArrowDown"]){
        yOffset++;
    }
    if(gameManager.keys["ArrowUp"]){
        yOffset--;
    }
}
