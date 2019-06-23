// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
// url linker
import Autolinker from 'autolinker';
// used mainly for the nice syntax
import $ from 'jquery';
import jQuery from 'jquery';
const AU = require('ansi_up');
const ansi_up = new AU.default;
const BSON = require('bson');


const production_url = 'wss://liambeckman.com:8181';
const development_url = 'ws://localhost:8181';
const options = {
    'force new connection':true,
}
const DEV = true;

// namespace
var lib = lib || (function() {
    var _args = {}; // private

    return {
        init : Args => {
            _args = Args;
            // some other initialising
        },
        args : () => {
            return _args;
        }
    };
}());

export {lib};
export {bootup};

$(document).ready(() => {
    let boot = lib.args().boot;
    if (boot == true) {
        bootup(lib.args());
    }
});

function bootup(args) {
    console.log('booting up');
    console.log('args:', args);
    //let terminals = $(".terminals");
    let terminals = args.terminal[0].childNodes;
    console.log('terminals:', terminals);

    let duplicateTerminal = $("#duplicate-terminal");
    if (duplicateTerminal) {
        duplicateTerminal.onclick = () => {
            if (terminals.length < 2) {
                dup();
            }
        }
    }

    let examples = $(".demo-examples");
    for (let i = 0; i < examples.length; i++) {
        let example = examples[i].innerHTML;
        examples[i].onclick = () => {
            terminals[0].innerHTML = terminals[0].innerHTML.replace(/.*$/ ,"> " + example);
            terminals[0].focus();
        }
    }

    let socket = getSocket();
    doTerminal(terminals[0], socket, args);

    const interval = setInterval(function ping() {
        if (socket.isAlive === false) {
            socket = getSocket();
            doTerminal(terminals[0], socket, args.mode);
        }

        else {
            socket.isAlive = false;
            let ping = BSON.serialize({
                command: 'ping',
            });
            socket.send(ping);
        }
    }, 3000);
}

function getSocket() {
    // Create WebSocket connection.
    if (DEV) {
        // development
        let socket = new WebSocket(development_url);
        return socket;
    }
    else {
        // production
        let socket = new WebSocket(production_url);
        return socket;
    }
}

// adds an additional terminal below the first.
function dup() {
    let terminals = $(".terminals");
    let terminalContainer = $(".terminal");
    let buttonContainer = $("#button-container");

    let clone = $('<textarea>');
    clone.className = "terminals";
    terminalContainer.appendChild(clone);

    // Create WebSocket connection.
    let socket = new WebSocket('wss://liambeckman.com:8181', options);
    //let socket = new WebSocket('wss://localhost:8181', options);

    doTerminal(clone, socket, {mode: 'command'});

    let removeTerminal = $('span');
    removeTerminal.id = "remove-terminal";
    removeTerminal.innerHTML = "-";
    buttonContainer.appendChild(removeTerminal);

    removeTerminal.onclick = () => {
        clone.remove();
        removeTerminal.remove();
        socket.close();
    }
}

// used for the zigzag tcp chat program
function zigzagPort(message) {
    let terminals = $(".terminals");
    let original = terminals[0];
    let clone = terminals[1];

    if (message.includes("port number:")) {

        let port = message.split(" ");
        port = port[port.length - 1];

        terminals[1].innerHTML = terminals[1].innerHTML.replace(/.*$/ ,"> " + "zigzag-client " + parseInt(port));

    }
}

