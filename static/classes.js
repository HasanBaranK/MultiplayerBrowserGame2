class Camera {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;
    }
    move(_ctx, x, y){
        this.x+=x;
        this.y+=y;
        _ctx.translate(-x, -y);
    }
    set(_ctx, x, y){
        _ctx.translate(this.x, this.y);
        this.oldX = this.x;
        this.oldY = this.y;
        this.x = x;
        this.y = y;
    }
    restore(_ctx){
        this.x = this.oldX;
        this.y = this.oldY;
        _ctx.translate(-this.x, -this.y);
    }
}

class Animation {
    constructor(img, startColumn, endColumn, row, width, height, cWidth, cHeight, speed){
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
    draw(_ctx, x, y){
        if(this.currentColumn > this.endColumn){
            this.currentColumn = this.startColumn;
        }
        _ctx.drawImage(this.img, this.currentColumn * this.width, this.row * this.height,
            this.width, this.height, x, y, this.cWidth, this.cHeight);
        this.currentTime = Date.now();
        if(this.currentTime > this.animTime){
            this.currentColumn++;
            this.animTime = this.currentTime + this.speed;
        }
    }
    reset(){
        this.currentColumn = this.startColumn;
    }
}

class Player {
    constructor(){
        this.animations = [];
    }
    draw(_ctx, name, x, y){
        this.animations[name].draw(_ctx, x, y);
    }
    addAnimation(name, img, startColumn, endColumn, row, width, height, cWidth, cHeight, speed){
        this.animations[name] = new Animation(img, startColumn, endColumn, row, width, height, cWidth, cHeight, speed);
    }
    resetAnimations(){
        for(let animation in this.animations){
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
        this.gameState =  gameState;
        this.images = images;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
    }
    draw(_ctx, _camera){
        if(this.gameState.inInventory){
            let xIndex = 0;
            let yIndex = 0;
            for (let item in this.gameState.inventory){
                let xReal = this.x + (xIndex * (this.xOff + this.itemFrameImg.width)) + _camera.x;
                let yReal = this.y + (yIndex * (this.yOff + this.itemFrameImg.height)) + _camera.y;
                _ctx.drawImage(this.itemFrameImg, xReal, yReal, this.frameWidth, this.frameHeight);
                _ctx.drawImage(this.images["sword"], xReal, yReal,this.frameWidth, this.frameHeight);
                yIndex++;
                if(yIndex >= this.yMul){
                    yIndex = 0;
                    xIndex++;
                }
            }
            for (;xIndex < this.xMul; xIndex++){
                for (;yIndex < this.yMul; yIndex++){
                    let xReal = this.x + (xIndex * (this.xOff + this.itemFrameImg.width)) + _camera.x;
                    let yReal = this.y + (yIndex * (this.yOff + this.itemFrameImg.height)) + _camera.y;
                    _ctx.drawImage(this.itemFrameImg, xReal, yReal, this.frameWidth, this.frameHeight);
                }
                yIndex = 0;
            }
        }
    }
}

class PopUpManager{
    constructor() {
        this.popUps = [];
    }

    addPopUp(x, y, value){
        let popUp = {x:x,y:y,value:value,timestamp:Date.now(),age:300};
        this.popUps.push(popUp);
    }
    drawPopUps(_ctx){
        let currentTime = Date.now();
        _ctx.font = "20px Georgia";
        _ctx.fillStyle = "red";
        for (let popUpIndex in this.popUps){
            let popUp = this.popUps[popUpIndex];
            if(currentTime - popUp.timestamp < popUp.age){
                _ctx.fillText(popUp.value, popUp.x + 15, popUp.y);
                popUp.y--;
            }
            else{
                this.popUps.splice(popUpIndex, 1);
            }
        }
    }
}

class Bar {
    constructor(img, x, y, value, maxValue){
        this.img = img;
        this.x = x;
        this.y = y;
        this.value = value;
        this.maxValue = maxValue;
    }
    update(value){
        this.value = value;
    }
    draw(_ctx, _camera){
        _ctx.drawImage(this.img, this.x + _camera.x, this.y + _camera.y, this.value / this.maxValue * this.img.width, this.img.height);
    }
}

class ImageList{
    constructor(images, x, y, imgWidth, imgHeight, xLimit, xOff=0, yOff=0) {
        this.images = images;
        this.x = x;
        this.y = y;
        this.imgWidth = imgWidth;
        this.imgHeight = imgHeight;
        this.xLimit = xLimit;
        this.xOff = xOff;
        this.yOff = yOff;
    }
    draw(_ctx, _camera){

        _ctx.fillStyle = "white";
        _ctx.fillRect(this.x - 2 + _camera.x, this.y - 2 + _camera.y, this.xLimit * (this.imgWidth + this.xOff), 20 * (this.imgHeight + this.yOff));
        _ctx.fillStyle = "black";
        let xIndex = 0;
        let yIndex = 0;
        for (let imageName in this.images){
            let image = this.images[imageName];
            let xReal = this.x + (xIndex * (this.xOff + this.imgWidth)) + _camera.x;
            let yReal = this.y + (yIndex * (this.yOff + this.imgHeight)) + _camera.y;
            _ctx.drawImage(image, xReal, yReal, this.imgWidth, this.imgHeight);
            xIndex++;
            if(xIndex == this.xLimit){
                yIndex++;
                xIndex = 0;
            }
        }
        yIndex++;
    }
}
export {
    Camera,
    Inventory,
    Animation,
    Player,
    PopUpManager,
    Bar,
    ImageList
}
