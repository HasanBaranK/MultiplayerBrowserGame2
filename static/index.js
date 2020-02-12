/////////////////////INITIALIZATION CODE//////////////////////////
let cvs, ctx, keys = {}, socket, data = {}, images = {}, imageNames = {}, promises = [], players = {}, me = undefined,
    currentCoords = {}, animator = {state:"idle"};
let camera = new Camera(0, 0, 0);
let requestId;

$(document).ready(init);

/////////////////////GAME FUNCTIONS//////////////////////////////

function init(){

    cvs = $("#canvas")[0];
    ctx = cvs.getContext("2d");

    editorConfig();
    configure();

    socket = io.connect('http://localhost:5000');
    socket.on("connect", () => {
        socket.emit("getimages", {});
        socket.on("data", (res) => {
            data = res;
            console.log(data)
            socket.emit("newplayer", {});
        });
        socket.on("images", (res) => {
            imageNames = res;
            socket.emit("getdata");
        });
        socket.on("joined", (res) => {
            loadImagesThenAnimate(imageNames);
            console.log("joined game");
        });
        socket.on("players", (res) => {
            players = res;


            if(me === undefined){
                me = players[socket.id]

            }else {
                let updated = players[socket.id];
                updated.x = me.x;
                updated.y = me.y;
                me = updated;


            }

            socket.emit("players");
        });
    });
}

function setUpAnimations(){
    animator.player = new Player();
    let speed = 80;
    animator.player.addAnimation("runUP", images["run"], 0, 7, 0, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runUPRIGHT", images["run"], 0, 7, 1, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runRIGHT", images["run"], 0, 7, 2, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runDOWNRIGHT", images["run"], 0, 7, 3, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runDOWN", images["run"], 0, 7, 4, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runDOWNLEFT", images["run"], 0, 7, 5, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runLEFT", images["run"], 0, 7, 6, 32, 32, 32, 32, speed);
    animator.player.addAnimation("runUPLEFT", images["run"], 0, 7, 7, 32, 32, 32, 32, speed);

    animator.player.addAnimation("idle", images["idle"], 0, 7, 4, 32, 32, 32, 32, 120);
}

function configure() {
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    cvs.style.border = 'solid black 1px';

    currentCoords.x = cvs.width / 2 - 16;
    currentCoords.y = cvs.height / 2 - 16;
}

function animate() {
    update();
    requestId = requestAnimationFrame(animate);
}
let lastMoveTime;
function update() {
    //socket.emit("movement", {"w": keys["w"], "a": keys["a"], "s": keys["s"], "d": keys["d"]});
    cameraFollow();
    //doTheMovement();
    ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
    drawMap();
    drawPlayer();
    drawTreeMap();
    drawPlayerCollision()
    drawMapCollision2(data.collisionMap)
}

function doTheMovement(){
    let locationChanged = false;
    let quadTree = [];
    let d = new Date();
    let currentTime = Math.round(d.getTime());
    if(!lastMoveTime) {lastMoveTime = currentTime};
    if (lastMoveTime + 5 < currentTime) {
        lastMoveTime = currentTime;
        if (keys["a"]) {
            if (move(0, data.collisionMap, quadTree)) {
                locationChanged = true;
            }

        }
        if (keys["d"]) {
            if (move(1, data.collisionMap, quadTree)) {
                locationChanged = true;
            }
        }
        if (keys["s"]) {
            if (move(2, data.collisionMap, quadTree)) {
                locationChanged = true;
            }
        }
        if (keys["w"]) {
            if (move(3, data.collisionMap, quadTree)) {
                locationChanged = true;
            }
        }
    }else {
        console.log("does not let")
    }
    if (locationChanged) {
        socket.emit("movement", {"w": keys["w"], "a": keys["a"], "s": keys["s"], "d": keys["d"], "x": me.x, "y": me.y});
    }
}

function drawPlayer(){
    let moved = false;
    if(keys["w"] && keys["d"]){
        animationChecker("runUPRIGHT");
        moved = true;
    }
    else if(keys["w"] && keys["a"]){
        animationChecker("runUPLEFT");
        moved = true;
    }
    else if(keys["s"] && keys["d"]){
        animationChecker("runDOWNRIGHT");
        moved = true;
    }
    else if(keys["s"] && keys["a"]){
        animationChecker("runDOWNLEFT");
        moved = true;
    }
    else if(keys["w"]){
        animationChecker("runUP");
        moved = true;
    }
    else if(keys["s"]){
        animationChecker("runDOWN");
        moved = true;
    }
    else if(keys["a"]){
        animationChecker("runLEFT");
        moved = true;
    }
    else if(keys["d"]){
        animationChecker("runRIGHT");
        moved = true;
    }
    else{
        animationChecker("idle");
    }

    if(moved){
        doTheMovement();
    }

}

