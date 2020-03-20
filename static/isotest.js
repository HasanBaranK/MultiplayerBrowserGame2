import {CanvasManager, GameManager, SocketManager, ImageList, ChatInput} from "./classes.js";

let gameManager;
let cvsManager;
let socketManager;
$(document).ready(onDocLoad);
let isos = {};
let added = [];
let tileWidth = 256;
let tileHeight = tileWidth / 2;
let maxX = 4;
let maxY = 4;
let toDrawGrid = true;
let imageList;
let lvlToAddTile = 0;
let displayOnlyCurrentLevel = false;
let imageToDraw = "";
let xyFunction = getXY0;
let currentRotation = 0;
let rotationDirection = 0;
let offsets = {};
let chatInput;

function onDocLoad() {
    chatInput = new ChatInput(500, 20, 100, 100, 100);
    gameManager = new GameManager();
    socketManager = new SocketManager();
    cvsManager = new CanvasManager($("#canvas")[0]);
    cvsManager.configure(window.innerWidth, window.innerHeight, 0, false, true, true);
    socketManager.connect();
    socketManager.emit("getimages");
    socketManager.emit("offsets");
    socketManager.on("images", (data) => {
        gameManager.loadImages(data).then(() => {
            imageList = new ImageList(gameManager.originalImages["sand"], gameManager.images, 0, 0, 40, 40, 5, 18);
            window.requestAnimationFrame(animate);
        });
    });
    socketManager.on("offsets", (data) => {
        offsets = data;
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
            let coords = convertCoord(cvsManager.mouseWorld.x, cvsManager.mouseWorld.y, 0, 0, tileWidth, tileHeight);
            let xy = xyFunction(Math.floor(coords.x), Math.floor(coords.y));
            addIsoTileToGrid(xy.x, xy.y, lvlToAddTile);
        }
        if (cvsManager.rightMouseClicked) {
            let coords = convertCoord(cvsManager.mouseWorld.x, cvsManager.mouseWorld.y, 0, 0, tileWidth, tileHeight);
            let xy = xyFunction(Math.floor(coords.x), Math.floor(coords.y));
            removeIsoTileToGrid(xy.x, xy.y, lvlToAddTile);
        }
    });
    cvsManager.listenFor("contextmenu", (evt) => {
        event.preventDefault();
    });
    cvsManager.listenFor("mousedown", (evt) => {
        if (evt.button === 0) {
            cvsManager.leftMouseClicked = true;
            let coords = convertCoord(cvsManager.mouseWorld.x, cvsManager.mouseWorld.y, 0, 0, tileWidth, tileHeight);
            let xy = xyFunction(Math.floor(coords.x), Math.floor(coords.y));
            let newImageToDraw = imageList.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
            console.log(newImageToDraw);
            if (newImageToDraw !== "") {
                imageToDraw = newImageToDraw;
            }
            addIsoTileToGrid(xy.x, xy.y, lvlToAddTile);
        } else if (evt.button === 2) {
            cvsManager.rightMouseClicked = true;
            let coords = convertCoord(cvsManager.mouseWorld.x, cvsManager.mouseWorld.y, 0, 0, tileWidth, tileHeight);
            let xy = xyFunction(Math.floor(coords.x), Math.floor(coords.y));
            removeIsoTileToGrid(xy.x, xy.y, lvlToAddTile);
        }

    });
    cvsManager.listenFor("mouseup", (evt) => {
        cvsManager.leftMouseClicked = false;
        cvsManager.rightMouseClicked = false;
    });
    gameManager.addKeyListener((evt) => {
        if(evt.key === "p"){
            console.log(isos);
            socketManager.emit("isomap", {name: "map", map: isos});
        }
        if (evt.key === "g") {
            toDrawGrid = !toDrawGrid;
        }
        if (evt.key === "h") {
            displayOnlyCurrentLevel = !displayOnlyCurrentLevel;
        }
        if (evt.key === "z") {
            // undoCreation();
        }
        if (evt.keyCode >= 48 && evt.keyCode <= 57) {
            lvlToAddTile = Number(evt.key)
        }
        if (evt.key === "q") {
            if (currentRotation === 0) {
                currentRotation = 270;
                xyFunction = getXY270;
            } else if (currentRotation === 90) {
                currentRotation = 0;
                xyFunction = getXY0;
            } else if (currentRotation === 180) {
                currentRotation = 90;
                xyFunction = getXY90;
            } else if (currentRotation === 270) {
                currentRotation = 180;
                xyFunction = getXY180;
            }
            rotationDirection = -1;
            rotateMapTiles();
        }
        if (evt.key === "e") {
            if (currentRotation === 0) {
                currentRotation = 90;
                xyFunction = getXY90;
            } else if (currentRotation === 90) {
                currentRotation = 180;
                xyFunction = getXY180;
            } else if (currentRotation === 180) {
                currentRotation = 270;
                xyFunction = getXY270;
            } else if (currentRotation === 270) {
                currentRotation = 0;
                xyFunction = getXY0;
            }
            rotationDirection = 1;
            rotateMapTiles();
        }
    });
    cvsManager.moveCamera(-600, -100);
    initGridWithTiles("block_East");
}

function animate() {
    cvsManager.clear();
    drawImagesOfGrid();
    if (toDrawGrid) {
        drawGrid(0, 0, maxX, maxY, tileWidth, tileHeight);
    }
    imageList.draw(cvsManager.ctx, cvsManager.camera);
    //chatInput.draw(cvsManager.ctx, cvsManager.camera);
    moveAroundWithCamera(10);
    requestAnimationFrame(animate);
}

