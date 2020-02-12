module.exports = {
    generateMap,
    myGrid
}

function generateMap(startX, startY, sizeX, sizeY, biomeType, gridSizeX, gridSizeY,rectangles) {

    let amountOfTrees;
    let amountOfPlants;
    let typesOfTrees;
    let typesOfPlants;
    let typesOfFloor;
    let amountOfBlocks = (sizeX / gridSizeX) * (sizeY / gridSizeY);
    var map = [];
    var collisionMap = [];
    let endX = startX + sizeX;
    let endY = startY + sizeY;

    //Initialize Map

    for (let i = startX; i < endX; i += gridSizeX) {
        if (!map[i]) map[i] = [];
        //if (!collisionMap[i]) collisionMap[i] = [];
        for (let k = startY; k < endY; k += gridSizeY) {
            map[i][k] = {
                tile: "dirt" + Math.floor(Math.random() * 10).toString() +"_block",
                item: null,
                tree: null,
                plant: null,
            };

        }
    }


    //Trees
    amountOfTrees = Math.floor(Math.random() * Math.floor((amountOfBlocks / 15))) + 1;
    let amountOfRocks = Math.floor(Math.random() * Math.floor((amountOfBlocks / 15)))*2 + 1;

    console.log("generated trees amount :" + amountOfTrees);

    let treeMap = []
    for (let i = 0; i < amountOfTrees; i++) {
        let treeX = gridSizeX * (Math.floor(Math.random() * sizeX / gridSizeX) + startX);
        let treeY = gridSizeY * (Math.floor(Math.random() * sizeY / gridSizeY) + startY);
        try {


            //dont let trees spawn right next to each other
            if (map[treeX][treeY].tree != null || map[treeX - gridSizeX][treeY].tree != null || map[treeX - gridSizeX][treeY].tree != null || map[treeX][treeY - gridSizeY].tree != null || map[treeX][treeY + gridSizeY].tree != null || map[treeX - gridSizeX][treeY - gridSizeY].tree != null || map[treeX + gridSizeX][treeY + gridSizeY].tree != null
                || map[treeX + gridSizeX][treeY - gridSizeY].tree != null || map[treeX - gridSizeX][treeY + gridSizeY].tree != null) {
                continue;
            } else {
                //add Tree
                let randTree = Math.floor(Math.random()*2)+1;

                let treeName= "Pine-" + randTree
                map[treeX][treeY].tree = treeName;
                let tree = {
                    name:"Pine-"+ randTree,
                    x:treeX,
                    y:treeY,
                }
                treeMap.push(tree);

                //if (!collisionMap[treeX]) collisionMap[treeX] = [];
                /*if(rectangles[treeName]){
                    rectangles[treeName].forEach(
                        element => collisionMap.push(element)
                    )
                }*/
                if(rectangles.name===treeName){
                    let rect = rectangles.rectangles[0];
                    let collisionObject = {
                        x:treeX + rect.x,
                        y:treeY + rect.y,
                        width:rect.width,
                        height:rect.height,
                    }
                    collisionMap.push(collisionObject)
                }
                /*let collisionObject = {
                    x:treeX,
                    y:treeY,
                    width:12,
                    height:12,
                }
                let id = collisionMap.push(collisionObject)//[treeX][treeY] = true;
*/


            }
        } catch (e) {
            continue;
        }
    }

    for (let i = 0; i < amountOfRocks; i++) {
        let treeX = gridSizeX * (Math.floor(Math.random() * sizeX / gridSizeX) + startX);
        let treeY = gridSizeY * (Math.floor(Math.random() * sizeY / gridSizeY) + startY);
        try {


            //dont let trees spawn right next to each other
            if (map[treeX][treeY].tree != null || map[treeX - gridSizeX][treeY].tree != null || map[treeX - gridSizeX][treeY].tree != null || map[treeX][treeY - gridSizeY].tree != null || map[treeX][treeY + gridSizeY].tree != null || map[treeX - gridSizeX][treeY - gridSizeY].tree != null || map[treeX + gridSizeX][treeY + gridSizeY].tree != null
                || map[treeX + gridSizeX][treeY - gridSizeY].tree != null || map[treeX - gridSizeX][treeY + gridSizeY].tree != null) {
                continue;
            } else {
                if (map[treeX][treeY].plant != null || map[treeX - gridSizeX][treeY].plant != null || map[treeX - gridSizeX][treeY].plant != null || map[treeX][treeY - gridSizeY].plant != null || map[treeX][treeY + gridSizeY].plant != null || map[treeX - gridSizeX][treeY - gridSizeY].plant != null || map[treeX + gridSizeX][treeY + gridSizeY].plant != null
                    || map[treeX + gridSizeX][treeY - gridSizeY].plant != null || map[treeX - gridSizeX][treeY + gridSizeY].plant != null) {
                    continue;
                }else {
                let randRock = Math.floor(Math.random() * 6) + 1;
                map[treeX][treeY].plant = "rock";
                let rock = {
                    name: "rock",// + randRock,
                    x: treeX,
                    y: treeY,
                }
                treeMap.push(rock);

                }
            }
        } catch (e) {
            continue;
        }
    }

    let maps = {
        map: map,
        treeMap: treeMap,
        collisionMap: collisionMap
    }
    return maps;
}
function myGrid(x, y, gridSize) {
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
    let position = {
        x: gridx,
        y: gridy
    }
    return position
}
function addQuadTree() {

}
