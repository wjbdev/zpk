/**
 * Created by will on 21/07/16.
 */

var Entity = require('./entity.js');
var Projectile = require ('./projectile.js');
var Station = require ('./station.js');
var Wormhole = require ('./wormhole.js');
var Pack = require('./../data/pack.js');

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
    self.killCount = 0;
    self.maxShields = 4;
    self.shields = 4;
    self.centerX = 0;
    self.centerY = 0;
    self.attackMode = false;
    self.canShoot = true;
    self.canWarp = true;
    self.warping = false;

    //Mouse Info
    self.mouseAngle = 0;
    self.screenCenterX = 0;
    self.screenCenterY = 0;
    self.mouseX = 0;
    self.mouseY = 0;
    self.click = false;

    //Movement
    self.keyRight   = false;
    self.keyLeft    = false;
    self.keyUp      = false;
    self.keyDown    = false;
    self.speed      = 0;
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
            b: self.b,
            shields: self.shields,
            maxShields: self.maxShields,
            storage: self.storage,
            area: self.area
        }
    };

    self.zoom = function() {
        for(var wh in Wormhole.list) {
            var w = Wormhole.list[wh];

            if(self.intersects(w) && self.area == w.area) {
                self.area = w.destination;
                self.canWarp = false;
                setTimeout(function() {
                    self.canWarp = true;
                }, 500);
            }
        }
    };

    self.getUpdatePack = function() {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            shields: self.shields,
            storage: self.storage,
            angle: self.angle,
            area: self.area
        }
    };

    //Functions
    var superUpdate = self.update;

    self.update = function() {

        self.updateSpeed();
        superUpdate();

        self.centerX = self.x+50;
        self.centerY = self.y+30;

        self.mouseAngle = Math.atan2(self.mouseY - self.screenCenterY, self.mouseX - self.screenCenterX) * 180 / Math.PI;

        if(self.click && self.canShoot) {
            self.pew(self.mouseAngle);
            self.canShoot = false;
            setTimeout(function() {
                self.canShoot = true;
            }, 500);
        }

        if(self.warping && self.canWarp) {
            self.zoom();
        }

    };

    self.pew = function(angle) {
        var p = Projectile(self.id, angle);
        p.area = self.area;
        p.x = self.x + 50;
        p.y = self.y + 30;
    };

    self.updateSpeed = function() {

        //console.log('X: ' + self.speedX + ' Y: ' + self.speedY);

        if(self.keyRight) {
            if(self.angle < 360 && self.angle > -360)
                self.angle += 6;
            else
                self.angle = 0;
        }
        else if(self.keyLeft) {
            if(self.angle < 360 && self.angle > -360)
                self.angle -= 6;
            else
                self.angle = 0;
        }

        var degX = Math.cos(self.angle/180*Math.PI) *0.5 ;
        var degY = Math.sin(self.angle/180*Math.PI) *0.5 ;

        if(self.keyUp) {
            if(self.speedX > -self.maxSpeed && self.speedX < self.maxSpeed) {
                self.speedX += degX;
            }
            else if (self.speedX <= -self.maxSpeed && degX > 0) {
                self.speedX += degX;
            }
            else if (self.speedX >= self.maxSpeed && degX < 0) {
                self.speedX += degX;
            }

            if(self.speedY >= -self.maxSpeed && self.speedY < self.maxSpeed) {
                self.speedY += degY;
            }
            else if (self.speedY <= -self.maxSpeed && degY > 0) {
                self.speedY += degY;
            }
            else if (self.speedY > self.maxSpeed && degY < 0) {
                self.speedY += degY;
            }
        }
        else if(self.keyDown) {
            if(self.speedX > -self.maxSpeed && self.speedX < self.maxSpeed) {
                self.speedX -= degX;
            }
            else if (self.speedX < -self.maxSpeed && degX < 0) {
                self.speedX -= degX;
            }
            else if (self.speedX >= self.maxSpeed && degX > 0) {
                self.speedX -= degX;
            }

            if(self.speedY > -self.maxSpeed && self.speedY < self.maxSpeed) {
                self.speedY -= degY;
            }
            else if (self.speedY <= -self.maxSpeed && degY < 0) {
                self.speedY -= degY;
            }
            else if (self.speedY >= self.maxSpeed && degY > 0) {
                self.speedY -= degY;
            }
        }

    };

    self.respawn = function() {
        self.speedX = 0;
        self.speedY = 0;
        self.x = Math.random()*500;
        self.y = Math.random()*500;
        self.shields = self.maxShields;
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
            player.screenCenterX = p.co.centerX;
            player.screenCenterY = p.co.centerY;
            player.mouseX = p.co.x;
            player.mouseY = p.co.y;
        }
        else if(p.input == 'warp') {
            player.warping = p.state;
        }
    });

    socket.emit('initPack', {
        ownId: socket.id,
        players: Player.getAllPacks(),
        projectiles: Projectile.getAllPacks(),
        stations: Station.getAllPacks(),
        wormholes: Wormhole.getAllPacks()
    });
};
Player.getAllPacks = function() {
    var players = [];
    for(var p in Player.list)
        players.push(Player.list[p].getInitPack());
    return players;
};
Player.onDisconnect = function(socket) {
    Pack.delPack.players.push(socket.id);
    delete Player.list[socket.id];
};
Player.update = function() {
    var pack = [];
    for(var p in Player.list){
        var player = Player.list[p];

        //Check what's going on
        player.update();

        //Push data to packet
        pack.push(player.getUpdatePack());
    }
    return pack;
};

module.exports = Player;