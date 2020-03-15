import {CanvasManager, GameManager, SocketManager} from "./classes.js";

let gameManager;
let cvsManager;
let socketManager;
$(document).ready(onDocLoad);


function onDocLoad() {
    gameManager = new GameManager();
    socketManager = new SocketManager();
    cvsManager = new CanvasManager($("#canvas")[0]);
    cvsManager.configure(window.innerWidth, window.innerHeight, 0, false, true, true);
    socketManager.connect();
    socketManager.emit("getimages");
    socketManager.on("images", (data) => {
        gameManager.loadImages(data).then(() => {
            window.requestAnimationFrame(animate);
        });
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
        cvsManager.mouseClicked = true;
    });
    cvsManager.listenFor("mouseup", (evt) => {
        cvsManager.mouseClicked = false;
    });
}

function animate() {
    requestAnimationFrame(animate);
    cvsManager.clear();
    moveAroundWithCamera();
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

