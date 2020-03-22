class ChatInput {
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

    draw(cvsManager) {
        this.getTextToShow();
        cvsManager.ctx.beginPath();
        cvsManager.ctx.rect(cvsManager.camera.x + this.x, cvsManager.camera.y + this.y, this.width, this.height);
        cvsManager.ctx.stroke();
        cvsManager.ctx.fillStyle = "rgba(255,255,255,1)";
        cvsManager.ctx.fillRect(cvsManager.camera.x + this.x, cvsManager.camera.y + this.y, this.width, this.height);
        cvsManager.ctx.fillStyle = "rgba(0,0,0,1)";
        cvsManager.ctx.font = "16px ariel";
        cvsManager.ctx.fillText(this.textToShow, cvsManager.camera.x + this.x, cvsManager.camera.y + this.y + 20);
        if (this.focus) {
            if (this.blinkOn) {
                cvsManager.ctx.fillStyle = "rgb(10,8,6)";
                cvsManager.ctx.fillRect(cvsManager.camera.x + this.x + 2 + (this.textToShow.length * 7), cvsManager.camera.y + this.y + 2, 2, this.height - 4);
            }
            this.currentTime = Date.now();
            if (this.currentTime > this.animTime) {
                this.blinkOn = !this.blinkOn;
                this.animTime = this.currentTime + this.blinkSpeed;
            }
        }
    }

    getTextToShow() {
        if (this.text.length < this.lengthOfStringToShow) {
            this.textToShow = this.text.substring(0, this.text.length);
        }
        this.textToShow = this.text.substring(this.text.length - this.lengthOfStringToShow, this.text.length);
    }

    setFocus(focus) {
        this.blinkOn = !!focus;
        this.focus = focus;
    }

    addText(text) {
        if (this.text.length < this.maximumTextLength) {
            this.text = this.text + text;
        }
    }

    removeText() {
        this.text = this.text.substring(0, this.text.length - 1);
    }

    check(x, y) {
        return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
    }

    setText(text) {
        this.text = text;
    }

    move(x, y) {
        this.x += x;
        this.y += y;
    }

    scale(w, h) {
        this.width += w;
        this.height += h;
    }

    getWidth() {
        return this.width;
    }

    getHeight() {
        return this.height;
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

    draw(cvsManager) {
        if (this.gameState.inInventory) {
            let xIndex = 0;
            let yIndex = 0;
            for (let item in this.gameState.inventory) {
                let xReal = this.x + (xIndex * (this.xOff + this.itemFrameImg.width)) + cvsManager.camera.x;
                let yReal = this.y + (yIndex * (this.yOff + this.itemFrameImg.height)) + cvsManager.camera.y;
                cvsManager.ctx.drawImage(this.itemFrameImg, xReal, yReal, this.frameWidth, this.frameHeight);
                cvsManager.ctx.drawImage(this.images["sword"], xReal, yReal, this.frameWidth, this.frameHeight);
                yIndex++;
                if (yIndex >= this.yMul) {
                    yIndex = 0;
                    xIndex++;
                }
            }
            for (; xIndex < this.xMul; xIndex++) {
                for (; yIndex < this.yMul; yIndex++) {
                    let xReal = this.x + (xIndex * (this.xOff + this.itemFrameImg.width)) + cvsManager.camera.x;
                    let yReal = this.y + (yIndex * (this.yOff + this.itemFrameImg.height)) + cvsManager.camera.y;
                    cvsManager.ctx.drawImage(this.itemFrameImg, xReal, yReal, this.frameWidth, this.frameHeight);
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

    drawPopUps(cvsManager) {
        let currentTime = Date.now();
        cvsManager.ctx.font = "20px Georgia";
        cvsManager.ctx.fillStyle = "red";
        for (let popUpIndex in this.popUps) {
            let popUp = this.popUps[popUpIndex];
            if (currentTime - popUp.timestamp < popUp.age) {
                cvsManager.ctx.fillText(popUp.value, popUp.x + 15, popUp.y);
                popUp.y--;
            } else {
                this.popUps.splice(popUpIndex, 1);
            }
        }
    }
}

class Button {
    constructor(image, x, y, width = image.width, height = image.height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.callBacks = [];
    }

    addCallbackWhenClicked(callback) {
        this.callBacks.push(callback);
    }

    check(x, y) {
        if (x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height) {
            this.callBacks.forEach((callback) => {
                callback();
            });
        }
    }

    draw(cvsManager) {
        cvsManager.ctx.drawImage(this.image, this.x + cvsManager.camera.x, this.y + cvsManager.camera.y, this.width, this.height);
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

    draw(cvsManager) {
        cvsManager.ctx.drawImage(this.img, this.x + cvsManager.camera.x, this.y + cvsManager.camera.y, this.value / this.maxValue * this.img.width, this.img.height);
    }
}

class TextList {
    constructor(x, y, width, height, yOff = 20) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.yOff = yOff;
        this.texts = [];
        this.currentLongestText = "";
        this.selectedTextIndex = -1;
    }

    setTexts(texts, cvsManager) {
        this.texts = texts;
        for (let i = 0; i < texts.length; i++){
            if(texts[i].length > this.currentLongestText.length){
                this.currentLongestText = texts[i];
            }
        }
        cvsManager.ctx.font = "24px ariel";
        let measurement = cvsManager.ctx.measureText(this.currentLongestText);
        this.width = measurement.width;
        this.height = (texts.length) * this.yOff;
    }

    draw(cvsManager) {
        cvsManager.ctx.fillStyle = "rgb(255,255,255)";
        cvsManager.ctx.fillRect(cvsManager.camera.x + this.x, cvsManager.camera.y + this.y, this.width, this.height);
        cvsManager.ctx.fillStyle = "rgb(0,0,0)";
        cvsManager.ctx.font = "24px ariel";
        //let measurement = cvsManager.ctx.measureText(this.texts[0]);
        //let heightTally = (measurement.actualBoundingBoxAscent + measurement.actualBoundingBoxDescent) + this.yOff;
        let heightTally = this.yOff;
        for (let i = 0; i < this.texts.length; i++) {
            //let measurement = cvsManager.ctx.measureText(this.texts[i]);
            if(i === this.selectedTextIndex){
                cvsManager.ctx.fillStyle = "rgb(107,101,106)";
                cvsManager.ctx.fillRect(this.x + cvsManager.camera.x, this.y + cvsManager.camera.y + (i * this.yOff), this.width, this.yOff);
                cvsManager.ctx.fillStyle = "rgb(0,0,0)";
            }
            cvsManager.ctx.fillText(this.texts[i], this.x + cvsManager.camera.x, this.y + cvsManager.camera.y + heightTally);
            //heightTally += (measurement.actualBoundingBoxAscent + measurement.actualBoundingBoxDescent) + this.yOff;
            heightTally += this.yOff;
        }
    }

    getSelectedText(){
        if(this.selectedTextIndex === -1) return "";
        return this.texts[this.selectedTextIndex];
    }

    check(x, y){
        let foundMatch = false;
        for (let i = 0; i < this.texts.length; i++){
            let height = this.yOff;
            let width = this.width;
            let xD = this.x;
            let yD = i * height + this.y;
            if(x >= xD && x <= xD + width && y >= yD && y <= yD + height){
                this.selectedTextIndex = i;
                foundMatch = true;
                break;
            }
        }
        if(!foundMatch){
            this.selectedTextIndex = -1;
        }
    }
}

class ImageList {
    constructor(imageKeys, images, x, y, imgWidth, imgHeight, xLimit, yLimit, xOff = 0, yOff = 0) {
        this.images = images;
        this.imagesKeys = [];
        for (let i = 0; i < imageKeys.length; i++) {
            this.imagesKeys.push(imageKeys[i].split(".png")[0]);
        }
        this.x = x;
        this.y = y;
        this.imgWidth = imgWidth;
        this.imgHeight = imgHeight;
        this.xLimit = xLimit;
        this.yLimit = yLimit;
        this.xOff = xOff;
        this.yOff = yOff;
        this.startIndex = 0;
        this.selectedImage = "";
    }

    draw(cvsManager) {
        cvsManager.ctx.fillStyle = "white";
        cvsManager.ctx.fillRect(this.x + cvsManager.camera.x, this.y + cvsManager.camera.y, this.getWidth(), this.getHeight());
        cvsManager.ctx.fillStyle = "black";
        let xIndex = 0;
        let yIndex = 0;
        for (let i = this.startIndex; i < this.imagesKeys.length; i++) {
            let imageName = this.imagesKeys[i];
            let image = this.images[imageName];
            let xReal = this.x + (xIndex * (this.xOff + this.imgWidth)) + cvsManager.camera.x;
            let yReal = this.y + (yIndex * (this.yOff + this.imgHeight)) + cvsManager.camera.y;
            cvsManager.ctx.drawImage(image, xReal, yReal, this.imgWidth, this.imgHeight);
            xIndex++;
            if (xIndex === this.xLimit) {
                yIndex++;
                xIndex = 0;
            }
            if (yIndex === this.yLimit) {
                break;
            }
        }
    }

    rotateSelectedImage(rotationDirection) {
        let splitImage = this.selectedImage.split("_");
        if (splitImage.length <= 1) return;
        let imageNameOnly = splitImage[0];
        let imageDirection = splitImage[1];
        if (imageDirection !== "N" && imageDirection !== "E" && imageDirection !== "S" && imageDirection !== "W") return;
        if (rotationDirection === 1) {
            if (imageDirection === "N") {
                imageDirection = "E";
            } else if (imageDirection === "E") {
                imageDirection = "S";
            } else if (imageDirection === "S") {
                imageDirection = "W";
            } else if (imageDirection === "W") {
                imageDirection = "N";
            }
        } else if (rotationDirection === -1) {
            if (imageDirection === "N") {
                imageDirection = "W";
            } else if (imageDirection === "E") {
                imageDirection = "N";
            } else if (imageDirection === "S") {
                imageDirection = "E";
            } else if (imageDirection === "W") {
                imageDirection = "S";
            }
        }
        if (this.images[imageNameOnly + "_" + imageDirection]) {
            this.selectedImage = imageNameOnly + "_" + imageDirection;
        }
    }

    check(x, y) {
        let xIndex = Math.floor(x / (this.imgWidth + this.xOff));
        let yIndex = Math.floor(y / (this.imgHeight + this.yOff));
        if (xIndex <= this.xLimit && yIndex <= this.yLimit) {
            this.selectedImage = this.imagesKeys[xIndex + yIndex * this.xLimit + this.startIndex];
            return true;
        }
        return false;
    }

    scroll(dir) {
        if (this.startIndex + dir >= 0 && this.startIndex + dir < this.imagesKeys.length) {
            this.startIndex += dir;
        }
    }

    getWidth() {
        return this.xLimit * (this.imgWidth + this.xOff);
    }

    getHeight() {
        return (this.yLimit) * (this.imgHeight + this.yOff);
    }
}

class UIWindow {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.uis = [];
    }

    draw(cvsManager) {
        cvsManager.ctx.fillRect(this.x + cvsManager.camera.x, this.y + cvsManager.camera.y, this.width, this.height);
        this.uis.forEach((ui) => {
            ui.draw(cvsManager);
        });
    }

    addUI(ui) {
        this.uis.push(ui);
    }
}

export {
    UIWindow,
    ChatInput,
    Bar,
    Button,
    ImageList,
    PopUpManager,
    TextList
}