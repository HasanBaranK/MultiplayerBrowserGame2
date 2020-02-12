function drawPlayerPosition(players) {
    ctx.save()
    ctx.fillStyle = "rgba(240, 52, 52, 1)";
    for (let player in players) {
        ctx.fillRect(players[player].state.x + players[player].state.sizex, players[player].state.y + players[player].state.sizey, 3, 3);
    }
    ctx.restore()
}

function visualizeHitBoxes(players,gridSize) {
    ctx.save()
    ctx.fillStyle = "rgba(240, 52, 52, 1)";
    for(let player in players){
        ctx.fillRect(players[player].state.x, players[player].state.y, players[player].state.sizex + players[player].state.sizex, players[player].state.sizey + players[player].state.sizey);
    }
    ctx.restore()
}
function visualizeCollision2(players, gridSize) {


    let position = myGrid(player.x, player.y, gridSize);

    let midx = player.x + halfSizex;
    let midy = player.y + halfSizey;

    let amountCheckRightLeft = Math.ceil(halfSizex / gridSize) - 1
    let amountCheckTopBottom = Math.ceil(halfSizey / gridSize) - 1//himself


    let MAXX = position.x + amountCheckRightLeft * gridSize;
    let MINX = position.x - amountCheckRightLeft * gridSize;
    let MAXY = position.y + amountCheckTopBottom * gridSize;
    let MINY = position.y - amountCheckTopBottom * gridSize;
    // if (xcoordinate > 0 && ycoordinate > 0) {
    //     if(ycoordinate < gridSize ){
    //         MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize));
    //         MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize);
    //     }else{
    //         MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize));
    //         MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize) + gridSize;
    //     }
    //     MAXX = xcoordinate + sizex + (gridSize - ((xcoordinate + sizex) % gridSize)) - gridSize;
    //     MINX = xcoordinate - sizex - ((xcoordinate - sizex) % gridSize) + gridSize;
    //
    // } else if (xcoordinate > 0 && ycoordinate <= 0) {
    //
    //     console.log(ycoordinate)
    //     MAXX = xcoordinate + sizex + (gridSize - ((xcoordinate + sizex) % gridSize)) - gridSize;
    //     MINX = xcoordinate - sizex - ((xcoordinate - sizex) % gridSize) + gridSize;
    //
    //     if ((-gridSize) < ycoordinate) {
    //         MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize));
    //         MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize);
    //     } else {
    //         MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize)) - gridSize;
    //         MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize);
    //     }
    // } else if (xcoordinate < 0 && ycoordinate > 0) {
    //     MAXX = xcoordinate + sizex + (gridSize - ((xcoordinate + sizex) % gridSize)) - gridSize - gridSize;
    //     MINX = xcoordinate - sizex - ((xcoordinate - sizex) % gridSize);
    //     MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize));
    //     MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize) + gridSize;
    // } else if (xcoordinate < 0 && ycoordinate < 0) {
    //     MAXX = xcoordinate + sizex + (gridSize - ((xcoordinate + sizex) % gridSize)) - gridSize - gridSize;
    //     MINX = xcoordinate - sizex - ((xcoordinate - sizex) % gridSize);
    //     MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize)) - gridSize;
    //     MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize);
    // } else {
    //     MAXX = xcoordinate + sizex + (gridSize - ((xcoordinate + sizex) % gridSize)) - gridSize;
    //     MINX = xcoordinate - sizex - ((xcoordinate - sizex) % gridSize) + gridSize;
    //     MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize));
    //     MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize);
    //
    // }
    //
    // if (MAXX === MINX) {
    //     MAXX = MAXX + gridSize
    // }


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

function drawMapCollision(map) {
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    for (let block in map) {
        for (let insideBlock in map[block]) {
            if (map[block][insideBlock]) {
                ctx.fillRect(block, insideBlock, 32, 32);
            }
        }

    }
    ctx.restore()
}

function rangeVisualizer(players, range) {
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";

    console.log(players)
    for (let player in players) {
        player = players[player]
        if (player.facing === "left") {
            ctx.fillRect(player.state.x + (player.state.sizex *1.5) - range, player.state.y, range, 2 * player.state.sizey);
        }
        if (player.facing === "right") {
            ctx.fillRect(player.state.x + ( player.state.sizex *0.5), player.state.y, range, 2 * player.state.sizey);
        }
    }
    ctx.restore()
}
function visualizeHitBoxes(players,gridSize) {
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    for(let player in players){
        ctx.fillRect(player.x, player.y, player.x + player.sizex, player.y + player.sizey);
    }
    ctx.restore()
}
function visualizeCollision(players, gridSize) {
    for (let player in players) {
        player = players[player]
        let sizex = player.state.sizex
        let sizey = player.state.sizey



        let xcoordinate = player.state.x + sizex;
        let ycoordinate = player.state.y + sizey;
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

            console.log(ycoordinate)
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
        // if(MAXY -32 === MINY ){
        //   MINY = MINY -32;
        // }
        //
        // console.log("X")
        // console.log(MAXX)
        // console.log(MINX)
        // console.log("Y")
        // console.log(MAXY)
        // console.log(MINY)
        ctx.fillRect(MINX, MINY, MAXX - MINX, MAXY - MINY);
    }
}

function visualizeCollisionItems(items, gridSize) {
    for (let item in items) {
        items = items[item]
        let sizex = 16
        let sizey = 16


        let xcoordinate = item.x + sizex;
        let ycoordinate = item.y + sizey;
        let MAXX;
        let MINX;
        let MAXY;
        let MINY;
        if (xcoordinate > 0 && ycoordinate > 0) {
            MAXX = xcoordinate + sizex + (gridSize - ((xcoordinate + sizex) % gridSize)) - gridSize;
            MINX = xcoordinate - sizex - ((xcoordinate - sizex) % gridSize) + gridSize;
            MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize));
            MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize) + gridSize;
        } else if (xcoordinate > 0 && ycoordinate < 0) {
            MAXX = xcoordinate + sizex + (gridSize - ((xcoordinate + sizex) % gridSize)) - gridSize;
            MINX = xcoordinate - sizex - ((xcoordinate - sizex) % gridSize) + gridSize;
            MAXY = ycoordinate + sizey + (gridSize - ((ycoordinate + sizey) % gridSize)) - gridSize;
            MINY = ycoordinate - sizey - ((ycoordinate - sizey) % gridSize);
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
        // if(MAXY -32 === MINY ){
        //   MINY = MINY -32;
        // }
        //
        // console.log("X")
        // console.log(MAXX)
        // console.log(MINX)
        // console.log("Y")
        // console.log(MAXY)
        // console.log(MINY)
        ctx.fillRect(MINX, MINY, MAXX - MINX, MAXY - MINY);
    }
}

