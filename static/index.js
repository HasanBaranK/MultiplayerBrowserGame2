let cvs, ctx, keys = {}, socket, data = {}, images = [], promises = [];
let camera = new Camera(0, 0, 0, 0, 5);

console.log("hey");
$(document).ready(init);
////////////////////////

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
            console.log(res);
            images = res;
            socket.emit("getdata");
        });
        socket.on("joined", (res)=>{
            loadImagesThen(images);
            console.log("joined game")
        })
    });
}

function configure(){
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    cvs.style.border = 'solid black 1px';
}

function animate(){
    update();
    requestAnimationFrame(animate);
}

function update(){
    if(keys["a"]){
        camera.move(-camera.speed,0);
    }
    if(keys["d"]){
        camera.move(camera.speed,0);
    }
    if(keys["s"]){
        camera.move(0,camera.speed);
    }
    if(keys["w"]){
        camera.move(0,-camera.speed);
    }
    ctx.clearRect(camera.x,camera.y,cvs.width,cvs.height);
    ctx.fillRect(0,0,100,100);
}

////////////////////////

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
/////////////////////////

function loadImagesThen(folders){
    for(let folder in folders){
        for(let image in folders[folder]){
            promises.push(new Promise((resolve, reject) => {
                img = new Image();
                img.onload = function() {
                    resolve('resolved')
                }
                img.src = './images/' + folder + '/' + folders[folder][image];
                images[folders[folder][image].split('.png')[0]] = img
            }))
        }
    }
    Promise.all(promises).then(() => {
        window.requestAnimationFrame(animate)
    });
}
