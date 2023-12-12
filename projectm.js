
let projectm = {
    "modules": [],
    "games": [],
    "gamestate": {
        "deviceMode": 1,
        "controlMode": 1,
        "networkUpdate2": false,
        "networkUpdate3": false,
        "modHasInput": false,
        "modReadyCount": 0,
        "frameCount": 0,
    },
    "three": {
        "camera": null,
        "renderer": null,
        "scene": null,
    },
    "logstate": {
        "idx": 0,
        "lines": [],
    },
    "chatstate": {
        "idx": 0,
        "lines": [],
    },
    "settings": {
        "shadows": true,
        "verbose": true,
        "network": false,
        "boxes": true,
        "fog": false,
        "mode": "game",
    },
    "netplayer": {
        "key": '',
        "player": {
            "id": 0,
        },
        "vehicle": {
            "id": 0,
        }
    },
    "netstate": {
        "time": 0,
        "messages": [],
        "players": [],
        "vehicles": [],
    },
    "input": {
        // Common
        "forwardAxis": 0,
        "steerAxis": 0,
        "strafeAxis": 0,
        "upAxis": 0,
        // Keyboard
        "keyLeft": false,
        "keyRight": false,
        "keyForward": false,
        "keyBack": false,
        "keyW": false,
        "keyA": false,
        "keyS": false,
        "keyD": false,
        "keyR": false,
        "keyF": false,
        "keyQ": false,
        "keyE": false,
        // VR controllers
        "buttonA": false,
        "buttonB": false,
        "buttonX": false,
        "buttonY": false,
    },
    "log": function (msg, level = 1) {
        if (level >= 2 || projectm.settings.verbose) {
            console.log(msg);
            if (this.logFunc) this.logFunc(msg);
        }
    },
    "chat": function (msg) {
        if (this.chatFunc) this.chatFunc(msg);
    },
    "setDeviceMode": function (mode) {
        let msgs = ['Switching to Desktop mode', 'Switching to Mobile mode', 'Switching to VR mode'];
        this.log(msgs[mode - 1]);
        this.gamestate.deviceMode = mode;
    },
    "setControlMode": function (mode) {
        let msgs = ['Switching to fly mode', 'Switching to walk mode', 'Switching to drive mode'];
        this.log(msgs[mode - 1]);
        this.gamestate.controlMode = mode;
    },
    "addModuleScript": function (name) {
        var s = document.createElement('script');
        s.setAttribute("id", 'mod_' + name);
        s.setAttribute('type', 'module');
        s.setAttribute('src', 'mod/' + name + '.js?v=' + Date.now());
        document.body.appendChild(s);
    },
    "addModule": function (name, initFunc, cleanupFunc, updateFunc) {
        let mod = {
            "active": false,
            "name": name,
            "initFunc": initFunc,
            "cleanupFunc": cleanupFunc,
            "updateFunc": updateFunc,
        };
        this.modules.push(mod);
    },
    "addGameScript": function (name) {
        var s = document.createElement('script');
        s.setAttribute("id", 'game_' + name);
        s.setAttribute('type', 'module');
        s.setAttribute('src', 'games/' + name + '/' + name + '.js?v=' + Date.now());
        document.body.appendChild(s);
    },
    "addGame": function (name, initFunc, cleanupFunc, updateFunc, heightFunc, viewLevelFunc, mins, maxs, drawdist) {
        let game = {
            "active": false,
            "loaded": false,
            "name": name,
            "initFunc": initFunc,
            "cleanupFunc": cleanupFunc,
            "updateFunc": updateFunc,
            "heightFunc": heightFunc,
            "viewLevelFunc": viewLevelFunc,
            "mins": mins,
            "maxs": maxs,
            "drawdist": drawdist,
            "alwaysVisible": false,
            "viewLevel": -1,
        };
        this.games.push(game);
    },
    "getHeight": function (x, z) {
        let h = 0;
        for (let i = 0; i < this.games.length; i++) {
            if (this.games[i].loaded) {
                if (this.games[i].viewLevel == 0) {
                    if (this.games[i].heightFunc) {
                        let hh = this.games[i].heightFunc(x, z);
                        if (hh > h) h = hh;
                    }
                }
            }
        }
        return h;
    },
};

window.onload = (event) => {
    projectm.addModuleScript('base');
};