function whichGridIamOn(x, y, gridSize) {
    console.log(x + "," + y)
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";

    let gridx = x - (x % gridSize)
    let gridy = y - (y % gridSize)

    if (gridx < 0) {
        gridx = gridx - gridSize
    }
    if (gridy < 0) {
        gridy = gridy - gridSize
    }

    if (x < 0 && (0 - gridSize) < x) {
        gridx = x - (x % gridSize) - gridSize
    }
    if (y < 0 && (0 - gridSize) < y) {
        gridy = y - (y % gridSize) - gridSize
    }
    ctx.fillRect(gridx, gridy, gridSize, gridSize);
    ctx.restore()
}
function buildRange(players, gridSize) {
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    for(let player in players){
        player = players[player]
        ctx.arc(player.state.x+ gridSize, player.state.y+gridSize+gridSize/2, 128,0, 2 * Math.PI);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore()
}

function visualizeCollision(players, gridSize) {
  for (let player in players) {
    player = players[player]
    let sizex = player.state.sizex
    let sizey = player.state.sizey



    let xcoordinate = player.state.x + sizex;
    let ycoordinate = player.state.y + sizey;


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

      console.log(ycoordinate)
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
    // if(MAXY -32 === MINY ){
    //   MINY = MINY -32;
    // }
    //
    // console.log("X")
    // console.log(MAXX)
    // console.log(MINX)
    // console.log("Y")
    // console.log(MAXY)
    // console.log(MINY)
    ctx.fillRect(MINX, MINY, MAXX - MINX, MAXY - MINY);
    ctx.beginPath();
    ctx.fillStyle="red";
    ctx.arc(xcoordinate, ycoordinate, 10, 0, 2 * Math.PI);
    ctx.fillStyle="green";
    ctx.arc(player.state.x, player.state.y, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle="black";
  }
}
