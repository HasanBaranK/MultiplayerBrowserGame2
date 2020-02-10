let cvs, ctx, keys = {}, socket, data = {}, images = {};
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
            console.log(data);
            socket.emit("newplayer", {});
        });
        socket.on("images", (res)=>{
            images = res;
            socket.emit("getdata");
        });
        socket.on("joined", (res)=>{
            console.log(res);
            console.log("joined game")
        })
    });
    animate();
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
        camera.move(camera.speed,0);
    }
    if(keys["d"]){
        camera.move(-camera.speed,0);
    }
    if(keys["s"]){
        camera.move(0,-camera.speed);
    }
    if(keys["w"]){
        camera.move(0,camera.speed);
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
        console.log('Finished loading images');
        buttons['inventory'] = new UIButton('Inventory', 0, 0, images['inventory'], 32, 32)
        buttons['inventoryopen'] = new UIButton('Inventoryopen', 0, 0, images['inventoryopen'], 32, 32)
        displays['inventory'] = new Inventory('Inventory',images['inventory_UI'], 80, 50, 1, 9, 13, 5, 32, 16,14,29)
        displays['quickselect'] = new QuickSelect('Quickselect', images['quickselect_UI'], 0,0,0,0,1,9,32,12,2,17)

        displays['healthbarframe'] = new BarFrame('barframe', 0, 0, images['health_bg_upscaled'], 200, 200/12.75)
        displays['energybarframe'] = new BarFrame('barframe', 0, 0, images['health_bg_upscaled'], 200, 200/12.75)
        displays['xpbarframe'] = new BarFrame('barframe', 0, 0, images['health_bg_upscaled'], 600, 200/12.75)

        displays['healthbar'] = new Bar('healthbar', 0, 0, images['health_fg_upscaled'], 196, 180/12.75)
        displays['energybar'] = new Bar('energybar', 0, 0, images['energy_fg_upscaled'], 196, 180/12.75)
        displays['xpbar'] = new Bar('xpbar', 0, 0, images['xp_fg_upscaled'], 595, 200/12.75)
        displays['chest'] = new Chest('chest', images['chest_UI'], 32*18, 32*6, 0, 3, 10, 3, 32, 32)

        displays['messagebox'] = new MessageBox(cvs.width - 311, cvs.height - 29 - 150 - 10, 308, 150)
        displays['crafting'] = new Crafting('Crafting',images['craft_UI'], cvs.width / 2 - 240, 200, 0, 2, 13, 2, 32, 12, images['craftbutton_UI'])
        socket.emit('new player')
        socket.emit('map',)
        ctxBackground.drawImage(images['background01'], 0, 0, cvs.width, cvs.height)
        window.requestAnimationFrame(game)
    });
}