function animationChecker(stateName){
    if(animator.state!==stateName){
        animator.player.animations[animator.state].reset();
    }
    animator.state = stateName;
    animator.player.draw(ctx, stateName, me.x, me.y);
}

function cameraFollow(){
    if (me.x !== currentCoords.x || me.y !== currentCoords.y) {
        let xDifference = (currentCoords.x - me.x);
        let yDifference = (currentCoords.y - me.y);
        camera.move(ctx, -xDifference, -yDifference);
        currentCoords.x = me.x;
        currentCoords.y = me.y;
    }
}

function drawMap() {
    for (blockX in data.map) {
        for (blockY in data.map[blockX]) {
            let block = data.map[blockX][blockY];
            if (block) {
                ctx.drawImage(images[block.tile], blockX, blockY, 64, 64);
            }
        }
    }
}

function drawTreeMap(){
    for (tree in data.treeMap) {
        let block = data.treeMap[tree];
        if ((block.name).includes("rock")) {
            ctx.drawImage(images[block.name], block.x, block.y, 32, 32);
        } else {
            ctx.drawImage(images[block.name], block.x, block.y);
        }
    }
}

function drawMapCollision(map) {
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    for (let block in map) {
        for (let insideBlock in map[block]) {
            if (map[block][insideBlock]) {
                console.log(map[block][insideBlock])
                ctx.fillRect(block - 48, insideBlock - 48, 32, 32);
            }
        }

    }
    ctx.restore()
}
function drawPlayerCollision() {
    let player = cloneMe(me);
    let offset = {
        x:10,
        y:17,
        width:14,
        height:14,
    }
    player.x += offset.x
    player.y += offset.y
    player.width = offset.width
    player.height = offset.height
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    //ctx.fillStyle = "rgba(255,0,18,0.7)";
    //ctx.fillRect(me.x, me.y, me.width, me.height);
    ctx.restore()
}
function drawMapCollision2(map) {
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    for (let i = 0; i < map.length; i++) {

        ctx.fillRect(map[i].x, map[i].y, map[i].width, map[i].height);

    }
    ctx.restore()
}

////////////////HTML EVENTS CODE////////////////////////

// window.addEventListener("resize", () => {
//     let width = window.innerWidth;
//     let height = window.innerHeight;
//     cvs.width = width;
//     cvs.height = height;
// });

$(window).keydown((key) => {
    keys[key.key] = true;
});

$(window).keyup((key) => {
    keys[key.key] = false;
});

//////////////////////UTILS/////////////////////////////////

function loadImagesThenAnimate(folders) {
    for (let folder in folders) {
        for (let image in folders[folder]) {
            promises.push(new Promise((resolve, reject) => {
                img = new Image();
                img.onload = function () {
                    resolve('resolved')
                };
                img.src = './images/' + folder + '/' + folders[folder][image];
                images[folders[folder][image].split('.png')[0]] = img
            }))
        }
    }
    Promise.all(promises).then(() => {
        setUpAnimations();
        requestId = window.requestAnimationFrame(animate);
    });
}
//////////////////////Editor//////////////////////////////////

let editorMode = false;
let rectangles = [];
let selectedRectangleIndex = -1;
let mousePosition = {};
let imageName;
let timebefore = Date.now();
let timenow = Date.now();

function editorConfig(){
    $("#editor").click(()=>{
        if(!editorMode){
            $("#editor")[0].innerText = "Game";
            $("#add")[0].style.display = "block";
            $("#imagename")[0].style.display = "block";
            $("#select")[0].style.display = "block";
            editorMode = true;
            ctx.clearRect(camera.x,camera.y,cvs.width,cvs.height);
            camera.set(ctx,0,0);
            window.cancelAnimationFrame(requestId);
            requestId = window.requestAnimationFrame(editor);
        }
        else{
            $("#editor")[0].innerText = "Editor";
            $("#add")[0].style.display = "none";
            $("#imagename")[0].style.display = "none";
            $("#select")[0].style.display = "none";
            editorMode = false;
            ctx.clearRect(camera.x,camera.y,cvs.width,cvs.height);
            camera.restore();
            window.cancelAnimationFrame(requestId);
            requestId = window.requestAnimationFrame(animate);
        }
    });

    $("#add").click(()=>{
        addRectangle(camera.x + cvs.width/2 - 50, camera.y + cvs.height / 2 - 50, 100, 100);
    });

    $("#select").click(()=>{
        imageName = $("#imagename")[0].value;
    });

    $("#canvas").click((evt)=>{
        mousePosition.x = evt.offsetX || evt.layerX;
        mousePosition.y = evt.offsetY || evt.layerY;
        checkRectangleIndex(mousePosition.x + camera.x, mousePosition.y + camera.y);
    });
}

