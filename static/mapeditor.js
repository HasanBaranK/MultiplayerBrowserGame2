/////////////////////INITIALIZATION CODE//////////////////////////
import {Camera, Player, Inventory, PopUpManager, Bar, ImageList} from "./classes.js";

let cvs, ctx, keys = {}, socket, data = {}, images = {}, imageNames = {}, promises = [], players = {}, me = undefined,
    currentCoords = {}, animator = {state: "idle"}, uis = {}, gameState = {}, popUpManager = new PopUpManager(),
    vendors = {};
let camera = new Camera(0, 0, 0);
let mapEditorCamera = new Camera(0, 0, 0);
let requestId;
let mapcvs, mapctx;
let actualmapcvs, actualmapctx;
let actualMousePosition = {};
let isInDeadScreen = false;

$(document).ready(init);
let editorMode = false;
let mousePosition = {};

function init() {
    document.addEventListener('contextmenu', event => event.preventDefault());
    cvs = $("#canvas")[0];

    ctx = cvs.getContext("2d");
    mapcvs = $("#mapeditorcanvas")[0];
    mapctx = mapcvs.getContext("2d");
    actualmapcvs = $("#actualmapcanvas")[0];
    actualmapctx = mapcvs.getContext("2d");

    mapEditorConfig();
    configure();

    socket = io.connect({reconnectionDelay: 1000, reconnection: false});
    socket.on("connect", () => {
        socket.emit("getimages", {});
        socket.on("images", (res) => {
            imageNames = res;
            socket.emit("newplayer", {});
        });
        socket.on("joined", (res) => {
            loadImagesThenAnimate(imageNames);
            console.log("joined game");
        });
    });
}

function configure() {
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    cvs.style.border = 'solid black 1px';
    cvs.style.position = "absolute";
    cvs.zIndex = 9;

    mapcvs.width = window.innerWidth;
    mapcvs.height = window.innerHeight;
    mapcvs.style.border = 'solid black 1px';
    mapcvs.style.position = "absolute";
    mapcvs.style.zIndex = 10;

    actualmapcvs.width = window.innerWidth;
    actualmapcvs.height = window.innerHeight;
    actualmapcvs.style.border = 'solid black 1px';
    actualmapcvs.style.position = "absolute";
    actualmapcvs.style.zIndex = 8;


    currentCoords.x = cvs.width / 2 - 16;
    currentCoords.y = cvs.height / 2 - 16;

    $("#canvas").click((evt) => {
        mousePosition.x = evt.offsetX || evt.layerX;
        mousePosition.y = evt.offsetY || evt.layerY;
        actualMousePosition.x = mousePosition.x + camera.x;
        actualMousePosition.y = mousePosition.y + camera.y;
    });
}

let scale = 1;

document.getElementById("mapeditorcanvas").addEventListener('wheel',function(event){
    //console.log(event.deltaY)
    if(event.deltaY < 0){
        if(scale <= 0.05){
            scale = 0.05;
        }else {
            scale -= 0.05;
        }
    }else {
        scale += 0.05;
    }
    console.log(scale)
    return false;
}, false);


function printMousePos(event) {
    /*console.log(
         "clientX: " + (event.clientX+camera.x) +
         " - clientY: " + (event.clientY+camera.y));
    console.log(currentCoords.x,currentCoords.y);
    console.log(currentCoords.x,currentCoords.y);*/
    if (!mapEditorMode && !editorMode && !isInDeadScreen) {
    }
}

document.getElementById("mapeditorcanvas").addEventListener("click", printMousePos);

////////////////HTML EVENTS CODE////////////////////////

// window.addEventListener("resize", () => {
//     let width = window.innerWidth;
//     let height = window.innerHeight;
//     cvs.width = width;
//     cvs.height = height;
// });

$(window).keydown((key) => {
    keys[key.key] = true;
    let keyPressed = key.key;
    if (key.key === "m" && mapEditorMode) {
        if(drawSelection === true){
            drawSelection = false;
        }else {
            drawSelection = true;
        }
    }
    if(key.key === "l" && mapEditorMode){
        socket.emit("newmap", {name:Date.now().toString(),gridSize:gridSize, gridBasedMapArray:gridBasedMapArray, nonGridBasedMapArray:nonGridBasedMapArray})
    }
    if(key.key === "z" && mapEditorMode){
        if(nonGridBasedMapArray.length > 0){
            nonGridBasedMapArray.splice(nonGridBasedMapArray.length - 1, 1);
        }
    }
});

$(window).keyup((key) => {
    keys[key.key] = false;
});

//////////////////////UTILS/////////////////////////////////

function loadImagesThenAnimate(folders) {
    for (let folder in folders) {
        for (let image in folders[folder]) {
            promises.push(new Promise((resolve, reject) => {
                let img = new Image();
                img.onload = function () {
                    resolve('resolved')
                };
                img.src = './images/' + folder + '/' + folders[folder][image];
                images[folders[folder][image].split('.png')[0]] = img
            }))
        }
    }
    Promise.all(promises).then(() => {
        setUpImagesListForMapEditor();
    });
}


