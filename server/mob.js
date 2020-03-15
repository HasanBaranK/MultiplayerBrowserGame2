// for node.js
//import * as EasyStar from "easystarjs";

var PF = require('pathfinding');

function createMob(x, y, width, height, target, matrix) {

    let mob = {

        x: x,
        y: y,
        width: width,
        height: height,
        matrix: matrix,
        path: null,
        speed: 10,
        health: 20,
        attack: 10,
    }

    return mob
}

function initializePathFinder(matrix) {
    let grid = new PF.Grid(matrix);
    return grid;
}

function findClosestTarget(mob, players, searchDistance,projectiles,quadTree,gameTime,io) {

    let target = {
        x: null,
        y: null,
    }
    let distanceSmallest = null
    let selected;
    for (let key in players) {

        let object = players[key]
        let offset = {
            x: 10,
            y: 17,
            width: 14,
            height: 14,
        }
        let playerX = object.x + offset.x;
        let playerY = object.y + offset.y
        /*console.log("players")
        console.log(playerX)
        console.log(playerY)
        console.log("mobs")
        console.log(mob.x)
        console.log(mob.y)*/
        let distance = Math.sqrt((mob.x - playerX) * (mob.x - playerX) + (mob.y - playerY) * (mob.y - playerY))
        //console.log(distance)
        if (distanceSmallest === null || distanceSmallest > distance && distance <= searchDistance) {
            //console.log(distance)
            if(distance < searchDistance) {
                distanceSmallest = distance
                target.x = playerX;
                target.y = playerY;
                selected = object;
                if(distanceSmallest<375){
                    attackProjectile(io,mob,object,projectiles,quadTree,gameTime)
                }
            }

        }

    }
    mob.target = target;
    return target
}

function attack(mob,players) {

}
function makeProjectileObject(projectiles, name, startX, startY, cos, sin, power, gameTimeFire,width,height,explosive,explosiveDistance,explosiveDamage,damage) {
    let Projectile = {
        name: name,
        startX: startX,
        startY: startY,
        width: width,
        height: height,
        cos: cos,
        sin: sin,
        power: power,
        gameTimeFire: gameTimeFire,
        origin: "0",
        explosive: explosive,
        explosionRadius: explosiveDistance,
        explosionDamage: explosiveDamage,
        damage: damage
    }
    return Projectile;
}
function attackProjectile(io,mob,player,projectiles,quadTree,gameTime) {
    let up = player.y - mob.y
    let down = player.x - mob.x
    let hip = Math.sqrt(up * up + down * down);
    let sin = up / hip;
    let cos = down / hip;
    let projectile = makeProjectileObject(projectiles,"arrow2",mob.x,mob.y,cos,sin,15, gameTime,24,8,false,0,0,10)
    projectile.origin = "0";
    projectile.gameTimeFire = gameTime;
    let obj = {
        projectile: projectile,
        gameTime: gameTime,
    }
    projectiles.push(projectile);
    io.emit("projectile",obj);
}

/*function pathFinding(target,speed) {
    easystar.setGrid(matrix);
    easystar.setAcceptableTiles([0]);
    easystar.setIterationsPerCalculation(1000);
    easystar.findPath(0, 0, 4, 0, function( path ) {
        if (path === null) {
            //alert("Path was not found.");
        } else {
            easystar.calculate();

            //alert("Path was found. The first Point is " + path[0].x + " " + path[0].y);
        }
    });
}*/
let intervals = [];

function findPathForHero(mob, gridSize, grid,offset) {

    let xOffset =  0;
    let yOffset =  0;
    for (let i = 0; i < offset; i++) {
        if(i % 2=== 0){
            xOffset++;
        }else {
            yOffset++;
        }
    }

    let x = Math.floor(mob.x / gridSize)
    let y = Math.floor(mob.y / gridSize)
    let tx = Math.floor(mob.target.x / gridSize) + xOffset
    let ty = Math.floor(mob.target.y / gridSize) + yOffset
    // console.log(x +","+y)
    // console.log(tx +","+ty)
    //console.log(gridSize)
    //console.log(Math.floor(mob.target.x/gridSize))
    if (!isNaN(tx) && !isNaN(ty) && tx != null && ty !== null && tx !== undefined && ty !== undefined) {

        if (x == tx && ty == y) {
            return;
        }
        let gridBackup = grid.clone();
        var finder = new PF.AStarFinder();
        var path = finder.findPath(x, y, tx, ty, gridBackup);
        mob.path = path;

    }
}

