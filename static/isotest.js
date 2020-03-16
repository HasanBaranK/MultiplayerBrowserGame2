import {CanvasManager, GameManager, SocketManager, ImageList} from "./classes.js";

let gameManager;
let cvsManager;
let socketManager;
$(document).ready(onDocLoad);
let isos = [];
let added = [];
let tileWidth = 100;
let tileHeight = tileWidth / 2;
let maxX = 100;
let maxY = 100;
let toDrawGrid = true;
let imageList;
let lvlToAddTile = 0;
let displayOnlyCurrentLevel = false;
let imageToDraw = "";

function onDocLoad() {
    gameManager = new GameManager();
    socketManager = new SocketManager();
    cvsManager = new CanvasManager($("#canvas")[0]);
    cvsManager.configure(window.innerWidth, window.innerHeight, 0, false, true, true);
    socketManager.connect();
    socketManager.emit("getimages");
    socketManager.on("images", (data) => {
        gameManager.loadImages(data).then(() => {
            imageList = new ImageList(gameManager.images, 0, 0, 40, 40, 5, 18);
            window.requestAnimationFrame(animate);
        });
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
            addIsoTileToGrid(Math.floor(coords.x), Math.floor(coords.y), lvlToAddTile);
        }
        if(cvsManager.rightMouseClicked){
            let coords = convertCoord(cvsManager.mouseWorld.x, cvsManager.mouseWorld.y, 0, 0, tileWidth, tileHeight);
            removeIsoTileToGrid(Math.floor(coords.x), Math.floor(coords.y), lvlToAddTile);
        }
    });
    cvsManager.listenFor("contextmenu", (evt) => {
        event.preventDefault();
    });
    cvsManager.listenFor("mousedown", (evt) => {
        if (evt.button === 0) {
            cvsManager.leftMouseClicked = true;
            let coords = convertCoord(cvsManager.mouseWorld.x, cvsManager.mouseWorld.y, 0, 0, tileWidth, tileHeight);
            let newImageToDraw = imageList.check(cvsManager.mouseScreen.x, cvsManager.mouseScreen.y);
            if (newImageToDraw !== "") {
                imageToDraw = newImageToDraw;
            }
            addIsoTileToGrid(Math.floor(coords.x), Math.floor(coords.y), lvlToAddTile);
        }
        else if(evt.button === 2){
            cvsManager.rightMouseClicked = true;
            let coords = convertCoord(cvsManager.mouseWorld.x, cvsManager.mouseWorld.y, 0, 0, tileWidth, tileHeight);
            removeIsoTileToGrid(Math.floor(coords.x), Math.floor(coords.y), lvlToAddTile);
        }

    });
    cvsManager.listenFor("mouseup", (evt) => {
        cvsManager.leftMouseClicked = false;
        cvsManager.rightMouseClicked = false;
    });
    gameManager.addKeyListener((evt) => {
        if (evt.key === "g") {
            toDrawGrid = !toDrawGrid;
        }
        if (evt.key === "h") {
            displayOnlyCurrentLevel = !displayOnlyCurrentLevel;
        }
        if (evt.key === "z") {
            //undoCreation();
        }
        if (evt.keyCode >= 48 && evt.keyCode <= 57) {
            lvlToAddTile = Number(evt.key)
        }
    });
    cvsManager.moveCamera(-600, -100);
}

function animate() {
    requestAnimationFrame(animate);
    cvsManager.clear();
    isos.forEach((isoLvl, indexLvl) => {
        if (displayOnlyCurrentLevel && (indexLvl !== lvlToAddTile)) return true;
        isoLvl.forEach((isoX, indexX) => {
            isoX.forEach((isoY, indexY) => {
                drawIsoTileImage(isoY, indexX - indexLvl, indexY - indexLvl, 0, 0, tileWidth, tileHeight);
            });
        });
    });
    if (toDrawGrid) {
        drawGrid(0, 0, maxX, maxY, tileWidth, tileHeight);
    }
    imageList.draw(cvsManager.ctx, cvsManager.camera);
    moveAroundWithCamera();
}

function addIsoTileToGrid(x, y, lvl) {

    if (x >= maxX || y >= maxY || x < 0 || y < 0) return;

    if (!isos[lvl]) {
        isos[lvl] = [];
    }
    if (!isos[lvl][x]) {
        isos[lvl][x] = [];
    }
    if (isos[lvl][x][y]) {
        return;
    } else {
        added.push({x: x, y: y, lvl: lvl});
        isos[lvl][x][y] = imageToDraw;
    }
}

function removeIsoTileToGrid(x, y, lvl){
    if (x >= maxX || y >= maxY || x < 0 || y < 0) return;
    if(isos[lvl] && isos[lvl][x] && isos[lvl][x][y]){
        isos[lvl][x][y] = "";
    }
}

function addIsoTileToGridRec(x, y, lvl) {

    if (x > maxX || y > maxY || x < 0 || y < 0) return;

    if (!isos[lvl]) {
        isos[lvl] = [];
    }
    if (!isos[lvl][x]) {
        isos[lvl][x] = [];
    }
    if (isos[lvl][x][y]) {
        addIsoTileToGrid(x, y, lvl + 1);
    } else {
        added.push({x: x, y: y, lvl: lvl});
        isos[lvl][x][y] = "dirtHigh";
    }
}

function undoCreation() {
    let obj = added[added.length - 1];
    if (!obj) return;
    isos[obj.lvl][obj.x][obj.y] = "";
    added.splice(added.length - 1, 1);
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

function drawIsoGivenGridCoords(localX, localY, isoX, isoY, isoW, isoH) {
    let globalX = isoX + (localX - localY) * isoW / 2;
    let globalY = isoY + (localX + localY) * isoH / 2;
    fillIsoTile(globalX, globalY, isoW, isoH);
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

function drawIsoTileImage(img, localX, localY, isoX, isoY, isoW, isoH) {
    if (img === "") return;
    let globalX = isoX + (localX - localY) * isoW / 2;
    let globalY = isoY + (localX + localY) * isoH / 2;
    cvsManager.ctx.drawImage(gameManager.images[img], globalX - 49, globalY);
}

function fillIsoTile(x, y, w, h) {
    cvsManager.ctx.beginPath();
    cvsManager.ctx.moveTo(x, y);
    cvsManager.ctx.lineTo(x - w / 2, y + h / 2);
    cvsManager.ctx.lineTo(x, y + h);
    cvsManager.ctx.lineTo(x + w / 2, y + h / 2);
    cvsManager.ctx.lineTo(x, y);
    cvsManager.ctx.fill();
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

