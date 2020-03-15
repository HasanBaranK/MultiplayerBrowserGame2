//server side
let collisionFunctions = require("./collision.js");
let mainFunctions = require("../server.js");
module.exports = {
    calculateAllProjectiles
}

function distance(sx,sy, x, y) {
    let xDist = Math.abs(sx - x);
    let yDist = Math.abs(sy - y);

    return  Math.sqrt(xDist * xDist + yDist * yDist)
}

function explosionHitCheck(x,y,explosionRadius, explosionDamage, players,io,items,currentGameTime) {
    let anyOneHit = false;
    for (let key in players) {
        let object;
        if(players[key].mob !== undefined && players[key].mob !== null){
            object = cloneMe(players[key].mob)
        }else {
            object = cloneMe(players[key])
        }
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

        let dist = distance(object.x,object.y, x, y);

        if(dist < explosionRadius){
            anyOneHit = true;
            if(players[key].mob !== undefined && players[key].mob !== null){
                players[key].mob.health -= explosionDamage / dist;
                console.log(players[key].mob.health)
                if (players[key].mob.health <= 0) {
                    console.log(key)
                    players.splice(key, 1);
                    //delete mobs[object.key]
                    //console.log("dead")
                    addItem(io,items,"coin",players[key].mob.x,players[key].mob.y,players[key].mob.x +5,players[key].mob.y +5);
                }
                io.emit("mobs", players);
            }else {
                players[key].health -= explosionDamage / dist;
                if (players[key].health <= 0) {
                    players[key].isDead = true;
                    // console.log("dead")
                }
                let obj = {
                    players: players,
                    gameTime: currentGameTime
                }
                io.emit("players", obj);
            }
        }




    }


    return anyOneHit;
}

function calculateAllProjectiles(io,projectiles, currentGameTime, players,quadTree,mobs,items) {

    for (let i = 0; i < projectiles.length; i++) {
        let projectile = projectiles[i];
        let time = currentGameTime - projectile.gameTimeFire;

        //Advanced slowing down arrow
        let t = 60;
        let v0 = projectile.power;
        let g = v0 / t;
        if (v0 / g <= time) {
            let x = projectile.startX + (v0 * time - 1 / 2 * g * time * time) * projectile.cos;
            let y = projectile.startY+ (v0 * time - 1 / 2 * g * time * time) * projectile.sin;
            doExplosion(x,y,projectile,players,io,items,mobs)
            projectiles.splice(i, 1);
            //console.log((v0 * time - 1 / 2 * g * time * time))
            continue;
        } else {
            let x = projectile.startX + (v0 * time - 1 / 2 * g * time * time) * projectile.cos;
            let y = projectile.startY+ (v0 * time - 1 / 2 * g * time * time) * projectile.sin;

            let obj = {
                x: x ,
                y: y ,
                width: projectile.width,
                height: projectile.height,
            }
            let objects = collisionFunctions.quadTreeObjectsByPosition(obj, quadTree);
            let object = collisionFunctions.checkCollision(obj, objects)
            if (object !== false) {
                doExplosion(x,y,projectile,players,io,items,mobs)
                projectiles.splice(i, 1);
                //console.log("hit object");
                continue;
            }
            object = checkIfHitPlayer(obj, players,projectile.origin)
            if (object !== false) {
                doExplosion(x,y,projectile,players,io,items,mobs)
                projectiles.splice(i, 1);
                //console.log("hit player");
                object.health -= 10;
                if (object.health <= 0) {
                    object.isDead = true;
                   // console.log("dead")
                }
                let obj = {
                    players:players,
                    gameTime: currentGameTime
                }
                io.emit("players",obj);
                continue;
            }
            if(projectile.origin === "0"){

            }else {
                object = checkIfHitMob(obj, mobs)
                if (object !== false) {
                    doExplosion(x,y,projectile,players,io,items,mobs)
                    projectiles.splice(i, 1);
                    //console.log("hit mob");
                    object.mob.health -= 10;
                    if (object.mob.health <= 0) {
                        mobs.splice(object.key, 1);
                        //delete mobs[object.key]
                        //console.log("dead")
                        addItem(io,items,"coin",object.mob.x,object.mob.y,object.mob.x +5,object.mob.y +5);
                    }
                    io.emit("mobs", mobs);
                    continue;
                }
            }

        }
    }
}
function doExplosion(x,y,projectile,players,io,items,mobs) {
    if(projectile.explosive) {
        let anyOneHit = explosionHitCheck(x, y, projectile.explosionRadius, projectile.explosionDamage, players, io, items)
        anyOneHit = explosionHitCheck(x, y, projectile.explosionRadius, projectile.explosionDamage, mobs, io, items)
    }
}

function cloneMe(me) {
    return {
        x: me.x,
        y: me.y,
        width: me.width,
        height: me.height
    }
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

function cloneMob(mob) {
    let mob2 = {

        x: mob.x,
        y: mob.y,
        width: mob.width,
        height: mob.height,
        matrix: mob.matrix,
        path: mob.path,
        speed: mob.speed,
        health: mob.health,
        attack: mob.attack,
    }
    return mob2;
}

function checkIfHitMob(projectile,mobs) {

    for (let key in mobs) {

        let object = cloneMob(mobs[key])
        let offset = {
            x: 0,
            y: 0,
            width: 32,
            height: 32,
        }
        object.x += offset.x
        object.y += offset.y
        object.width = offset.width
        object.height = offset.height
        if (projectile.x < object.x + object.width &&
            projectile.x + projectile.width > object.x &&
            projectile.y < object.y + object.height &&
            projectile.y + projectile.height > object.y) {
            let obj = {
                key:key,
                mob:mobs[key]
            }
            return obj;
            // collision detected!
        }
    }

    return false;
}
function addItem (io,items,name, minX, minY, maxX, maxY) {
    items.push({name: name, x: minX /*+ Math.random() * (maxX - minX)*/, y: minY /*+ Math.random() * (maxY - minY)*/});
    //console.log(items)
    io.emit("items",items);
}