/////////////////////////Map Editor/////////////////////////////
let mapEditorMode = false;
let imageListObject;
let imageSelected = undefined;
let gridSize = 64;
let gridBasedMapArray = [];
let nonGridBasedMapArray = [];
let mapXMin = 0;
let mapXMax = gridSize * 100;
let mapYMin = 0;
let mapYMax = gridSize * 100;
let delayForMovingCam = Date.now();
let drawSelection = true;
let leftMouseClicked = false;
let rightMouseClicked = false;
let delayForRightClick = Date.now();
let sprayOn = false;
let sprayAmount = 5*gridSize;
function mapEditor() {
    updateMapEditor();
    requestId = requestAnimationFrame(mapEditor);
}

function updateMapEditor() {
    let currentTime = Date.now();
    let allowedToMove = false;
    if (currentTime - delayForMovingCam > 50) {
        allowedToMove = true;
        delayForMovingCam = Date.now();
    }
    actualmapctx.clearRect(mapEditorCamera.x, mapEditorCamera.y, actualmapcvs.width + mapEditorCamera.x, actualmapcvs.height + mapEditorCamera.y);

    if (allowedToMove) {
        if (keys["a"]) {
            mapEditorCamera.move(actualmapctx, -gridSize, 0);
            if (mapEditorCamera.x < 0 || mapEditorCamera.y < 0) {
                mapEditorCamera.move(actualmapctx, gridSize, 0);
            }
        }
        if (keys["d"]) {
            mapEditorCamera.move(actualmapctx, gridSize, 0);
            if (mapEditorCamera.x < 0 || mapEditorCamera.y < 0) {
                mapEditorCamera.move(actualmapctx, -gridSize, 0);
            }
        }
        if (keys["s"]) {
            mapEditorCamera.move(actualmapctx, 0, gridSize);
            if (mapEditorCamera.x < 0 || mapEditorCamera.y < 0) {
                mapEditorCamera.move(actualmapctx, 0, -gridSize);
            }
        }
        if (keys["w"]) {
            mapEditorCamera.move(actualmapctx, 0, -gridSize);
            if (mapEditorCamera.x < 0 || mapEditorCamera.y < 0) {
                mapEditorCamera.move(actualmapctx, 0, gridSize);
            }
        }
    }
    if (leftMouseClicked) {
        if (imageSelected) {


            let sprayX = 0;
            let sprayY = 0;

            if(sprayOn){
                sprayX = Math.floor(Math.random()*sprayAmount)
                sprayY = Math.floor(Math.random()*sprayAmount)
            }
            let placedXGrid = (mousePosition.x * 1/scale + mapEditorCamera.x* 1/scale)+sprayX;
            let placedYGrid = (mousePosition.y * 1/scale + mapEditorCamera.y* 1/scale)+sprayY;

            if(placedXGrid>mapXMin&&placedXGrid < mapXMax&&placedYGrid>mapYMin && placedYGrid < mapYMax){
                placedXGrid = Math.floor((placedXGrid / gridSize)) * gridSize;
                placedYGrid = Math.floor((placedYGrid / gridSize)) * gridSize;

                if (!gridBasedMapArray[placedXGrid / gridSize]) {
                    gridBasedMapArray[placedXGrid / gridSize] = [];
                }
                gridBasedMapArray[placedXGrid / gridSize][placedYGrid / gridSize] = {
                    tile: imageSelected,
                    x: placedXGrid,
                    y: placedYGrid
                };
            }
        }
    }
    if (currentTime - delayForRightClick > 200) {
        if (rightMouseClicked) {
            if (imageSelected) {
                nonGridBasedMapArray.push({
                    name: imageSelected,
                    x: mousePosition.x*1/scale + mapEditorCamera.x* 1/scale,
                    y: mousePosition.y*1/scale + mapEditorCamera.y* 1/scale
                });
            }
        }

        delayForRightClick = Date.now();
    }

    drawMapCreated();
    drawMapCreatedNonGrid();
    if (drawSelection) {
        imageListObject.draw(actualmapctx, mapEditorCamera);
    }

    if (imageSelected) {
        actualmapctx.drawImage(images[imageSelected], mousePosition.x + mapEditorCamera.x, mousePosition.y + mapEditorCamera.y, gridSize, gridSize);
    }
}

function setUpImagesListForMapEditor() {
    imageListObject = new ImageList(images, 10, 100, 32, 32, 10, 5, 5);
}

function drawGrid() {
    for (let x = 0; x < mapcvs.width; x++) {
        for (let y = 0; y < mapcvs.height; y++) {
            mapctx.save()
            mapctx.scale(scale,scale)
            mapctx.beginPath();
            mapctx.rect(x * gridSize, y * gridSize, gridSize, gridSize);
            mapctx.stroke();
            mapctx.restore()
        }
    }
}

