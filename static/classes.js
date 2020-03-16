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

class AnimationFinal {
    constructor(img, startColumn, endColumn, row, width, height, cWidth, cHeight, speed, x, y) {
        this.x = x;
        this.y = y;
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

    draw(_ctx, x = this.x, y = this.y) {
        if (this.currentColumn > this.endColumn) {
            this.currentColumn = this.startColumn;
            return true;
        }
        _ctx.drawImage(this.img, this.currentColumn * this.width, this.row * this.height,
            this.width, this.height, x, y, this.cWidth, this.cHeight);
        this.currentTime = Date.now();
        if (this.currentTime > this.animTime) {
            this.currentColumn++;
            this.animTime = this.currentTime + this.speed;
        }
        return false;
    }

    reset() {
        this.currentColumn = this.startColumn;
    }
}

class AnimationFinalMultipleFiles {
    constructor(baseImageName, startColumn, endColumn, speed, x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.imgs = {};
        this.startColumn = startColumn;
        this.endColumn = endColumn;
        this.speed = speed;
        this.baseImageName = baseImageName;
        this.currentColumn = this.startColumn;
        this.animTime = Date.now();
        this.currentTime = Date.now();
    }

    draw(_ctx, x = this.x, y = this.y) {
        if (this.currentColumn > this.endColumn) {
            this.currentColumn = this.startColumn;
            return true;
        }
        _ctx.drawImage(this.imgs[this.baseImageName + " (" + this.currentColumn + ")"], x, y);
        this.currentTime = Date.now();
        if (this.currentTime > this.animTime) {
            this.currentColumn++;
            this.animTime = this.currentTime + this.speed;
        }
        return false;
    }

    reset() {
        this.currentColumn = this.startColumn;
    }

    addImage(img, name){
        this.imgs[name] = img;
    }
}

class ChatInput{
    constructor(x, y, width, height, blinkSpeed = 200, lengthOfStringToShow = 50, maximumTextLength = 60) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = "";
        this.focus = false;
        this.blinkSpeed = blinkSpeed;
        this.animTime = Date.now();
        this.currentTime = Date.now();
        this.blinkOn = false;
        this.lengthOfStringToShow = lengthOfStringToShow;
        this.textToShow = this.text;
        this.maximumTextLength = maximumTextLength;
    }
    draw(_ctx, _camera){
        this.getTextToShow();
        _ctx.beginPath();
        _ctx.rect(_camera.x + this.x, _camera.y + this.y, this.width, this.height);
        _ctx.stroke();
        _ctx.fillStyle = "rgba(255,255,255,1)";
        _ctx.fillRect(_camera.x + this.x, _camera.y + this.y, this.width, this.height);
        _ctx.fillStyle = "rgba(0,0,0,1)";
        _ctx.font = "16px ariel";
        _ctx.fillText(this.textToShow,_camera.x + this.x, _camera.y + this.y + 20);
        if(this.focus){
            if(this.blinkOn){
                _ctx.fillStyle = "rgb(10,8,6)";
                _ctx.fillRect(_camera.x + this.x + 2 + (this.textToShow.length*7), _camera.y + this.y + 2, 2, this.height - 4);
            }
            this.currentTime = Date.now();
            if (this.currentTime > this.animTime) {
                this.blinkOn = !this.blinkOn;
                this.animTime = this.currentTime + this.blinkSpeed;
            }
        }
    }
    getTextToShow(){
        if(this.text.length < this.lengthOfStringToShow){
            this.textToShow = this.text.substring(0, this.text.length);
        }
        this.textToShow = this.text.substring(this.text.length - this.lengthOfStringToShow, this.text.length);
    }
    setFocus(focus){
        this.blinkOn = !!focus;
        this.focus = focus;
    }
    addText(text){
        if(this.text.length < this.maximumTextLength){
            this.text = this.text + text;
        }
    }
    removeText(){
        this.text = this.text.substring(0, this.text.length - 1);
    }
    check(x, y){
        return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
    }
    setText(text){
        this.text = text;
    }
    move(x, y){
        this.x+=x;
        this.y+=y;
    }
    scale(w, h){
        this.width += w;
        this.height += h;
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
    constructor(images, x, y, imgWidth, imgHeight, xLimit, yLimit, xOff = 0, yOff = 0) {
        this.images = images;
        this.imagesKeys = Object.keys(this.images);
        this.x = x;
        this.y = y;
        this.imgWidth = imgWidth;
        this.imgHeight = imgHeight;
        this.xLimit = xLimit;
        this.yLimit = yLimit;
        this.xOff = xOff;
        this.yOff = yOff;
        this.startIndex = 0;
    }

    draw(_ctx, _camera) {
        _ctx.fillStyle = "white";
        _ctx.fillRect(this.x + _camera.x, this.y + _camera.y, this.xLimit * (this.imgWidth + this.xOff), (this.yLimit)*(this.imgHeight + this.yOff));
        _ctx.fillStyle = "black";
        let xIndex = 0;
        let yIndex = 0;
        for (let i = this.startIndex; i < this.imagesKeys.length; i++){
            let imageName = this.imagesKeys[i];
            let image = this.images[imageName];
            let xReal = this.x + (xIndex * (this.xOff + this.imgWidth)) + _camera.x;
            let yReal = this.y + (yIndex * (this.yOff + this.imgHeight)) + _camera.y;
            _ctx.drawImage(image, xReal, yReal, this.imgWidth, this.imgHeight);
            xIndex++;
            if (xIndex === this.xLimit) {
                yIndex++;
                xIndex = 0;
            }
            if(yIndex === this.yLimit){
                break;
            }
        }
    }
    check(x, y){
        let xIndex = Math.floor(x/(this.imgWidth + this.xOff));
        let yIndex = Math.floor(y/(this.imgHeight + this.yOff));
        if(xIndex > this.xLimit || yIndex > this.yLimit) return "";
        return (this.imagesKeys[xIndex + yIndex*this.xLimit + this.startIndex])
    }
    scroll(dir){
        if(this.startIndex + dir >= 0 && this.startIndex + dir < this.imagesKeys.length){
            this.startIndex+=dir;
        }
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
        this.keyEventListeners = [];
        $(document).keydown((evt) => {
            this.keys[evt.key] = true;
            this.keyEventListeners.forEach((callback)=>{
                callback(evt);
            });
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

    addKeyListener(keyEventListener){
        this.keyEventListeners.push(keyEventListener);
    }

}

class CanvasManager {
    constructor(cvs) {
        this.cvs = cvs;
        this.ctx = this.cvs.getContext("2d");
        this.camera = new Camera(0, 0);
        this.mouseWorld = {};
        this.mouseScreen = {};
        this.rightMouseClicked = false;
        this.leftMouseClicked = false;
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
    AnimationFinal,
    AnimationFinalMultipleFiles,
    Player,
    PopUpManager,
    Bar,
    ImageList,
    CanvasManager,
    GameManager,
    SocketManager,
    ChatInput
}
