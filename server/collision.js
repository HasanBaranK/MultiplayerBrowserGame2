module.exports = {

    move,
    checkCollision
}

function move(direction, player, gridSize, collisionMap, speed) {
    if (direction === "left") {
        player.x -= speed;
        player.status = 2;
        player.facing = "left"
        if (checkCollision(player, player.sizex, player.sizey, gridSize, collisionMap)) {
            player.x += speed;
        }
    }
    if (direction === "right") {
        player.x += speed;
        player.status = 4;
        player.facing = "right"
        if (checkCollision(player, player.sizex, player.sizey, gridSize, collisionMap)) {
            player.x -= speed;

        }
    }
    if (direction === "up") {
        player.y -= speed;
        player.status = 3;
        player.facing = "up"
        if (checkCollision(player, player.sizex, player.sizey, gridSize, collisionMap)) {
            player.y += speed;
        }
    }
    if (direction === "down") {
        player.y += speed;
        player.status = 3;
        if (checkCollision(player, player.sizex, player.sizey, gridSize, collisionMap)) {
            player.y -= speed;
        }
    }
}
function checkCollision() {
    let xcoordinate = player.x + sizex;
    let ycoordinate = player.y + sizey;

    let MAXX;
    let MINX;
    let MAXY;
    let MINY;
    if (xcoordinate > 0 && ycoordinate > 0) {
        if (ycoordinate < gridSize) {
            MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize));
            MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize);
        } else {
            MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize));
            MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize) + gridSize;
        }
        MAXX = xcoordinate + sizex + (gridSize - ((xcoordinate + sizex) % gridSize)) - gridSize;
        MINX = xcoordinate - sizex - ((xcoordinate - sizex) % gridSize) + gridSize;

    } else if (xcoordinate > 0 && ycoordinate <= 0) {

        MAXX = xcoordinate + sizex + (gridSize - ((xcoordinate + sizex) % gridSize)) - gridSize;
        MINX = xcoordinate - sizex - ((xcoordinate - sizex) % gridSize) + gridSize;

        if ((-gridSize) < ycoordinate) {
            MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize));
            MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize);
        } else {
            MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize)) - gridSize;
            MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize);
        }
    } else if (xcoordinate < 0 && ycoordinate > 0) {
        MAXX = xcoordinate + sizex + (gridSize - ((xcoordinate + sizex) % gridSize)) - gridSize - gridSize;
        MINX = xcoordinate - sizex - ((xcoordinate - sizex) % gridSize);
        MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize));
        MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize) + gridSize;
    } else if (xcoordinate < 0 && ycoordinate < 0) {
        MAXX = xcoordinate + sizex + (gridSize - ((xcoordinate + sizex) % gridSize)) - gridSize - gridSize;
        MINX = xcoordinate - sizex - ((xcoordinate - sizex) % gridSize);
        MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize)) - gridSize;
        MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize);
    } else {
        MAXX = xcoordinate + sizex + (gridSize - ((xcoordinate + sizex) % gridSize)) - gridSize;
        MINX = xcoordinate - sizex - ((xcoordinate - sizex) % gridSize) + gridSize;
        MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize));
        MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize);

    }

    if (MAXX === MINX) {
        MAXX = MAXX + gridSize
    }


    for (let i = MINX; i < MAXX; i += gridSize) {
        for (let j = MINY; j < MAXY; j += gridSize) {
            try {
                if (collisionMap[i][j] === undefined) {
                    //console.log("no collision")

                } else if (collisionMap[i][j]) {
                    //console.log("collision with: " + i +","+ j)
                    return true;
                } else {
                }
            } catch (e) {
                return false;
            }
        }
    }
    return false;
}

