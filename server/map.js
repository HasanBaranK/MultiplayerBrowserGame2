module.exports = {
    generateMap
}

function generateMap(startX, startY, sizeX, sizeY, biomeType, gridSizeX, gridSizeY) {

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
        if (!collisionMap[i]) collisionMap[i] = [];
        for (let k = startY; k < endY; k += gridSizeY) {
            map[i][k] = {
                tile: biomeType,
                item: null,
                tree: null,
                plant: null,
            };
            collisionMap[i][k] = {
                collision: false
            }

        }
    }


    //Trees
    amountOfTrees = Math.floor(Math.random() * Math.floor((amountOfBlocks / 15))) + 1;
    console.log("generated trees amount :" + amountOfTrees);

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
                map[treeX][treeY].tree = "Pine";
                collisionMap[treeX][treeY].collision = true;
            }
        } catch (e) {
            continue;
        }
    }


    let maps = {
        map: map,
        collisonMap: collisionMap
    }
    return maps;
}