////////////////////COLLISION///////////////////////////////

function move(direction, collisionMap, quadTree) {
    let player = cloneMe(me);
    let offset = {
        x:10,
        y:17,
        width:14,
        height:14,
    }
    player.x += offset.x
    player.y += offset.y
    player.width = offset.width
    player.height = offset.height
    let speed = 2;
    if (direction === 0) {
        for (let i = 0; i < collisionMap.length; i++) {

            player.x -= speed;
            if (checkCollision(player, collisionMap[i])) {
                return false;
            }
        }

        me.x -= speed;
    } else if (direction === 1) {
        for (let i = 0; i < collisionMap.length; i++) {

            player.x += speed;
            if (checkCollision(player, collisionMap[i])) {
                return false;
            }
        }
        me.x += speed;
    } else if (direction === 2) {
        for (let i = 0; i < collisionMap.length; i++) {

            player.y += speed;
            if (checkCollision(player, collisionMap[i])) {
                return false;
            }
        }
        me.y += speed;
    } else if (direction === 3) {
        for (let i = 0; i < collisionMap.length; i++) {

            player.y -= speed;
            if (checkCollision(player, collisionMap[i])) {
                return false;
            }
        }
        me.y -= speed;
    }
    return true;
}

function checkCollision(me, object) {

    if (me.x < object.x + object.width &&
        me.x + me.width > object.x &&
        me.y < object.y + object.height &&
        me.y + me.height > object.y) {
        return true;
        // collision detected!
    }
    return false;

}
function cloneMe(me) {
    let player ={
        x:me.x,
        y:me.y,
        width:me.width,
        height:me.height
    }
    return player
}

function editor(){
    updateEditor();
    requestId = requestAnimationFrame(editor);
}

function updateEditor(){
    timenow = Date.now();
    if(timenow - timebefore > 30){
        timebefore = timenow;
        if(selectedRectangleIndex != -1){
            let r = rectangles[selectedRectangleIndex];
            if(keys["w"]){
                rectangles[selectedRectangleIndex].y--;
            }
            if(keys["s"]){
                rectangles[selectedRectangleIndex].y++;
            }
            if(keys["a"]){
                rectangles[selectedRectangleIndex].x--;
            }
            if(keys["d"]){
                rectangles[selectedRectangleIndex].x++;
            }
            if(keys["ArrowUp"] && r.h > 5){
                rectangles[selectedRectangleIndex].h--;
            }
            if(keys["ArrowDown"]){
                rectangles[selectedRectangleIndex].h++;
            }
            if(keys["ArrowLeft"] && r.w > 5){
                rectangles[selectedRectangleIndex].w--;
            }
            if(keys["ArrowRight"]){
                rectangles[selectedRectangleIndex].w++;
            }
            if(keys["x"]){
                rectangles.splice(selectedRectangleIndex,1);
                selectedRectangleIndex = -1;
            }
            if(keys["p"]){
                let message = {name:imageName,rectangles:[]};
                for (let rectangle in rectangles){
                    let r = rectangles[rectangle];
                    let xOffset = r.x - (camera.x + cvs.width / 2);
                    let yOffset = r.y - (camera.y + cvs.height / 2);
                    message.rectangles.push({x:xOffset, y:yOffset, width:r.w, height:r.h})
                }
                console.log(message);
                //alert(JSON.stringify(message))
                socket.emit("updatecollision",message);
            }
        }
    }
    ctx.clearRect(camera.x,camera.y,cvs.width,cvs.height);
    if(imageName){
        try{
            ctx.drawImage(images[imageName], camera.x + cvs.width / 2, camera.y + cvs.height / 2);
            ctx.beginPath();
            ctx.rect(camera.x + cvs.width / 2, camera.y + cvs.height / 2, images[imageName].width, images[imageName].height);
            ctx.stroke();
        }catch (e) {

        }

    }
    for (let rectangle in rectangles){
        let r = rectangles[rectangle];
        if(rectangle == selectedRectangleIndex){
            ctx.strokeStyle = "yellow";
            ctx.beginPath();
            ctx.rect(r.x, r.y, r.w, r.h);
            ctx.stroke();
            ctx.strokeStyle = "black"
        }
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w, r.h);
        ctx.stroke();
    }
}

function addRectangle(x, y, w, h){
    rectangles.push(new Rectangle(x, y, w, h));
}

function checkRectangleIndex(x, y){
    for(let rectangle in rectangles){
        let r = rectangles[rectangle];
        if(x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h){
            selectedRectangleIndex = rectangle;
            return;
        }
    }
}

class Rectangle{
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}
