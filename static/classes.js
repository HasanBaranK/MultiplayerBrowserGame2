class Camera {
    constructor(x, y, ppX, ppY, speed){
        this.x = x;
        this.y = y;
        this.ppX = ppX;
        this.ppY = ppY;
        this.speed = speed;
    }
    move(x,y){
        this.x+=x;
        this.y+=y;
        ctx.translate(-x, -y);
    }
    set(x,y){
        this.x = x;
        this.y = y;
    }
}