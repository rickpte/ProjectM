
let projectm = {
  "version": 1,
  "controlMode": 0,
  "mods": [],
  "gamestate": {
    "modHasInput": false,
  },
  "logstate": {
    "idx": 0,
    "lines": [],
  },
  "settings": {
    "shadows": true,
    "verbose": true,
    "network": false,
    "boxes": false,
    "mode": "game",
  },
  "input": {
    "playerLeft": false,
    "playerRight": false,
    "playerForward": false,
    "playerBack": false,
    "keyW": false,
    "keyA": false,
    "keyS": false,
    "keyD": false,
    "keyR": false,
    "keyF": false,
    "keyQ": false,
    "keyE": false,
  },
  "log": function (msg) {
    console.log(msg);
    if (this.logFunc) this.logFunc(msg);
  },
  "addScript": function (name) {
    var s = document.createElement('script');
    s.setAttribute('type', 'module');
    s.setAttribute('src', 'mod/' + name + '.js?v=' + Date.now());
    document.body.appendChild(s);
  },
  "addMod": function (name, initFunc, cleanupFunc, updateFunc, heightFunc, viewLevelFunc, mins, maxs, drawdist) {
    let mod = {
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
      "viewLevel": -1,
    };
    this.mods.push(mod);
  },
  "getHeight": function (x, y) {
    let h = 0;
    for (let i = 0; i < this.mods.length; i++) {
      if (this.mods[i].loaded) {
        if (this.mods[i].viewLevel == 0) {
          if (this.mods[i].heightFunc) {
            let hh = this.mods[i].heightFunc(x, y);
            if (hh > h) h = hh;
          }
        }
      }
    }
    return h;
  },
};

window.onload = (event) => {
  projectm.addScript('base');
};

