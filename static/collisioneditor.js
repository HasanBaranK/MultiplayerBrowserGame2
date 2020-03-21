class RectangleManager {
    constructor() {
        this.rectangles = [];
        this.selectedRectangleIndex = -1;
    }

    addRectangle(x, y, w, h) {
        this.rectangles.push(new Rectangle(x, y, w, h));
    }

    checkRectangle(x, y) {
        for (let rectangle in this.rectangles) {
            let r = this.rectangles[rectangle];
            if (x > r.x && x < r.x + r.width && y > r.y && y < r.y + r.height) {
                this.selectedRectangleIndex = rectangle;
                break;
            }
        }
    }

    removeSelectedRectangle() {
        this.rectangles.splice(this.selectedRectangleIndex, 1);
        this.selectedRectangleIndex = -1;
    }

    drawRectangles(_ctx) {
        for (let rectangle in this.rectangles) {
            let r = this.rectangles[rectangle];
            if (rectangle === this.selectedRectangleIndex) {
                _ctx.strokeStyle = "yellow";
                _ctx.beginPath();
                _ctx.rect(r.x, r.y, r.width, r.height);
                _ctx.stroke();
                _ctx.strokeStyle = "black"
            }
            _ctx.beginPath();
            _ctx.rect(r.x, r.y, r.width, r.height);
            _ctx.stroke();
        }
    }
}

class Rectangle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

/////////////////////INITIALIZATION CODE//////////////////////////
import {CanvasManager, GameManager, SocketManager, ImageList, Button} from "./classes.js";

let cvsManager;
let gameManager;
let socketManager;

let selectedRectangleIndex = -1;
let rectangleManager = new RectangleManager();
let imageList;
let addRectangleButton, sendToServerButton;
let imageX, imageY;

$(document).ready(init);

function init() {
    cvsManager = new CanvasManager($("#canvas")[0]);
    cvsManager.configure(window.innerWidth, window.innerHeight, 0, false);
    imageX = cvsManager.cvs.width / 2;
    imageY = cvsManager.cvs.height / 2;
    socketManager = new SocketManager();
    gameManager = new GameManager(cvsManager, socketManager);
    socketManager.connect();
    socketManager.on("connect", () => {
        socketManager.emit("getimages");
    });
    socketManager.on("images", (res) => {
        gameManager.loadImages(res).then(() => {
            imageList = new ImageList(gameManager.originalImages["final"], gameManager.images, 0, 0, 40, 40, 5, 18);
            socketManager.emit("newplayer");
            addRectangleButton = new Button(gameManager.images["coin"], 400, 10, 100, 100);
            sendToServerButton = new Button(gameManager.images["send"], 400 + 100 + 20, 10, 100, 100);
            addRectangleButton.addCallbackWhenClicked(() => {
                rectangleManager.addRectangle(cvsManager.cvs.width / 2, cvsManager.cvs.height / 2, 100, 100);
            });
            sendToServerButton.addCallbackWhenClicked(() => {
                if (imageList.selectedImage === "") return;
                let message = {name: imageList.selectedImage, rectangles: []};
                for (let rectangle in rectangleManager.rectangles) {
                    let r = rectangleManager.rectangles[rectangle];
                    let xOffset = r.x - (cvsManager.camera.x + cvsManager.cvs.width / 2);
                    let yOffset = r.y - (cvsManager.camera.y + cvsManager.cvs.height / 2);
                    message.rectangles.push({x: xOffset, y: yOffset, width: r.w, height: r.h})
                }
                console.log(message);
                socketManager.emit("updatecollision", message);
            });
        });
    });
    socketManager.on("joined", (res) => {
        requestAnimationFrame(animate);
        console.log("Joined");
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
        imageList.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
        sendToServerButton.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
        addRectangleButton.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
        rectangleManager.checkRectangle(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
    });
}

function animate() {
    requestAnimationFrame(animate);
    cvsManager.clear();
    sendToServerButton.draw(cvsManager.ctx, cvsManager.camera);
    addRectangleButton.draw(cvsManager.ctx, cvsManager.camera);
    if (imageList.selectedImage) {
        cvsManager.ctx.beginPath();
        cvsManager.ctx.rect(imageX, imageY, gameManager.images[imageList.selectedImage].width, gameManager.images[imageList.selectedImage].height);
        cvsManager.ctx.stroke();
        cvsManager.ctx.drawImage(gameManager.images[imageList.selectedImage], imageX, imageY);
    }
    imageList.draw(cvsManager.ctx, cvsManager.camera);
    rectangleManager.drawRectangles(cvsManager.ctx);
    update();
}

function update() {
    if (rectangleManager.selectedRectangleIndex !== -1) {
        let r = rectangleManager.rectangles[rectangleManager.selectedRectangleIndex];
        if (gameManager.keys["w"]) {
            r.y--;
        }
        if (gameManager.keys["s"]) {
            r.y++;
        }
        if (gameManager.keys["a"]) {
            r.x--;
        }
        if (gameManager.keys["d"]) {
            r.x++;
        }
        if (gameManager.keys["ArrowUp"] && r.height > 5) {
            r.height--;
        }
        if (gameManager.keys["ArrowDown"]) {
            r.height++;
        }
        if (gameManager.keys["ArrowLeft"] && r.width > 5) {
            r.width--;
        }
        if (gameManager.keys["ArrowRight"]) {
            r.width++;
        }
        if (gameManager.keys["x"]) {
            rectangleManager.removeSelectedRectangle();
        }
    }
}