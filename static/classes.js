class Camera {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.oldX = x;
    this.oldY = y;
  }

  move(_ctx, x, y) {
    this.oldX = this.x;
    this.oldY = this.y;
    this.x += x;
    this.y += y;
    _ctx.translate(-x, -y);
  }

  restore(_ctx) {
    this.x = this.oldX;
    this.y = this.oldY;
    _ctx.translate(-this.x, -this.y);
  }

  set(_ctx, x, y) {
    let xDifference = this.x - x;
    let yDifference = this.y - y;
    this.move(_ctx, -xDifference, -yDifference);
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

  addImage(img, name) {
    this.imgs[name] = img;
  }
}


class SocketManager {
  constructor() {
    this.socket = {};
  }

  connect() {
    this.socket = io.connect({
      reconnectionDelay: 1000,
      reconnection: false
    });
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

class Player {
  constructor(name, x, y, data) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.oldX = x;
    this.oldY = y;
    this.data = data;
    this.animations = [];
  }

  move(x, y) {
    this.oldX = this.x;
    this.oldY = this.y;
    this.x += x;
    this.y += y;
  }

  draw(_ctx, name, x = this.x, y = this.y) {
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


class GameManager {
  constructor(cvsManager, socketManager) {
    this.cvsManager = cvsManager;
    this.socketManager = socketManager;
    this.data = {};
    this.images = [];
    this.originalImages = {};
    this.keys = [];
    this.promises = [];
    this.keyEventListeners = [];
    $(document).keydown((evt) => {
      this.keys[evt.key] = true;
      this.keyEventListeners.forEach((callback) => {
        callback(evt);
      });
    });
    $(document).keyup((evt) => {
      this.keys[evt.key] = false;
    });
    this.players = {};
  }

  getPlayer(id = this.socketManager.socket.id) {
    return this.players[id];
  }

  addPlayer(player) {
    this.players[player.name] = player;
  }

  loadImages(folders) {
    this.originalImages = folders;
    for (let folder in folders) {
      for (let image in folders[folder]) {
        this.promises.push(new Promise((resolve, reject) => {
          let img = new Image();
          img.onload = function() {
            resolve('resolved')
          };
          img.src = './images/' + folder + '/' + folders[folder][image];
          this.images[folders[folder][image].split('.png')[0]] = img
        }))
      }
    }
    return Promise.all(this.promises)
  }

  addKeyListener(keyEventListener) {
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

  configure(w, h, z, border) {
    this.cvs.width = w;
    this.cvs.height = h;
    this.cvs.style.zIndex = z;
    if (border) {
      this.cvs.style.border = 'solid black 1px';
    }
    this.cvs.style.position = "absolute";
    this.currentCoords = {
      x: this.cvs.width / 2,
      y: this.cvs.height / 2
    }
  }

  moveCamera(x, y) {
    this.camera.move(this.ctx, x, y);
  }


  followWithCamera(x1, y1, x2, y2) {
    if (x1 !== this.camera.x + x2 || y1 !== this.camera.y + y2) {
      let xDifference = (this.camera.x + x2 - x1);
      let yDifference = (this.camera.y + y2 - y1);
      this.moveCamera(-xDifference, -yDifference);
    }
  }
}

class IsoGrid {
  constructor(originX, originY, tw, th, maxX, maxY, cvsManager, gameManager, offsets) {
    this.originX = originX;
    this.originY = originY;
    this.tw = tw;
    this.th = th;
    this.maxX = maxX;
    this.maxY = maxY;
    this.cvsManager = cvsManager;
    this.gameManager = gameManager;
    this.offsets = offsets;
    this.grid = {};
    this.rotateFunction = this.rotate0;
    this.currentLevel = 0;
    this.currentRotation = 0;
    this.showGrid = false;
    this.tempTile = undefined;
  }

  eraseGrid() {
    this.grid = {};
  }

  fillRectangle(lvl, width, height, imgName) {
    let halfPoint = this.maxX / 2 - width / 2;
    console.log(halfPoint);
    for (let gridX = 0; gridX < width; gridX++) {
      this.fillXAxis(lvl, gridX + halfPoint, height, imgName);
    }
  }

  fillYAxis(lvl, gridY, amount, imgName) {
    gridY = Math.min(Math.max(parseInt(gridY), 0), this.maxY);
    amount = Math.min(Math.max(parseInt(amount), 0), this.maxX);
    for (let gridX = 0; gridX < amount; gridX++) {
      this.addTileGivenGrid(lvl, gridX, gridY, imgName);
    }
  }

  fillXAxis(lvl, gridX, amount, imgName) {
    gridX = Math.min(Math.max(parseInt(gridX), 0), this.maxX);
    amount = Math.min(Math.max(parseInt(amount), 0), this.maxY);
    for (let gridY = 0; gridY < amount; gridY++) {
      this.addTileGivenGrid(lvl, gridX, gridY, imgName);
    }
  }

  fillLevelWithTile(lvl, imgName) {
    if (!this.grid[lvl]) {
      this.grid[lvl] = {};
    }
    for (let gridX = 0; gridX < this.maxX; gridX++) {
      for (let gridY = 0; gridY < this.maxY; gridY++) {
        this.addTileGivenGrid(lvl, gridX, gridY, imgName);
      }
    }
  }

  rotate0(gridX, gridY, maxX, maxY) {
    return {
      gridX: gridX,
      gridY: gridY
    };
  }

  rotate90(gridX, gridY, maxX, maxY) {
    return {
      gridX: gridY,
      gridY: maxY - 1 - gridX
    };
  }

  rotate180(gridX, gridY, maxX, maxY) {
    return {
      gridX: maxX - 1 - gridX,
      gridY: maxY - 1 - gridY
    }
  }

  rotate270(gridX, gridY, maxX, maxY) {
    return {
      gridX: maxX - 1 - gridY,
      gridY: gridX
    };
  }

  isoToTwoD(gridX, gridY){
    let x = this.th*(gridX*2 - gridY*2)/2
    let y = this.th*(gridX + gridY)/2
    return {x:x + this.originX, y:y + this.originY};
  }

  twoDToIso(x, y) {
    let gridX = ((y - this.originY) / this.th + (x - this.originX) / this.tw);
    let gridY = ((y - this.originY) / this.th - (x - this.originX) / this.tw);
    return {
      gridX: gridX,
      gridY: gridY
    };
  }

  twoDToIsoFloored(x, y) {
    let iso = this.twoDToIso(x, y);
    return {
      gridX: Math.floor(iso.gridX),
      gridY: Math.floor(iso.gridY)
    };
  }

  setTempTile(lvl, x, y, imageName) {
    if (imageName === "") return;
    let coords = this.twoDToIsoFloored(x, y);
    let rotatedCoords = this.rotateFunction(coords.x, coords.y, this.maxX, this.maxY);
    if (coords.gridX >= this.maxX || coords.gridY >= this.maxY || coords.gridX < 0 || coords.gridY < 0) return;
    if (!this.grid[lvl]) {
      this.grid[lvl] = {};
    }
    if (!this.grid[lvl][rotatedCoords.gridX]) {
      this.grid[lvl][rotatedCoords.gridX] = {};
    }
    if (this.grid[lvl][rotatedCoords.gridX][rotatedCoords.gridY]) return;
    this.tempTile = {
      lvl: lvl,
      gridX: coords.gridX,
      gridY: coords.gridY,
      imageName: imageName
    };
  }

  unsetTempTile() {
    this.tempTile = undefined;
  }

  addTile(lvl, x, y, imageName) {
    if (imageName === "") return;
    let coords = this.twoDToIsoFloored(x, y);
    let gridCoords = this.rotateFunction(coords.gridX, coords.gridY, this.maxX, this.maxY);
    this.addTileGivenGrid(lvl, gridCoords.gridX, gridCoords.gridY, imageName);
  }

  removeTile(lvl, x, y) {
    let coords = this.twoDToIsoFloored(x, y);
    let gridCoords = this.rotateFunction(coords.gridX, coords.gridY, this.maxX, this.maxY);
    this.removeTileGivenGrid(lvl, gridCoords.gridX, gridCoords.gridY);
  }

  addTileGivenGrid(lvl, gridX, gridY, imageName) {
    if (imageName === "") return;
    if (gridX >= this.maxX || gridY >= this.maxY || gridX < 0 || gridY < 0) return;
    if (!this.grid[lvl]) {
      this.grid[lvl] = {};
    }
    if (!this.grid[lvl][gridX]) {
      this.grid[lvl][gridX] = {};
    }
    if (!this.grid[lvl][gridX][gridY]) {
      this.grid[lvl][gridX][gridY] = [];
    }
    if (!this.grid[lvl][gridX][gridY].includes(imageName)) {
      this.grid[lvl][gridX][gridY].push(imageName);
    }
  }

  removeTileGivenGrid(lvl, gridX, gridY) {
    if (gridX >= this.maxX || gridY >= this.maxY || gridX < 0 || gridY < 0) return;
    if (this.grid[lvl] && this.grid[lvl][gridX] && this.grid[lvl][gridX][gridY]) {
      this.grid[lvl][gridX][gridY].splice(this.grid[lvl][gridX][gridY].length - 1, 1);
    }
  }

  drawGridOutline() {
    if (!this.showGrid) return;
    for (let gridX = 0; gridX < this.maxX; gridX++) {
      for (let gridY = 0; gridY < this.maxY; gridY++) {
        let x = this.originX + (gridX - gridY) * this.tw / 2;
        let y = this.originY + (gridX + gridY) * this.th / 2;
        this.drawTileOutline(x, y);
      }
    }
  }

  drawImagesOfGrid() {
    for (let gridX = 0; gridX < this.maxX; gridX++) {
      for (let gridY = 0; gridY < this.maxY; gridY++) {
        for (let lvl = 0; lvl < Object.keys(this.grid).length; lvl++) {
          let gridCoords = this.rotateFunction(gridX, gridY, this.maxX, this.maxY);
          if (this.grid[lvl] && this.grid[lvl][gridCoords.gridX] && this.grid[lvl][gridCoords.gridX][gridCoords.gridY]) {
            for (let imageName in this.grid[lvl][gridCoords.gridX][gridCoords.gridY]) {
              this.drawTileImage(lvl, gridX, gridY, this.grid[lvl][gridCoords.gridX][gridCoords.gridY][imageName]);
            }
          }
          if (this.tempTile && this.tempTile.gridX === gridX && this.tempTile.gridY === gridY && this.tempTile.lvl === lvl) {
            this.drawTileImage(lvl, gridX, gridY, this.tempTile.imageName);
          }
        }
      }
    }
  }

  drawTileOutline(x, y) {
    this.cvsManager.ctx.beginPath();
    this.cvsManager.ctx.moveTo(x, y);
    this.cvsManager.ctx.lineTo(x - this.tw / 2, y + this.th / 2);
    this.cvsManager.ctx.lineTo(x, y + this.th);
    this.cvsManager.ctx.lineTo(x + this.tw / 2, y + this.th / 2);
    this.cvsManager.ctx.lineTo(x, y);
    this.cvsManager.ctx.stroke();
  }

  drawTileImage(lvl, gridX, gridY, imgName) {
    gridX = gridX - lvl;
    gridY = gridY - lvl;
    let x = this.originX + (gridX - gridY) * this.tw / 2;
    let y = this.originY + (gridX + gridY) * this.th / 2;
    if (this.gameManager.data.offsets[imgName]) {
      this.cvsManager.ctx.drawImage(this.gameManager.images[imgName], x + this.gameManager.data.offsets[imgName].x, y + this.gameManager.data.offsets[imgName].y + this.gameManager.data.offsets[imgName].z * lvl);
    } else {
      this.cvsManager.ctx.drawImage(this.gameManager.images[imgName], x, y);
    }
  }

  rotateGridTiles(rotationDirection) {
    for (let gridLvl = 0; gridLvl < Object.keys(this.grid).length; gridLvl++) {
      for (let gridX = 0; gridX < this.maxX; gridX++) {
        for (let gridY = 0; gridY < this.maxY; gridY++) {
          if (this.grid[gridLvl] && this.grid[gridLvl][gridX] && this.grid[gridLvl][gridX][gridY]) {
            this.grid[gridLvl][gridX][gridY] = this.adjustImagesForRotation(this.grid[gridLvl][gridX][gridY], rotationDirection);
          }
        }
      }
    }
  }

  adjustImagesForRotation(imgNames, rotationDirection) {
    if ((this.currentRotation === 0 && rotationDirection === 1) ||
      (this.currentRotation === 270 && rotationDirection === -1) ||
      (this.currentRotation === 180 && rotationDirection === 1) ||
      (this.currentRotation === 90 && rotationDirection === -1)) {
      imgNames = imgNames.reverse();
    }
    for (let imageKey in imgNames) {
      imgNames[imageKey] = this.adjustImageForRotation(imgNames[imageKey], rotationDirection);
    }
    return imgNames
  }

  adjustImageForRotation(imgName, rotationDirection) {
    let splitImage = imgName.split("_");
    if (splitImage.length <= 1) return imgName;
    let imageNameOnly = splitImage[0];
    let imageDirection = splitImage[1];
    if (imageDirection !== "N" && imageDirection !== "E" && imageDirection !== "S" && imageDirection !== "W") return imgName;
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
    if (this.gameManager.images[imageNameOnly + "_" + imageDirection]) {
      return imageNameOnly + "_" + imageDirection;
    } else {
      return imgName;
    }
  }

  rotate(direction) {
    let rotationObject = this.getRotationObject(direction);
    this.currentRotation = rotationObject.rotation;
    this.rotateFunction = rotationObject.rotationFunction;
    this.rotateGridTiles(direction);
  }

  getRotationObject(direction) {
    let newRotation = this.currentRotation;
    let newRotationFunction = this.rotateFunction;
    if (direction === -1) {
      if (this.currentRotation === 0) {
        newRotation = 270;
        newRotationFunction= this.rotate270;
      } else if (this.currentRotation === 90) {
        newRotation = 0;
        newRotationFunction = this.rotate0;
      } else if (this.currentRotation === 180) {
        newRotation = 90;
        newRotationFunction = this.rotate90;
      } else if (this.currentRotation === 270) {
        newRotation = 180;
        newRotationFunction = this.rotate180;
      }
    }
    else if (direction === 1) {
      if (this.currentRotation === 0) {
        newRotation = 90;
        newRotationFunction = this.rotate90;
      } else if (this.currentRotation === 90) {
        newRotation = 180;
        newRotationFunction = this.rotate180;
      } else if (this.currentRotation === 180) {
        newRotation = 270;
        newRotationFunction = this.rotate270;
      } else if (this.currentRotation === 270) {
        newRotation = 0;
        newRotationFunction = this.rotate0;
      }
    }
    return {rotation: newRotation, rotationFunction: newRotationFunction};
  }

}

export {
  Camera,
  Animation,
  AnimationFinal,
  AnimationFinalMultipleFiles,
  Player,
  CanvasManager,
  GameManager,
  SocketManager,
  IsoGrid
}
