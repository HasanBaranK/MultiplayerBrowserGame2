class Camera {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;
    }

    move(_ctx, x, y) {
        this.x += x;
        this.y += y;
        _ctx.translate(-x, -y);
    }

    restore(_ctx) {
        this.x = this.oldX;
        this.y = this.oldY;
        _ctx.translate(-this.x, -this.y);
    }
}

class Animation {
    constructor(img, startColumn, endColumn, row, width, height, cWidth, cHeight, speed) {
        this.img = img;
        this.startColumn = startColumn;
        this.endColumn = endColumn;
        this.row = row;
        this.width = width;
        this.height = height;
        this.cWidth = cWidth;
        this.cHeight = cHeight;
        this.speed = speed;

        this.currentColumn = this.startColumn;
        this.animTime = Date.now();
        this.currentTime = Date.now();
    }

    draw(_ctx, x, y) {
        if (this.currentColumn > this.endColumn) {
            this.currentColumn = this.startColumn;
        }
        _ctx.drawImage(this.img, this.currentColumn * this.width, this.row * this.height,
            this.width, this.height, x, y, this.cWidth, this.cHeight);
        this.currentTime = Date.now();
        if (this.currentTime > this.animTime) {
            this.currentColumn++;
            this.animTime = this.currentTime + this.speed;
        }
    }

    reset() {
        this.currentColumn = this.startColumn;
    }
}

class Player {
    constructor() {
        this.animations = [];
    }

    draw(_ctx, name, x, y) {
        this.animations[name].draw(_ctx, x, y);
    }

    addAnimation(name, img, startColumn, endColumn, row, width, height, cWidth, cHeight, speed) {
        this.animations[name] = new Animation(img, startColumn, endColumn, row, width, height, cWidth, cHeight, speed);
    }

    resetAnimations() {
        for (let animation in this.animations) {
            this.animations[animation].reset();
        }
    }
}

class Inventory {
    constructor(itemFrameImg, x, y, xOff, yOff, xMul, yMul, gameState, images, frameWidth = itemFrameImg.width, frameHeight = itemFrameImg.height) {
        this.itemFrameImg = itemFrameImg;
        this.x = x;
        this.y = y;
        this.xOff = xOff;
        this.yOff = yOff;
        this.xMul = xMul;
        this.yMul = yMul;
        this.gameState = gameState;
        this.images = images;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
    }

    draw(_ctx, _camera) {
        if (this.gameState.inInventory) {
            let xIndex = 0;
            let yIndex = 0;
            for (let item in this.gameState.inventory) {
                let xReal = this.x + (xIndex * (this.xOff + this.itemFrameImg.width)) + _camera.x;
                let yReal = this.y + (yIndex * (this.yOff + this.itemFrameImg.height)) + _camera.y;
                _ctx.drawImage(this.itemFrameImg, xReal, yReal, this.frameWidth, this.frameHeight);
                _ctx.drawImage(this.images["sword"], xReal, yReal, this.frameWidth, this.frameHeight);
                yIndex++;
                if (yIndex >= this.yMul) {
                    yIndex = 0;
                    xIndex++;
                }
            }
            for (; xIndex < this.xMul; xIndex++) {
                for (; yIndex < this.yMul; yIndex++) {
                    let xReal = this.x + (xIndex * (this.xOff + this.itemFrameImg.width)) + _camera.x;
                    let yReal = this.y + (yIndex * (this.yOff + this.itemFrameImg.height)) + _camera.y;
                    _ctx.drawImage(this.itemFrameImg, xReal, yReal, this.frameWidth, this.frameHeight);
                }
                yIndex = 0;
            }
        }
    }
}

class PopUpManager {
    constructor() {
        this.popUps = [];
    }

    addPopUp(x, y, value) {
        let popUp = {x: x, y: y, value: value, timestamp: Date.now(), age: 300};
        this.popUps.push(popUp);
    }

    drawPopUps(_ctx) {
        let currentTime = Date.now();
        _ctx.font = "20px Georgia";
        _ctx.fillStyle = "red";
        for (let popUpIndex in this.popUps) {
            let popUp = this.popUps[popUpIndex];
            if (currentTime - popUp.timestamp < popUp.age) {
                _ctx.fillText(popUp.value, popUp.x + 15, popUp.y);
                popUp.y--;
            } else {
                this.popUps.splice(popUpIndex, 1);
            }
        }
    }
}