function calculateAllMobs(io,mobs, players, matrix, gridSize, grid,projectiles,quadTree,gameTime) {

    let i= 0;
    for (let i = 0; i < mobs.length; i++) {
        let mob = mobs[i];

            try {
                calculateMob(mob, players, gridSize, grid, i, projectiles, quadTree, gameTime, io)
            }catch (e) {
                console.log("calculation error")
            }
    }

    //moveMobs(io,mobs, gridSize)


}
function calculateMob(mob,players,gridSize,gridBackup,i,projectiles,quadTree,gameTime,io){

    findClosestTarget(mob, players, 350,projectiles,quadTree,gameTime,io);

    if (mob.target !== null && !isNaN(mob.target.x) && !isNaN(mob.target.y)) {
        try {

                //console.log("calculating")
                findPathForHero(mob, gridSize, gridBackup, i);

        } catch (e) {

        }
    }else {
        console.log("no target")
    }
}
function moveMob(mob,gridSize) {
    let path = mob.path;
    if (path !== null) {
        //console.log(path)
        if (path.length > 1) {
            let nextLoc = path[1];
            mob.x = nextLoc[0] * gridSize;
            mob.y = nextLoc[1] * gridSize;
            path.shift();
        } else {
            return;
        }
    }
}
function moveMobs(io,mobs, gridSize) {
    for (let i = 0; i < mobs.length; i++) {
        let mob = mobs[i];
        let path = mob.path;
        if (path !== null) {
            //console.log(path)
                if (path.length > 1) {
                    let nextLoc = path[1];
                    //console.log("nextLoc: " + nextLoc)

                    // console.log(nextLoc)
                    // console.log("is it working")
                    // console.log(nextLoc[0])
                    // console.log(nextLoc[1])
                    // console.log("working")
                    //let nextLockX = nextLoc[0] * gridSize;
                    //let nextLockY = nextLoc[1] * gridSize;
                   /* console.log("xNext:" + nextLockX)
                    console.log("yNext:" + nextLockY)
                    let xDif =Math.floor( nextLockX - mob.x);
                    let yDif = Math.floor(nextLockY - mob.y);

                    console.log("mobx:" + mob.x)
                    console.log("moby:" + mob.y)

                    console.log("xDif:" + xDif)
                    console.log("yDif:" + yDif)
                    let distance = Math.sqrt(xDif *xDif + yDif * yDif);
                    let sin = (nextLockX - mob.x) / distance
                    let cos = (nextLockY - mob.y) / distance
                    console.log(distance)
                    if (distance > mob.speed) {
                        if (nextLockX - mob.x < 0) {
                            mob.x -= mob.speed * sin
                        } else {
                            mob.x += mob.speed * sin
                        }
                        if (nextLockY - mob.y < 0) {
                            mob.y -= mob.speed * cos
                        } else {
                            mob.y += mob.speed * cos
                        }
                    } else {
                        mob.x =  nextLockX;
                        mob.y =  nextLockY;
                        path.shift()
                        return;
                    }*/

                    let nextX = nextLoc[0] * gridSize;
                    let nextY = nextLoc[1] * gridSize;
                    mob.x = nextX//MathHelper.lerp(mob.x,nextX,5);
                    mob.y = nextY//MathHelper.lerp(mob.x,nextX,5);
                    path.shift();
                }else {
                    return;
                }
        }

    }
    if(mobs.length > 0 ) {
        io.emit("mobs", mobs);
    }
}
var MathHelper = {
    // Get a value between two values
    clamp: function (value, min, max) {

        if (value < min) {
            return min;
        }
        else if (value > max) {
            return max;
        }

        return value;
    },
    // Get the linear interpolation between two value
    lerp: function (value1, value2, amount) {
        amount = amount < 0 ? 0 : amount;
        amount = amount > 1 ? 1 : amount;
        return value1 + (value2 - value1) * amount;
    }

};
module.exports = {
    calculateAllMobs,
    createMob,
    initializePathFinder,
    moveMobs
}
