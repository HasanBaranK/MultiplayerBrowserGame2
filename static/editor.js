
//////////////////////Editor//////////////////////////////////
/*
let editorMode = false;
let rectangles = [];
let selectedRectangleIndex = -1;
let mousePosition = {};
let imageName;
let timebefore = Date.now();
let timenow = Date.now();
let ctx;
let cvs;
let camera;

function editorConfig() {
    $("#editor").click(() => {
        if (!editorMode) {
            $("#editor")[0].innerText = "Game";
            $("#add")[0].style.display = "block";
            $("#imagename")[0].style.display = "block";
            $("#select")[0].style.display = "block";
            editorMode = true;
            ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
            camera.set(ctx, 0, 0);
            window.cancelAnimationFrame(requestId);
            requestId = window.requestAnimationFrame(editor);
        } else {
            $("#editor")[0].innerText = "Editor";
            $("#add")[0].style.display = "none";
            $("#imagename")[0].style.display = "none";
            $("#select")[0].style.display = "none";
            editorMode = false;
            ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
            camera.restore(ctx);
            window.cancelAnimationFrame(requestId);
            requestId = window.requestAnimationFrame(animate);
        }
    });

    $("#add").click(() => {
        addRectangle(camera.x + cvs.width / 2 - 50, camera.y + cvs.height / 2 - 50, 100, 100);
    });

    $("#select").click(() => {
        imageName = $("#imagename")[0].value;
    });

    $("#canvas").click((evt) => {
        mousePosition.x = evt.offsetX || evt.layerX;
        mousePosition.y = evt.offsetY || evt.layerY;
        checkRectangleIndex(mousePosition.x + camera.x, mousePosition.y + camera.y);
    });
}

function editor() {
    updateEditor();
    requestId = requestAnimationFrame(editor);
}

function updateEditor() {
    timenow = Date.now();
    if (timenow - timebefore > 30) {
        timebefore = timenow;
        if (selectedRectangleIndex != -1) {
            let r = rectangles[selectedRectangleIndex];
            if (keys["w"]) {
                rectangles[selectedRectangleIndex].y--;
            }
            if (keys["s"]) {
                rectangles[selectedRectangleIndex].y++;
            }
            if (keys["a"]) {
                rectangles[selectedRectangleIndex].x--;
            }
            if (keys["d"]) {
                rectangles[selectedRectangleIndex].x++;
            }
            if (keys["ArrowUp"] && r.h > 5) {
                rectangles[selectedRectangleIndex].h--;
            }
            if (keys["ArrowDown"]) {
                rectangles[selectedRectangleIndex].h++;
            }
            if (keys["ArrowLeft"] && r.w > 5) {
                rectangles[selectedRectangleIndex].w--;
            }
            if (keys["ArrowRight"]) {
                rectangles[selectedRectangleIndex].w++;
            }
            if (keys["x"]) {
                rectangles.splice(selectedRectangleIndex, 1);
                selectedRectangleIndex = -1;
            }
            if (keys["p"]) {
                let message = {name: imageName, rectangles: []};
                for (let rectangle in rectangles) {
                    let r = rectangles[rectangle];
                    let xOffset = r.x - (camera.x + cvs.width / 2);
                    let yOffset = r.y - (camera.y + cvs.height / 2);
                    message.rectangles.push({x: xOffset, y: yOffset, width: r.w, height: r.h})
                }
                console.log(message);
                //alert(JSON.stringify(message))
                socket.emit("updatecollision", message);
            }
        }
    }
    ctx.clearRect(camera.x, camera.y, cvs.width, cvs.height);
    if (imageName) {
        try {
            ctx.drawImage(images[imageName], camera.x + cvs.width / 2, camera.y + cvs.height / 2);
            ctx.beginPath();
            ctx.rect(camera.x + cvs.width / 2, camera.y + cvs.height / 2, images[imageName].width, images[imageName].height);
            ctx.stroke();
        } catch (e) {

        }

    }
    for (let rectangle in rectangles) {
        let r = rectangles[rectangle];
        if (rectangle == selectedRectangleIndex) {
            ctx.strokeStyle = "yellow";
            ctx.beginPath();
            ctx.rect(r.x, r.y, r.w, r.h);
            ctx.stroke();
            ctx.strokeStyle = "black"
        }
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w, r.h);
        ctx.stroke();
    }
}

function addRectangle(x, y, w, h) {
    rectangles.push(new Rectangle(x, y, w, h));
}

function checkRectangleIndex(x, y) {
    for (let rectangle in rectangles) {
        let r = rectangles[rectangle];
        if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) {
            selectedRectangleIndex = rectangle;
            return;
        }
    }
}

class Rectangle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}
export {
    editorConfig,
    editor,

}
*/