// moves cursor to bottom of terminal after command
// https://stackoverflow.com/questions/6249095/how-to-set-caretcursor-position-in-contenteditable-element-div
function setCaret(el) {
    var range = document.createRange();
    var sel = window.getSelection();
    let children = el.lastChild.innerText.split("\n");
    let last_child = children[children.length - 1];
    //console.log('el:', el.lastChild);
    //console.log('len:', el.lastChild.innerText.length)
    //console.log('last_child:', last_child);
    //console.log('last_child.length:', last_child.length);
    range.setStart(el.lastChild, el.lastChild.innerText.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus();
}

// main terminal function
function doTerminal(terminal, socket, args) {
    console.log('doTerminal mode:', args.mode);
    function heartbeat() {
        socket.isAlive = true;
    }

    terminal.spellcheck = false;
    console.log("Connecting to server...");

    let info = $("#info")[0];
    if (info) {
        info.innerHTML = "Status: Connecting...";
        info.style.backgroundColor = "#ff357a";
    }

    // Connection opened
    socket.onopen = (event) => {
        console.log('socket is open.');
        if (info) {
            info.innerHTML = "Status: Connected. Press ENTER to blast off!";
            info.style.backgroundColor = "#49ccd4";
        }

        let userPrompt = lib.args().userPrompt;
        let code = lib.args().code || args.code;
        let language = lib.args().language || args.language;

        if (args.mode == 'code') {
            //terminal.innerHTML = language + ': ' + code;
            runCode(code, language, socket);
        }
        else {
            if (terminal.innerHTML == "") {
                terminal.innerHTML = "> " + userPrompt;
            }
        }

        socket.isAlive = true;

        let message = "";
        let messages = [];
        let commands = [];
        let commNum = 0;
        let up = 0;
        let down = 0;
        let ctrl = false;

        // Listen for messages
        socket.onmessage = (event) => {
            message = event.data;

            var myblob = new Blob([message], {
                type: 'text/plain'
            });

            var reader = new FileReader();
            reader.addEventListener("loadend", function() {
                message = reader.result;

                if (message == "pong") {
                    heartbeat();
                    return;
                }

                if (message.includes('\r')) {
                    message = message.replace(/\r/g,"");
                    terminal.innerHTML = terminal.innerHTML.replace(/.*$/, message);
                }

                else {
                    // ansi_up (converts ansi colors to html colors).
                    message = ansi_up.ansi_to_html(message);

                    // Autolinker (makes clickable url's).
                    const matches = Autolinker.parse(message);
                    if (matches.length > 0) {
                        message = Autolinker.link(message);
                        //window.open(matches[0].getUrl());
                    }

                    let from_server = document.createElement("span");
                    from_server.className = "from_server";
                    from_server.innerHTML = message;
                    terminal.appendChild(from_server);

                    let user_input = document.createElement("span");
                    user_input.className = "user_input";
                    user_input.innerHTML = "";
                    terminal.appendChild(user_input);

                    setCaret(terminal);
                }
            });

            reader.readAsText(myblob);

            messages = message.split("\n");
            terminal.scrollTop = terminal.scrollHeight;
            zigzagPort(message);
        }

        // https://stackoverflow.com/questions/22092762/how-to-detect-ctrlc-and-ctrlv-key-pressing-using-regular-expression/22092839
        terminal.addEventListener("keydown", (e) => {
            e = e || window.event;
            var key = e.which || e.keyCode; // keyCode detection
            var ctrl = e.ctrlKey ? e.ctrlKey : ((key === 17) ? true : false); // ctrl detection

            if ( key == 76 && ctrl ) {
                console.log("Ctrl + L Pressed !");
                let lines = terminal.innerHTML.split("\n");
                terminal.innerHTML = lines[lines.length - 1];
                event.preventDefault();
                e.preventDefault();
                setCaret(terminal);
            }
            else if ( key == 67 && ctrl ) {
                console.log("Ctrl + C Pressed !");
                socket.send("SIGINT");
                terminal.innerHTML += "\n";
            }

            else if ( key == 90 && ctrl ) {
                console.log("Ctrl + Z Pressed !");
                socket.send("SIGTSTP");
                terminal.innerHTML += "\n";
            }

            else if ( key == 85 && ctrl ) {
                console.log("Ctrl + U Pressed !");
                e.preventDefault();
                terminal.innerHTML = terminal.innerHTML.replace(/.*$/,
                    "&gt ");
                setCaret(terminal);
            }
        },false);

        terminal.onkeydown = (event) => {
            let key = event.keyCode;
            let lines = terminal.textContent.split("\n");

            if (key == 8) {
                if (lines[lines.length - 1].length <= 1) {
                    event.preventDefault();
                }
            }

            /*
            // TAB key detected. TODO: Add autocompletion functionality.
            else if (key == 9) {
                event.preventDefault();
                terminal.innerHTML += "TAB detected";
                terminal.innerHTML += "\n> ";
                socket.send("TAB");
            }
            */

            else if (key == 38) {
                event.preventDefault();
                if ((up - down) < commands.length && down <= up) {
                    up += 1;
                    terminal.innerHTML = terminal.innerHTML.replace(/.*$/,
                        "> " + commands[commands.length - up + down]);
                }
            }

            else if (key == 40) {
                event.preventDefault();
                if (down < up && (up - down) <= commands.length) {
                    down += 1;
                    if (down == up) {
                        terminal.innerHTML = terminal.innerHTML.replace(/.*$/,
                            "> ");
                    }
                    else {
                        terminal.innerHTML = terminal.innerHTML.replace(/.*$/,
                            "> " + commands[commands.length - up + down]);
                    }
                }
            }

            // enter key
            else if (key == 13)
            {
                let comm = '';
                console.log('HEY!:', terminal.lastChild);
                comm = terminal.lastChild.innerText;
                event.preventDefault();
                terminal.innerHTML += "\n";

                let user_input = document.createElement("span");
                user_input.className = "user_input";
                user_input.innerHTML = "";
                terminal.appendChild(user_input);

                up = 0;
                down = 0;
                if (comm == null) {
                    // only use last line
                    comm = lines[lines.length-1];
                    // remove > prompt
                    comm = comm.replace(/\> /g, "");
                    // remove leading spaces
                    comm = comm.replace(/^[ ]*/g, "");
                }

                runCommand(comm, commands, terminal, socket);
                terminal.scrollTop = terminal.scrollHeight;
            }

            setCaret(terminal);
        }
    }
}

function runCommand(comm, commands, terminal, socket) {
    console.log("you entered:", comm);

    if (comm == "clear") {
        event.preventDefault();
        terminal.innerHTML = "> ";
        commands[commNum] = comm;
        commNum += 1;
    }

    else if (comm == "") {
        event.preventDefault();
        terminal.innerHTML += "\n> ";
    }

    else {
        let message = BSON.serialize({
            command: comm,
        });
        console.log('command:', message.command);
        console.log('message:', message);
        socket.send(message);
        commands[commNum] = comm;
        commNum += 1;

        if (comm == "zigzag-server") {
            let terminals = $(".terminals");
            if (terminals.length < 2) {
                dup();
            }
        }
    }
}


function runCode(code, language, socket) {
    console.log('code:', code);
    console.log('language:', language);

    let message = BSON.serialize({
        mode: 'code',
        code: code,
        language: language,
    });
    socket.send(message);
}
