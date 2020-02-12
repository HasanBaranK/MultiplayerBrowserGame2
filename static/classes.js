class Camera {
    constructor(x, y, ppX, ppY, speed){
        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;
    }
    move(x,y){
        this.x+=x;
        this.y+=y;
        ctx.translate(-x, -y);
    }
    set(x, y){
        ctx.translate(this.x, this.y);
        this.oldX = this.x;
        this.oldY = this.y;
        this.x = x;
        this.y = y;
    }
    restore(){
        this.x = this.oldX;
        this.y = this.oldY;
        ctx.translate(-this.x, -this.y);
    }
}

class Animation {
    constructor(img, startColumn, endColumn, row, width, height, cWidth, cHeight, speed){
        this.img = img;
        this.startColumn = startColumn;
        this.endColumn = endColumn;
        this.row = row;
        this.width = width;
        this.height = height;
        this.cWidth = cWidth;
        this.cHeight = cHeight;
        this.speed = speed;

        this.currentColumn = this.startColumn;
        this.animTime = Date.now();
        this.currentTime = Date.now();
    }
    draw(ctx, x, y){
        if(this.currentColumn > this.endColumn){
            this.currentColumn = this.startColumn;
        }
        ctx.drawImage(this.img, this.currentColumn * this.width, this.row * this.height,
            this.width, this.height, x, y, this.cWidth, this.cHeight);
        this.currentTime = Date.now();
        if(this.currentTime > this.animTime){
            this.currentColumn++;
            this.animTime = this.currentTime + this.speed;
        }
    }
    reset(){
        this.currentColumn = this.startColumn;
    }
}

class Player {
    constructor(state){
        this.state = state;
        this.facing = 'right';
        this.attacking = false;
        this.animations = [];
        this.animationsOnce = [];
        this.animationsFinal = [];
    }
    draw(ctx, name){
        this.animations[name].draw(ctx, this.state.x, this.state.y);
    }
    addAnimation(name, img, startColumn, endColumn, row, width, height, cWidth, cHeight, speed){
        this.animations[name] = new Animation(img, startColumn, endColumn, row, width, height, cWidth, cHeight, speed);
    }
    resetAnimations(){
        for(let animation in this.animations){
            this.animations[animation].reset();
        }
    }
}