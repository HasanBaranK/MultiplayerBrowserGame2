import {CanvasManager, GameManager, SocketManager, IsometricGridDrawer} from "./classes.js";

let gameManager;
let cvsManager;
let socketManager;
let xImage = 0;
let yImage = 0;

$(document).ready(onDocLoad);


function onDocLoad() {
    gameManager = new GameManager();
    socketManager = new SocketManager();
    cvsManager = new CanvasManager($("#canvas")[0]);
    cvsManager.configure(window.innerWidth, window.innerHeight, 0, false);
    cvsManager.listenFor("mousedown", (evt) => {
        let x = evt.offsetX || evt.layerX;
        let y = evt.offsetY || evt.layerY;
        if (evt.button === 0) {
            console.log(x + " " + y)
        }
    });
    socketManager.connect();
    socketManager.emit("getimages");
    socketManager.on("images", (data) => {
        gameManager.loadImages(data).then(() => {
            window.requestAnimationFrame(animate);
        });
    });
    cvsManager.moveCamera(-cvsManager.cvs.width / 2, -cvsManager.cvs.height / 2)
}

function animate() {
    requestAnimationFrame(animate);
    cvsManager.clear();
    moveAroundWithCamera();
    cvsManager.ctx.drawImage(gameManager.images["road_E"], xImage, yImage);
    cvsManager.ctx.beginPath();
    cvsManager.ctx.rect(xImage, yImage, gameManager.images["road_E"].width, gameManager.images["road_E"].height);
    cvsManager.ctx.stroke();
    IsometricGridDrawer.drawIsoTile(cvsManager, 0, 0, 128);
}

function moveAroundWithCamera(speed = 2) {
    if (gameManager.keys["w"]) {
        yImage--;
    }
    if (gameManager.keys["a"]) {
        xImage--;
    }
    if (gameManager.keys["s"]) {
        yImage++;
    }
    if (gameManager.keys["d"]) {
        xImage++;
    }
    if(gameManager.keys["p"]){
        console.log(xImage + " " + yImage)
    }
    // if (gameManager.keys["i"]) {
    //     cvsManager.ctx.scale(1.1, 1.1);
    // }
    // if (gameManager.keys["o"]) {
    //     cvsManager.ctx.scale(0.9, 0.9);
    // }
}

function getRndColor() {
    var r = 255 * Math.random() | 0,
        g = 255 * Math.random() | 0,
        b = 255 * Math.random() | 0;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}