function drawImagesOfGrid() {
    for (let indexX = 0; indexX < maxX; indexX++) {
        for (let indexY = 0; indexY < maxY; indexY++) {
            for (let indexLvl = 0; indexLvl < Object.keys(isos).length; indexLvl++) {
                let xy = xyFunction(indexX, indexY);
                if (isos[indexLvl] && isos[indexLvl][xy.x] && isos[indexLvl][xy.x][xy.y]) {
                    let imageName = isos[indexLvl][xy.x][xy.y];
                    drawIsoTileImage(imageName, indexX, indexY, 0, 0, tileWidth, tileHeight, indexLvl);
                }
            }
        }
    }
}

function rotateMapTiles() {
    for (let indexLvl = 0; indexLvl < Object.keys(isos).length; indexLvl++) {
        for (let indexX = 0; indexX < maxX; indexX++) {
            for (let indexY = 0; indexY < maxY; indexY++) {
                if (isos[indexLvl] && isos[indexLvl][indexX] && isos[indexLvl][indexX][indexY]) {
                    isos[indexLvl][indexX][indexY] = getImageWithRotation(isos[indexLvl][indexX][indexY]);
                }
            }
        }
    }
}

function getImageWithRotation(imageName) {
    let splitImage = imageName.split("_");
    if (splitImage.length <= 1) {
        return imageName;
    }
    let imageNameOnly = splitImage[0];
    let imageDirection = splitImage[1];

    if (rotationDirection === 1) {
        if (imageDirection === "North") {
            imageDirection = "East";
        } else if (imageDirection === "East") {
            imageDirection = "South";
        } else if (imageDirection === "South") {
            imageDirection = "West";
        } else if (imageDirection === "West") {
            imageDirection = "North";
        }
    } else if (rotationDirection === -1) {
        if (imageDirection === "North") {
            imageDirection = "West";
        } else if (imageDirection === "East") {
            imageDirection = "North";
        } else if (imageDirection === "South") {
            imageDirection = "East";
        } else if (imageDirection === "West") {
            imageDirection = "South";
        }
    }
    if (gameManager.images[imageNameOnly + "_" + imageDirection]) {
        return imageNameOnly + "_" + imageDirection;
    } else {
        return imageName;
    }
}

function getXY0(x, y) {
    return {x: x, y: y};
}

function getXY90(x, y) {
    return {x: y, y: maxX - 1 - x};
}

function getXY180(x, y) {
    return {x: maxX - 1 - x, y: maxX - 1 - y}
}

function getXY270(x, y) {
    return {x: maxX - 1 - y, y: x};
}


function initGridWithTiles(imageName) {
    if (!isos[0]) {
        isos[0] = {};
    }
    for (let localX = 0; localX < maxX; localX++) {
        for (let localY = 0; localY < maxY; localY++) {
            if (!isos[0][localX]) {
                isos[0][localX] = [];
            }
            isos[0][localX][localY] = imageName;
        }
    }
}

function addIsoTileToGrid(x, y, lvl) {
    if (imageToDraw === "") return;
    console.log(x + " " + y + " lvl" + lvl);
    if (x >= maxX || y >= maxY || x < 0 || y < 0) return;

    if (!isos[lvl]) {
        isos[lvl] = {};
    }
    if (!isos[lvl][x]) {
        isos[lvl][x] = {};
    }
    if (!isos[lvl][x][y]) {
        added.push({x: x, y: y, lvl: lvl});
        isos[lvl][x][y] = imageToDraw;
    }
}

function removeIsoTileToGrid(x, y, lvl) {
    if (x >= maxX || y >= maxY || x < 0 || y < 0) return;
    if (isos[lvl] && isos[lvl][x] && isos[lvl][x][y]) {
        delete isos[lvl][x][y];
    }
}
function drawGrid(isoX, isoY, maxLocalX, maxLocalY, isoW, isoH) {
    for (let localX = 0; localX < maxLocalX; localX++) {
        for (let localY = 0; localY < maxLocalY; localY++) {
            let globalX = isoX + (localX - localY) * isoW / 2;
            let globalY = isoY + (localX + localY) * isoH / 2;
            strokeIsoTile(globalX, globalY, isoW, isoH);
        }
    }
}


function convertCoord(globalX, globalY, isoX, isoY, isoW, isoH) {
    let localX = ((globalY - isoY) / isoH + (globalX - isoX) / isoW);
    let localY = ((globalY - isoY) / isoH - (globalX - isoX) / isoW);
    return {x: localX, y: localY};
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

function drawIsoTileImage(img, localX, localY, isoX, isoY, isoW, isoH, lvl) {
    if (img === "") return;
    if (img === undefined) {
        isos[lvl][localX].splice(localY, 1);
        return;
    }
    localX = localX - lvl;
    localY = localY - lvl;
    let globalX = isoX + (localX - localY) * isoW / 2;
    let globalY = isoY + (localX + localY) * isoH / 2;
    if (offsets[img]) {
        cvsManager.ctx.drawImage(gameManager.images[img], globalX + offsets[img].x, globalY + offsets[img].y);
    } else {
        cvsManager.ctx.drawImage(gameManager.images[img], globalX, globalY);
    }
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
    if (gameManager.keys["p"]) {
        tileHeight++;
    }
    if (gameManager.keys["o"]) {
        tileHeight--;
    }
}

