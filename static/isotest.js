import {
  CanvasManager,
  GameManager,
  SocketManager,
  IsoGrid
} from "./classes.js";
import {
  ChatInput,
  ImageList,
  Button
} from "./uiclasses.js";
import {
  TextList,
  Label
} from "./uiclasses.js";

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
let isoOffsetEditor;
let maxXLabel;
let maxYLabel;
let maxXInput;
let maxYInput;
let xAxisRectangleLabel;
let xAxisRectangleInput;
let yAxisRectangleLabel;
let yAxisRectangleInput;
let tileWidthInput;
let tileHeightInput;
let tileWidthLabel;
let tileHeightLabel
let currentInput;
let generateMapButton;

function onDocLoad() {
  gameManager = new GameManager();
  socketManager = new SocketManager();
  cvsManager = new CanvasManager($("#canvas")[0]);
  cvsManager.configure(window.innerWidth, window.innerHeight, 0, false);
  isoGrid = new IsoGrid(0, 0, 256, 128, 5, 5, cvsManager, gameManager);
  socketManager.connect();
  socketManager.emit("getimages");
  socketManager.on("images", (data) => {
    gameManager.loadImages(data).then(() => {
      imageList = new ImageList(gameManager.originalImages["sand"], gameManager.images, 0, 0, 40, 40, 5, 18);
      chatInput = new ChatInput(imageList.getWidth() + imageList.x + 10, 10, 200, 20);
      sendMapButton = new Button(gameManager.images["upload2"], chatInput.getWidth() + chatInput.x + 10, 10, 20, 20);
      loadMapButton = new Button(gameManager.images["download"], sendMapButton.x + sendMapButton.width + 10, 10, 20, 20);
      deleteMapButton = new Button(gameManager.images["delete"], loadMapButton.x + loadMapButton.width + 10, 10, 20, 20);
      isoOffsetEditor = new Button(gameManager.images["edit"], deleteMapButton.x + deleteMapButton.width + 10, 10, 20, 20);
      maxXLabel = new Label(isoOffsetEditor.x + isoOffsetEditor.width + 10, 10 + 16, "MaxX:");
      maxXInput = new ChatInput(maxXLabel.getWidth(cvsManager) + maxXLabel.x + 10, 10, 50, 20);
      maxYLabel = new Label(maxXInput.x + maxXInput.width + 10, 10 + 16, "MaxY:");
      maxYInput = new ChatInput(maxYLabel.getWidth(cvsManager) + maxYLabel.x + 10, 10, 50, 20);
      xAxisRectangleLabel = new Label(maxYInput.x + maxYInput.width + 10, 10 + 16, "xAxisRectangle:");
      xAxisRectangleInput = new ChatInput(xAxisRectangleLabel.getWidth(cvsManager) + xAxisRectangleLabel.x + 10, 10, 50, 20);
      yAxisRectangleLabel = new Label(xAxisRectangleInput.x + xAxisRectangleInput.width + 10, 10 + 16, "yAxisRectangle:");
      yAxisRectangleInput = new ChatInput(yAxisRectangleLabel.getWidth(cvsManager) + yAxisRectangleLabel.x + 10, 10, 50, 20);
      tileWidthLabel = new Label(yAxisRectangleInput.x + yAxisRectangleInput.width + 10, 10 + 16, "tile width:");
      tileWidthInput = new ChatInput(tileWidthLabel.getWidth(cvsManager) + tileWidthLabel.x + 10, 10, 50, 20);
      tileHeightLabel = new Label(tileWidthInput.x + tileWidthInput.width + 10, 10 + 16, "tile height:");
      tileHeightInput = new ChatInput(tileHeightLabel.getWidth(cvsManager) + tileHeightLabel.x + 10, 10, 50, 20);
      generateMapButton = new Button(gameManager.images["hammer"], tileHeightInput.x + tileHeightInput.width + 10, 10, 20, 20);
      currentInput = chatInput;
      sendMapButton.addCallbackWhenClicked(uploadMap);
      loadMapButton.addCallbackWhenClicked(loadMap);
      deleteMapButton.addCallbackWhenClicked(deleteMap);
      generateMapButton.addCallbackWhenClicked(() => {
        let maxX = Number(maxXInput.text);
        let maxY = Number(maxYInput.text);
        let tw = Number(tileWidthInput.text);
        let th = Number(tileHeightInput.text);
        if (maxX !== NaN && maxX !== 0) isoGrid.maxX = maxX;
        if (maxY !== NaN && maxY !== 0) isoGrid.maxY = maxY;
        if (tw !== NaN && tw !== 0) isoGrid.tw = tw;
        if (th !== NaN && th !== 0) isoGrid.th = th;
        isoGrid.eraseGrid();
        isoGrid.fillRectangle(0, Number(xAxisRectangleInput.text), Number(yAxisRectangleInput.text), "block_E");
      })
      isoOffsetEditor.addCallbackWhenClicked(() => {
        window.location.href = "http://localhost:5000/isooffseteditor.html";
      });
      socketManager.emit("offsets");
      socketManager.emit("getisomaplist");
      textList = new TextList(imageList.getWidth() + imageList.x + 10, chatInput.getHeight() + chatInput.y + 10, 150, 200);
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
    isoGrid.currentRotation = data.rotation;
  });
  socketManager.on("sendisomap", () => {
    socketManager.emit("getisomaplist");
  });
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
      if (!imageList.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
        isoGrid.addTile(isoGrid.currentLevel, cvsManager.mouseWorld.x, cvsManager.mouseWorld.y, imageList.selectedImage);
      }
    } else if (cvsManager.rightMouseClicked) {
      isoGrid.removeTile(isoGrid.currentLevel, cvsManager.mouseWorld.x, cvsManager.mouseWorld.y);
    }
    if (isoOffsetEditor.checkHover(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
      $('html,body').css('cursor', 'pointer');
    } else {
      $('html,body').css('cursor', 'default');
    }
  });
  cvsManager.listenFor("contextmenu", () => {
    event.preventDefault();
  });
  cvsManager.listenFor("mousedown", (evt) => {
    if (evt.button === 0) {
      cvsManager.leftMouseClicked = true;
      if (!imageList.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
        isoGrid.addTile(isoGrid.currentLevel, cvsManager.mouseWorld.x, cvsManager.mouseWorld.y, imageList.selectedImage);
      }
      if (chatInput.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
        currentInput = chatInput;
      }
      if (maxXInput.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
        currentInput = maxXInput;
      }
      if (maxYInput.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
        currentInput = maxYInput;
      }
      if (xAxisRectangleInput.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
        currentInput = xAxisRectangleInput;
      }
      if (yAxisRectangleInput.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
        currentInput = yAxisRectangleInput;
      }
      if (tileWidthInput.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
        currentInput = tileWidthInput;
      }
      if (tileHeightInput.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y)) {
        currentInput = tileHeightInput;
      }
      deleteMapButton.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
      sendMapButton.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
      loadMapButton.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
      textList.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
      isoOffsetEditor.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
      generateMapButton.checkClick(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
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
    if (currentInput.focus && ((evt.keyCode >= 65 && evt.keyCode <= 90) || evt.keyCode === 32 || evt.keyCode === 191 || (evt.keyCode >= 48 && evt.keyCode <= 57))) {
      currentInput.addText(evt.key, cvsManager);
      return;
    }
    if (evt.key === "g") {
      isoGrid.showGrid = !isoGrid.showGrid;
    }
    if (evt.key === "q") {
      rotateCamera(1);
      isoGrid.rotate(-1);
    }
    if (evt.keyCode >= 48 && evt.keyCode <= 57) {
      isoGrid.currentLevel = Number(evt.key)
    }
    if (evt.key === "e") {
      rotateCamera(-1);
      isoGrid.rotate(1);
    }
    if (evt.key === "r") {
      imageList.rotateSelectedImage(1);
    }
    if (evt.key === "Escape") {
      currentInput.setFocus(false);
    }
    if (evt.key === "Backspace") {
      currentInput.removeText(cvsManager);
    }
    if (evt.key === "Enter") {
      //currentInput.setText("");
      currentInput.setFocus(false);
    }
  });
  isoGrid.fillRectangle(0, 5, isoGrid.maxY, "block_E");
  cvsManager.camera.set(cvsManager.ctx, isoGrid.originX, isoGrid.originY);
  console.log(cvsManager.camera);
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
  isoOffsetEditor.draw(cvsManager);
  maxXLabel.draw(cvsManager);
  maxXInput.draw(cvsManager);
  maxYLabel.draw(cvsManager);
  maxYInput.draw(cvsManager);
  xAxisRectangleLabel.draw(cvsManager);
  xAxisRectangleInput.draw(cvsManager);
  yAxisRectangleLabel.draw(cvsManager);
  yAxisRectangleInput.draw(cvsManager);
  tileWidthInput.draw(cvsManager);
  tileWidthLabel.draw(cvsManager);
  tileHeightInput.draw(cvsManager);
  tileHeightLabel.draw(cvsManager);
  generateMapButton.draw(cvsManager);
  cvsManager.ctx.beginPath();
  cvsManager.ctx.arc(cvsManager.camera.x + cvsManager.cvs.width / 2, cvsManager.camera.y + cvsManager.cvs.height / 2, 2, 0, 2 * Math.PI);
  cvsManager.ctx.fill();
  cvsManager.ctx.fillText(isoGrid.currentRotation, cvsManager.camera.x + 100, cvsManager.camera.y + 100);
  moveAroundWithCamera(10);
  requestAnimationFrame(animate);
}

function uploadMap() {
  alert("uploaded map to server");
  socketManager.emit("sendisomap", {
    name: chatInput.text,
    tw: isoGrid.tw,
    th: isoGrid.th,
    maxX: isoGrid.maxX,
    maxY: isoGrid.maxY,
    rotation: isoGrid.currentRotation,
    map: isoGrid.grid
  });
  console.log(isoGrid);
}

function loadMap() {
  if (textList.selectedTextIndex === -1) return;
  alert("loaded map");
  socketManager.emit("getisomap", {
    name: textList.getSelectedText()
  });
}

function deleteMap() {
  if (textList.selectedTextIndex === -1) return;
  alert("deleted map");
  socketManager.emit("deleteisomap", {
    name: textList.getSelectedText()
  });
}

function rotateCamera(direction) {
  let cameraMDMX = cvsManager.camera.x + cvsManager.cvs.width / 2;
  let cameraMDMY = cvsManager.camera.y + cvsManager.cvs.height / 2;
  let nonFloored = isoGrid.twoDToIso(cameraMDMX, cameraMDMY);
  let floored = isoGrid.twoDToIsoFloored(cameraMDMX, cameraMDMY);
  let rotationObject = isoGrid.getRotationObject(direction);
  let rotatedCoords;
  if (direction === 1) {
    rotatedCoords = isoGrid.rotate90(floored.gridX, floored.gridY, isoGrid.maxX, isoGrid.maxY)
  } else if (direction === -1) {
    rotatedCoords = isoGrid.rotate270(floored.gridX, floored.gridY, isoGrid.maxX, isoGrid.maxY)
  }
  let newCoords = {
    gridX: rotatedCoords.gridX + (nonFloored.gridX - floored.gridX),
    gridY: rotatedCoords.gridY + (nonFloored.gridY - floored.gridY)
  };
  let isoTTT = isoGrid.isoToTwoD(newCoords.gridX, newCoords.gridY);
  cvsManager.camera.set(cvsManager.ctx, isoTTT.x - cvsManager.cvs.width / 2, isoTTT.y - cvsManager.cvs.height / 2)
}


function moveAroundWithCamera(speed = 2) {

  if (currentInput.focus) return;

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
