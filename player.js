/**
 * Created by will on 21/07/16.
 */

var Entity = require('./entity.js');
var Projectile = require ('./projectile.js');
var Pack = require('./pack.js');

//Player Object
var Player = function(id) {

    var self = Entity();

    //Client ID
    self.id         = id;

    self.w = 100;
    self.h = 60;

    //Colour (Temporary!)
    self.r          = Math.floor(Math.random()*(255)+1);
    self.g          = Math.floor(Math.random()*(255)+1);
    self.b          = Math.floor(Math.random()*(255)+1);

    //Misc info
    self.centerX = 0;
    self.centerY = 0;
    self.attackMode = false;

    //Mouse Info
    self.mouseAngle = 0;
    self.mouseX = 0;
    self.mouseY = 0;
    self.click = false;

    //Movement
    self.keyRight   = false;
    self.keyLeft    = false;
    self.keyUp      = false;
    self.keyDown    = false;
    self.maxSpeed   = 10;

    //Pack funcs
    self.getInitPack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            w: self.w,
            h: self.h,
            r: self.r,
            g: self.g,
            b: self.b
        }
    };

    self.getUpdatePack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y
        }
    };

    //Functions
    var superUpdate = self.update;

    self.update = function() {
        self.updateSpeed();
        superUpdate();

        self.centerX = self.x+50;
        self.centerY = self.y+30;

        self.mouseAngle = Math.atan2(self.mouseY - self.centerY, self.mouseX - self.centerX) * 180 / Math.PI;

        if(self.click) {
            //console.log("CX: " + self.centerX + " | CY: " + self.centerY);
            //console.log("X: " + self.mouseX + " | Y: " + self.mouseY);
            //console.log("A: " + self.mouseAngle + "deg");
            self.pew(self.mouseAngle);
        }

    };

    self.pew = function(angle) {
        var p = Projectile(self.id, angle);

        p.x = self.x + 50;
        p.y = self.y + 30;
    };

    self.updateSpeed = function() {
        if(self.keyRight)
        {
            self.speedX = self.maxSpeed;
        }
        else if(self.keyLeft)
            self.speedX = -self.maxSpeed;
        else
            self.speedX = 0;

        if(self.keyUp)
            self.speedY = -self.maxSpeed;
        else if(self.keyDown)
            self.speedY = self.maxSpeed;
        else
            self.speedY = 0;
    };

    Player.list[id] = self;

    Pack.initPack.players.push(self.getInitPack());

    return self;
};

//Static methods
exports.playerList = Player.list = {};
Player.onConnect = function(socket) {
    var player = Player(socket.id);

    socket.on('kP', function(p) {
        if(p.input === 'left') {
            player.keyLeft = p.state;
        }
        else if(p.input === 'right')
            player.keyRight = p.state;
        else if(p.input === 'up')
            player.keyUp = p.state;
        else if(p.input === 'down')
            player.keyDown = p.state;
        else if(p.input === 'attack')
            player.click = p.state;
        else if(p.input === 'mousePos') {
            player.mouseX = p.co.x;
            player.mouseY = p.co.y;
        }
    });

    socket.emit('initPack', {
        players: Player.getAllPacks(),
        projectiles: Projectile.getAllPacks()
    });
};
Player.getAllPacks = function() {
    var players = [];
    for(var p in Player.list)
        players.push(Player.list[p].getInitPack());
    return players;
};
Player.onDisconnect = function(socket) {
    Pack.delPack.push(socket.id);
    delete Player.list[socket.id];
};
Player.update = function() {
    var pack = [];
    for(var p in Player.list){
        var player = Player.list[p];

        //Check what's going on
        player.update();

        //Push data to packet
        pack.push({
            x:player.x,
            y:player.y,
            w:player.w,
            h:player.h,
            r:player.r,
            g:player.g,
            b:player.b
        });
    }
    return pack;
};

module.exports = Player;