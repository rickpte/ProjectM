import * as THREE from 'three';

let serverUrl = 'https://localhost/server';
let lastMessageId = 0;
let running = false;

projectm.addModule(
    'network',
    init,
    cleanup,
    update
);

async function init() {
    if (projectm.settings.network) {
        await registerPlayer();
    } else {
        projectm.netplayer.player.id = 1;
    }
    projectm.gamestate.modReadyCount++;
}

function cleanup() {
}

async function update(dt) {
    if (projectm.settings.network && !running) {
        running = true;
        updatePlayer();
    }
}


async function registerPlayer() {

    if (window.location.href.includes('?key=')) {
        projectm.netplayer.key = window.location.href.slice(window.location.href.indexOf('?key=') + '?key='.length);
    }
    
    const myRequest = new Request(serverUrl + '/Player/Register');
    const body = JSON.stringify(projectm.netplayer);
    const response = await fetch(myRequest, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: body,
    });

    const obj = await response.json();

    if (obj.player.id != 0) {

        projectm.netplayer.key = obj.key;
        projectm.netplayer.player.id = obj.player.id;
        projectm.netplayer.player.name = obj.player.name;
        projectm.netplayer.player.x = obj.player.x;
        projectm.netplayer.player.y = obj.player.y;
        projectm.netplayer.player.z = obj.player.z;
        projectm.netplayer.player.yaw = obj.player.yaw;

        projectm.log('received name: ' + projectm.netplayer.player.name);
        projectm.log('received pos: ' + projectm.netplayer.player.x + ', ' +  + projectm.netplayer.player.y + ', ' +  + projectm.netplayer.player.z);

        // window.history.replaceState("", "ProjectM", "index.html?key=" + projectm.netplayer.key);
    }

}

async function updatePlayer() {

    if (projectm.netplayer.player.id == 0) {
        // hmm
    } else {

        const myRequest = new Request(serverUrl + '/Player/UpdatePlayer');
        const body = JSON.stringify(projectm.netplayer);
        const response = await fetch(myRequest, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: body,
        });

        try {
            const obj = await response.json();

            projectm.netstate = obj;
            projectm.gamestate.networkUpdate2 = true;
            projectm.gamestate.networkUpdate3 = true;

            if (projectm.netstate.messages.length > 0) {
                for (let i = 0; i < projectm.netstate.messages.length; i++) {
                    if (projectm.netstate.messages[i].id > lastMessageId) {
                        projectm.chat(projectm.netstate.messages[i].message);
                        lastMessageId = projectm.netstate.messages[i].id;
                    }
                }
            }
            if (projectm.netplayer.player.chattime != 0) {
                if (projectm.netplayer.player.time - projectm.netplayer.player.chattime >= 10000) {
                    projectm.netplayer.player.chattime = 0;
                    projectm.netplayer.player.chat = '';
                }
            }
        } catch (error) {
            console.error(error);
            console.log(projectm.netstate);
            projectm.log(error);
        }

        setTimeout(updatePlayer, 500); // + projectm.netplayer.player.id * 200);
    }
}