class Bar {
    constructor(img, x, y, value, maxValue) {
        this.img = img;
        this.x = x;
        this.y = y;
        this.value = value;
        this.maxValue = maxValue;
    }

    update(value) {
        this.value = value;
    }

    draw(_ctx, _camera) {
        _ctx.drawImage(this.img, this.x + _camera.x, this.y + _camera.y, this.value / this.maxValue * this.img.width, this.img.height);
    }
}

class ImageList {
    constructor(images, x, y, imgWidth, imgHeight, xLimit, xOff = 0, yOff = 0) {
        this.images = images;
        this.x = x;
        this.y = y;
        this.imgWidth = imgWidth;
        this.imgHeight = imgHeight;
        this.xLimit = xLimit;
        this.xOff = xOff;
        this.yOff = yOff;
    }

    draw(_ctx, _camera) {

        _ctx.fillStyle = "white";
        _ctx.fillRect(this.x - 2 + _camera.x, this.y - 2 + _camera.y, this.xLimit * (this.imgWidth + this.xOff), 20 * (this.imgHeight + this.yOff));
        _ctx.fillStyle = "black";
        let xIndex = 0;
        let yIndex = 0;
        for (let imageName in this.images) {
            let image = this.images[imageName];
            let xReal = this.x + (xIndex * (this.xOff + this.imgWidth)) + _camera.x;
            let yReal = this.y + (yIndex * (this.yOff + this.imgHeight)) + _camera.y;
            _ctx.drawImage(image, xReal, yReal, this.imgWidth, this.imgHeight);
            xIndex++;
            if (xIndex == this.xLimit) {
                yIndex++;
                xIndex = 0;
            }
        }
        yIndex++;
    }
}

class SocketManager {
    constructor() {
        this.socket = {};
    }

    connect() {
        this.socket = io.connect({reconnectionDelay: 1000, reconnection: false});
    }

    emit(name, data = {}) {
        this.socket.emit(name, data);
    }

    on(name, callback = (data) => {
        console.log(data)
    }) {
        this.socket.on(name, callback);
    }
}

class GameManager {
    constructor() {
        this.images = [];
        this.keys = [];
        this.promises = [];
        this.mouseClicked = false;
        $(document).keydown((evt) => {
            this.keys[evt.key] = true;
        });
        $(document).keyup((evt) => {
            this.keys[evt.key] = false;
        });
    }

    loadImages(folders) {
        for (let folder in folders) {
            for (let image in folders[folder]) {
                this.promises.push(new Promise((resolve, reject) => {
                    let img = new Image();
                    img.onload = function () {
                        resolve('resolved')
                    };
                    img.src = './images/' + folder + '/' + folders[folder][image];
                    this.images[folders[folder][image].split('.png')[0]] = img
                }))
            }
        }
        return Promise.all(this.promises)
    }

}

class CanvasManager {
    constructor(cvs) {
        this.cvs = cvs;
        this.ctx = this.cvs.getContext("2d");
        this.camera = new Camera(0, 0);
        this.mouseWorld = {};
        this.mouseScreen = {};
    }

    clear() {
        this.ctx.clearRect(this.camera.x, this.camera.y, this.cvs.width, this.cvs.height);
    }

    listenFor(eventName, callback) {
        this.cvs.addEventListener(eventName, callback);
    }

    configure(w, h, z, border, listenForMouseMove, listenForMouseClick) {
        this.cvs.width = w;
        this.cvs.height = h;
        this.cvs.style.zIndex = z;
        if (border) {
            this.cvs.style.border = 'solid black 1px';
        }
        this.cvs.style.position = "absolute";
    }

    moveCamera(x, y) {
        this.camera.move(this.ctx, x, y);
    }
}

export {
    Camera,
    Inventory,
    Animation,
    Player,
    PopUpManager,
    Bar,
    ImageList,
    CanvasManager,
    GameManager,
    SocketManager
}
