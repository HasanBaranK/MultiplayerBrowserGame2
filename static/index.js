/////////////////////INITIALIZATION CODE//////////////////////////
let cvs, ctx, keys = {}, socket, data = {}, images = {}, imageNames = {}, promises = [], players = {}, me = {}, currentCoords = {};
let camera = new Camera(0, 0, 0, 0, 4);
let requestId;

$(document).ready(init);
/////////////////////GAME FUNCTIONS//////////////////////////////

function init(){

    editorConfig();

    cvs = $("#canvas")[0];
    ctx = cvs.getContext("2d");
    configure();

    socket = io.connect('http://localhost:5000');
    socket.on("connect", ()=>{
        socket.emit("getimages", {});
        socket.on("data", (res)=>{
            data = res;
            socket.emit("newplayer", {});
        });
        socket.on("images", (res)=>{
            imageNames = res;
            socket.emit("getdata");
        });
        socket.on("joined", (res)=>{
            loadImagesThenAnimate(imageNames);
            console.log("joined game");
        });
        socket.on("players", (res)=>{
            players = res;

            me = players[socket.id];
        });
    });
}

function configure(){
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    cvs.style.border = 'solid black 1px';

    currentCoords.x = cvs.width/2;
    currentCoords.y = cvs.height/2;
}

function animate(){
    update();
    requestId = requestAnimationFrame(animate);
}

function update(){
    socket.emit("movement", {"w":keys["w"], "a":keys["a"], "s":keys["s"],"d":keys["d"]});
    if(me.x !== currentCoords.x || me.y !== currentCoords.y){
        let xDifference = (currentCoords.x - me.x);
        let yDifference = (currentCoords.y - me.y);
        camera.move(-xDifference, -yDifference);
        currentCoords.x = me.x;
        currentCoords.y = me.y;
    }
    ctx.clearRect(camera.x,camera.y,cvs.width,cvs.height);
    drawMap();
    ctx.fillRect(me.x - 16, me.y - 16, 32, 32);
}

function drawMap(){
    for(let blockX in data.map){
        for(let blockY in data.map[blockX]){
            let block = data.map[blockX][blockY];
            if(block){
                ctx.drawImage(images[block.tile], blockX, blockY, 64, 64);
            }
        }
    }
    for(tree in data.treeMap){
        let block = data.treeMap[tree];
        ctx.drawImage(images[block.name], block.x, block.y);
    }
}

////////////////HTML EVENTS CODE////////////////////////

// window.addEventListener("resize", () => {
//     let width = window.innerWidth;
//     let height = window.innerHeight;
//     cvs.width = width;
//     cvs.height = height;
// });

$(window).keydown((key)=>{
    keys[key.key] = true;
});

$(window).keyup((key)=>{
    keys[key.key] = false;
});

//////////////////////UTILS/////////////////////////////////

function loadImagesThenAnimate(folders){
    for(let folder in folders){
        for(let image in folders[folder]){
            promises.push(new Promise((resolve, reject) => {
                img = new Image();
                img.onload = function() {
                    resolve('resolved')
                };
                img.src = './images/' + folder + '/' + folders[folder][image];
                images[folders[folder][image].split('.png')[0]] = img
            }))
        }
    }
    Promise.all(promises).then(() => {
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
            camera.set(0,0);
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
                    message.rectangles.push({x:xOffset, y:yOffset, w:r.w, h:r.h})
                }
                console.log(message);
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