function drawMapCreated() {
    for (let x in gridBasedMapArray) {
        for (let y in gridBasedMapArray[x]) {
            let thing = gridBasedMapArray[x][y];

            actualmapctx.save()
            actualmapctx.scale(scale, scale);
            //actualmapctx.rotate(0 * Math.PI /180);
            actualmapctx.drawImage(images[thing.tile], thing.x, thing.y, gridSize, gridSize);
            actualmapctx.restore()
             /*
            ctx.save();
            ctx.translate(thing.x,thing.y);
            ctx.rotate(0*Math.PI/180);
            actualmapctx.scale(scale,scale/2)
            ctx.drawImage(images[thing.tile],gridSize,gridSize);
            ctx.restore();*/
        }
    }
    actualmapctx.beginPath();
    actualmapctx.rect(mapXMin, mapYMin, mapXMax, mapYMax);
    actualmapctx.stroke();
}

function drawMapCreatedNonGrid() {
    for (let x in nonGridBasedMapArray) {
        let thing = nonGridBasedMapArray[x];
        actualmapctx.save()
        actualmapctx.scale(scale,scale)
        actualmapctx.drawImage(images[thing.name], thing.x, thing.y);
        actualmapctx.restore()
    }
    actualmapctx.save()
    actualmapctx.scale(scale,scale)
    actualmapctx.beginPath();
    actualmapctx.rect(mapXMin, mapYMin, mapXMax, mapYMax);
    actualmapctx.stroke();
    actualmapctx.restore()
}


function mapEditorConfig() {
    $("#mapeditor").click(() => {
        if (!mapEditorMode) {
            $("#editor")[0].style.display = "none";
            $("#mapeditor")[0].innerText = "Game";
            mapEditorMode = true;
            ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
            camera.set(ctx, 0, 0);
            drawGrid();
            window.cancelAnimationFrame(requestId);
            requestId = window.requestAnimationFrame(mapEditor);
        } else {
            $("#editor")[0].style.display = "block";
            $("#mapeditor")[0].innerText = "Map Editor";
            mapEditorMode = false;
            ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
            camera.restore(ctx);
            mapctx.clearRect(0, 0, mapcvs.width, mapcvs.height);
            window.cancelAnimationFrame(requestId);
        }
    });
    $("#mapeditorcanvas").contextmenu((evt) => {
        if (imageSelected) {
            nonGridBasedMapArray.push({
                name: imageSelected,
                x: mousePosition.x + mapEditorCamera.x,
                y: mousePosition.y + mapEditorCamera.y
            });
        }
    });
    $("#mapeditorcanvas").mouseup((evt) => {
        leftMouseClicked = false;
        rightMouseClicked = false;
    });
    $("#mapeditorcanvas").mousedown((evt) => {
        if (evt.button === 2) {
            rightMouseClicked = true;
        } else if (evt.button === 0) {
            leftMouseClicked = true;
        }
    });
    $("#mapeditorcanvas").click((evt) => {
        let imgWidth = 32;
        let imgHeight = 32;
        let x = 10;
        let y = 100;
        let xOff = 5;
        let yOff = 5;
        let xIndex = 0;
        let yIndex = 0;
        let xLimit = 10;
        if (drawSelection) {
            for (let imageName in images) {
                let xReal = x + (xIndex * (xOff + imgWidth)) + camera.x;
                let yReal = y + (yIndex * (yOff + imgHeight)) + camera.y;
                if (mousePosition.x >= xReal && mousePosition.x <= xReal + imgWidth && mousePosition.y >= yReal && mousePosition.y < yReal + imgHeight) {
                    imageSelected = imageName;
                    drawSelection = false;
                    console.log(imageSelected)
                }
                xIndex++;
                if (xIndex === xLimit) {
                    yIndex++;
                    xIndex = 0;
                }
            }
        }
        if (imageSelected) {
            let placedXGrid = (mousePosition.x *1/scale+ mapEditorCamera.x);
            let placedYGrid = (mousePosition.y*1/scale+ mapEditorCamera.y);

            if(placedXGrid>mapXMin&&placedXGrid < mapXMax&&placedYGrid>mapYMin && placedYGrid < mapYMax) {
                placedXGrid = Math.floor((placedXGrid / gridSize)) * gridSize;
                placedYGrid = Math.floor((placedYGrid / gridSize)) * gridSize;
                if (!gridBasedMapArray[placedXGrid / gridSize]) {
                    gridBasedMapArray[placedXGrid / gridSize] = [];
                }
                gridBasedMapArray[placedXGrid / gridSize][placedYGrid / gridSize] = {
                    tile: imageSelected,
                    x: placedXGrid,
                    y: placedYGrid
                };
            }
        }
    });
    $("#mapeditorcanvas").mousemove(function (evt) {
        mousePosition.x = evt.offsetX || evt.layerX;
        mousePosition.y = evt.offsetY || evt.layerY;
    });
    $("#mapeditorcanvas").click((evt) => {
        mousePosition.x = evt.offsetX || evt.layerX;
        mousePosition.y = evt.offsetY || evt.layerY;
    });
}
