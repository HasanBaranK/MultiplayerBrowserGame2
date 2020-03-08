////////////////////QUAD TREE///////////////////////////////
function initializeQuadTree(quadTree,collisionMap) {
    quadTree = new Quadtree({
        x: 0,
        y: 0,
        width: 8000,
        height: 8000
    }, 15, 6);

    for (let i = 0; i < collisionMap.length; i++) {
        let collision = collisionMap[i];
        quadTree.insert({
            x: collision.x,
            y: collision.y,
            width: collision.width,
            height: collision.height
        });

    }
    return quadTree;
}
function quadTreeObjectsByPosition(player, quadTree) {
    return quadTree.retrieve({
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height
    });
}
////////////////////COLLISION///////////////////////////////
function move(me,direction, quadTree, speed) {
    let player = cloneMe(me);
    let offset = {
        x: 10,
        y: 17,
        width: 14,
        height: 14,
    }
    player.x += offset.x
    player.y += offset.y
    player.width = offset.width
    player.height = offset.height
    let detail = speed;
    if (direction === 0) {
        player.x -= detail;
        let objects = quadTreeObjectsByPosition(player, quadTree);
        let object = checkCollision(player, objects)
        if (object !== false) {
            me.x = object.x - offset.x + object.width;
            return false;
        }

        me.x -= detail;
    } else if (direction === 1) {

        player.x += detail;
        let objects = quadTreeObjectsByPosition(player, quadTree);
        let object = checkCollision(player, objects)
        if (object !== false) {
            me.x = object.x - offset.width - offset.x;
            return false;
        }
        me.x += detail;
    } else if (direction === 2) {

        player.y += detail;
        let objects = quadTreeObjectsByPosition(player, quadTree);
        let object = checkCollision(player, objects)
        if (object !== false) {
            me.y = object.y - offset.y - offset.height;
            return false;
        }
        me.y += detail;
    } else if (direction === 3) {

        player.y -= detail;
        let objects = quadTreeObjectsByPosition(player, quadTree);
        let object = checkCollision(player, objects)
        if (object !== false) {
            me.y = object.y + object.height - offset.y;
            return false;
        }
        me.y -= detail;
    }
    return true;
}
function checkCollision(me, objects) {

    for (let i = 0; i < objects.length; i++) {
        let object = objects[i];
        if (me.x < object.x + object.width &&
            me.x + me.width > object.x &&
            me.y < object.y + object.height &&
            me.y + me.height > object.y) {
            return object;
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
    checkCollision,
    move,
    initializeQuadTree,
    quadTreeObjectsByPosition,
    cloneMe
}
