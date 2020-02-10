/////////////////////INITIALIZATION CODE//////////////////////////
let cvs, ctx, keys = {}, socket, data = {}, images = {}, imageNames = {}, promises = [], players = {}, me = {}, currentCoords = {};
let camera = new Camera(0, 0, 0, 0, 4);

$(document).ready(init);
/////////////////////GAME FUNCTIONS//////////////////////////////

function init(){
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
    requestAnimationFrame(animate);
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
    // if(keys["a"]){
    //     camera.move(-camera.speed,0);
    // }
    // if(keys["d"]){
    //     camera.move(camera.speed,0);
    // }
    // if(keys["s"]){
    //     camera.move(0,camera.speed);
    // }
    // if(keys["w"]){
    //     camera.move(0,-camera.speed);
    // }
    ctx.clearRect(camera.x,camera.y,cvs.width,cvs.height);
    drawMap();
    ctx.fillRect(me.x - 16, me.y - 16, 32, 32);
}

function drawMap(){
    for(blockX in data.map){
        for(blockY in data.map[blockX]){
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
        window.requestAnimationFrame(animate)
    });
}
