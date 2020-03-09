import {sendProjectileServer, drawImageRotation, popUpManager} from "./game.js"
import {checkCollision, quadTreeObjectsByPosition} from "./collision.js"

function createProjectile(projectiles, name, startX, startY, currentX, currentY, dirX, dirY, power, quadTree, players, gameTimeFire) {
    let up = dirY - startY
    let down = dirX - startX
    let hip = Math.sqrt(up * up + down * down);
    /*console.log("info")
    console.log(up)
    console.log(down)
    console.log(hip)*/
    let sin = up / hip;
    let cos = down / hip;
    /*console.log(sin)
    console.log(cos)
    console.log("info")*/
    //drawImageRotation(ctx, name, currentX, currentY, 1, degree);
    let projectile = makeProjectileObject(projectiles, name, startX, startY, cos, sin, power, gameTimeFire);
    //console.log("degree")
    sendProjectileServer(projectile);
}

function makeProjectileObject(projectiles, name, startX, startY, cos, sin, power, gameTimeFire) {
    let Projectile = {
        name: name,
        startX: startX,
        startY: startY,
        cos: cos,
        sin: sin,
        power: power,
        gameTimeFire: gameTimeFire,
        origin: "",
    }
    return Projectile;
}

function calculateAllProjectiles(projectiles, currentGameTime, quadTree,players) {

    for (let i = 0; i < projectiles.length; i++) {
        let projectile = projectiles[i];
        let time = currentGameTime - projectile.gameTimeFire;


        /*console.log("time: " + time)
        console.log("time: " + currentGameTime)
        console.log("time: " + projectile.gameTimeFire)*/
        /*console.log("x: " + projectile.startX)
        console.log("y: " + projectile.startY)
        console.log("degree: " + projectile.sin)
        console.log("degree: " + projectile.cos)
        console.log(time * projectile.sin * 5)
        console.log(time * projectile.cos * 5)
        console.log(projectile.startY + time * projectile.sin)
        console.log(projectile.startX + time * projectile.cos)*/
        //V0.t - 1/2 .g.t^2
        //v02/2.g

        //Normal
        //let additionX = time * projectile.cos * 5;
        //let additionY = time * projectile.sin * 5;

        //drawImageRotation(projectile.name, projectile.startX + additionX, projectile.startY + additionY, 1, projectile.sin / projectile.cos);

        //Advanced slowing down arrow
        let t = 60;
        let v0 = 15;
        let g = v0 / t;

        if (v0 / g <= time) {
            projectiles.splice(i, 1);
            //console.log((v0 * time - 1 / 2 * g * time * time))
            continue;
        } else {
            /*console.log((v0 * time - 1 / 2 * g * time * time))
            console.log(1 / 2 * g * time * time)
            console.log(v0 * time)*/
            let x = projectile.startX + (v0 * time - 1 / 2 * g * time * time) * projectile.cos;
            let y = projectile.startY + (v0 * time - 1 / 2 * g * time * time) * projectile.sin;

            let obj = {
                x: x + 16,
                y: y + 9,
                width: 7,
                height: 5,
            }
            let objects = quadTreeObjectsByPosition(obj, quadTree);
            let object = checkCollision(obj, objects);
            if (object !== false) {
                projectiles.splice(i, 1);
                //tree hit   dothis
                //console.log(object);
                //console.log("hit");
                continue;
            }
            object = checkIfHitPlayer(obj, players,projectile.origin)
            //console.log(object)
            if (object !== false) {
                projectiles.splice(i, 1);
                //console.log("hit");
                popUpManager.addPopUp(object.x, object.y, 10);
                object.health -= 10;
                if (object.health <= 0) {
                    object.isDead = true;
                    //console.log("dead")
                }

                continue;
            }
            drawImageRotation(projectile.name, x, y, 1, projectile.sin / projectile.cos, projectile.sin, projectile.cos);

        }/*
            /*console.log(projectile.cos * projectile.power/ Math.pow(1.1,time))
            console.log(projectile.sin * projectile.power/ Math.pow(1.1,time))*/
        //let currentX = Math.floor(projectile.startX + projectile.cos * projectile.power/ Math.pow(1.3,time))
        //let currentY =Math.floor(projectile.startY +projectile.sin * projectile.power / Math.pow(1.3,time))
        //console.log(currentX+","+currentY)
        //drawImageRotation(projectile.name, Math.floor(currentX), Math.floor(currentY), 1, projectile.sin/projectile.cos);

    }
}

function ctg(x) {
    return 1 / Math.tan(x);
}

function moveProjectile(name, x, y, degree, power, time) {
    console.log(Math.cos(degree) * power / time)
    console.log(Math.sin(degree) * power / time)
    let currentX = x + Math.cos(degree) * power / time
    let currentY = y + Math.sin(degree) * power / time
    drawImageRotation(name, currentX, currentY, 1, degree);
}

function checkIfHitPlayer(projectile, players,origin) {

    for (let key in players) {
        if(key === origin){
            continue
        }
        let object = cloneMe(players[key])
        let offset = {
            x: 10,
            y: 17,
            width: 14,
            height: 14,
        }
        object.x += offset.x
        object.y += offset.y
        object.width = offset.width
        object.height = offset.height
        if (projectile.x < object.x + object.width &&
            projectile.x + projectile.width > object.x &&
            projectile.y < object.y + object.height &&
            projectile.y + projectile.height > object.y) {
            return players[key];
            // collision detected!
        }
    }

    return false;
}
function cloneMe(me) {
    return {
        x: me.x,
        y: me.y,
        width: me.width,
        height: me.height
    }
}
export {
    calculateAllProjectiles,
    createProjectile,
}
