import { Demo } from './demo-class.js';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
export { init };
export { write };
export { bootup };
export { setLight };
export { setDark };

const url = 'wss://liambeckman.com:8181';

const darkTheme = {
    brightMagenta: '#ed68d9',
    brightGreen:   '#5af78e',
    brightBlue:    '#678cfa',
    brightCyan:    '#9aedfe',
    background:    '#000000',
    foreground:    '#ffffff',
    cursor:        '#ffffff',
};

const lightTheme = {
    brightMagenta: '#ed68d9',
    brightGreen:   '#5af78e',
    brightBlue:    '#678cfa',
    brightCyan:    '#678cfa',
    background:    '#fffafa',
    foreground:    '#000000',
    cursor:        '#000000',
};

const init = (() => {
    let _args = {};

    return {
        set: args => {
            _args = args;
        },
        get: () => {
            return _args;
        }
    };
})();

function write(data) {
    const demo = map.values().next().value;
    demo.term.focus();
    demo.writeAndSend('\x1b[2K\r');
    demo.write(userPrompt);
    demo.writeAndSend(data);
}

document.addEventListener('DOMContentLoaded', () => {
    let boot = init.get().boot;
    if (boot == null)
        boot = false;
    if (boot == true) {
        bootup(init.get());
    }
});

let map = new Map();

function bootup(args) {
    let elem = args.elem;

    if (!elem)
        elem = document.getElementById('terminal');

    if (map.has(elem)) {
        const demo = map.get(elem);
        demo.term.dispose();
    }

    // xterm.js constructor
    const term = new Terminal({
        convertEol: true,
        rows: 8,
    });

    // User prompt
    const userPrompt = args.userPrompt || '> ';
    term.open(elem);
    term.write(userPrompt);

    // Theme
    const theme = args.theme;
    if (theme == 'light')
        term.setOption('theme', lightTheme);
    else
        term.setOption('theme', darkTheme);

    const demo = new Demo(term, elem, url, userPrompt);
    map.set(elem, demo);
    demo.open();

    if (args.lang!= null && args.code != null) {
        demo.send(args);
    }
}

function setLight() {
    map.forEach((value, key, map) => value.term.setOption('theme', lightTheme));
}

function setDark() {
    map.forEach((value, key, map) => value.term.setOption('theme', darkTheme));
}

