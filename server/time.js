module.exports = {
    updateGameTime,
    getGameTime
}

function updateGameTime(gameTime,speed) {
    gameTime = gameTime + speed;
    gameTime = gameTime % (5184000)//60*60*60*24
    return gameTime
}

function getGameTime(gameTime) {
    let hour = Math.floor(gameTime / 216000)//60*60*60
    let minute = Math.floor((gameTime - (hour * 216000)) /  3600)
    let seconds = Math.floor(((gameTime - (hour * 216000)) - (minute *3600)) / 60)

    let time = {
        hour: hour,
        minute: minute,
        seconds: seconds
    }

    return time
}
