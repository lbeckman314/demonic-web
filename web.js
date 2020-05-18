import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
export {init};
export {bootup};
export {setLight};
export {setDark};

const darkTheme = {
    brightMagenta: '#ed68d9',
    brightGreen: '#5af78e',
    brightBlue: '#678cfa',
    brightCyan: '#9aedfe',
    background: '#000000',
    foreground: '#ffffff',
    cursor: '#ffffff',
};

const lightTheme = {
    brightMagenta: '#ed68d9',
    brightGreen: '#5af78e',
    brightBlue: '#678cfa',
    brightCyan: '#678cfa',
    background: '#fffafa',
    foreground: '#000000',
    cursor: '#000000',
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
    let data = {};
    let obj = {};
    let message = '';
    let draw = true;
    let elem = args.elem;
    let loading = false;

    if (!elem) {
        elem = document.getElementById('terminal');
    }

    if (map.has(elem)) {
        const term = map.get(elem);
        term.dispose();
    }

    const term = new Terminal({
        convertEol: true,
        rows: 8,
    });
    map.set(elem, term);

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    elem.addEventListener('click', () => fitAddon.fit());

    const userPrompt = args.userPrompt || '> ';

    term.open(elem);
    term.write(userPrompt);

    const theme = args.theme;
    if (theme == 'light')
        term.setOption('theme', lightTheme);
    else
        term.setOption('theme', darkTheme);

    const examples = document.getElementById('demonic-examples');
    if (examples != null) {
        examples.addEventListener('click', (event) => {
            const example = event.target.innerHTML;
            term.write(example);
            term.focus();
            data = {'data': example};
            ws.send(JSON.stringify(data));
        });
    }

    const url = 'wss://liambeckman.com:8181';
    const ws = new WebSocket(url);
    ws.onopen = (event) => {
        fitAddon.fit();
        if (args.lang!= null && args.code != null) {
            ws.send(JSON.stringify(args));
        }

        term.onKey((event) => {
            if (draw) {
                if (event.key == '\r') {
                    term.
                        write('\n');
                }
                else if (event.key == '\u007f') {
                    term.write('\b \b');
                }
                else if (event.key == '\u000c') {
                    term.clear();
                    return;
                }
                else if (event.key == '\u001b') {
                    term.blur();
                    return;
                }
                else {
                    term.write(event.key);
                }
            }
            data = {'data': event.key};
            ws.send(JSON.stringify(data));
        });

        ws.onmessage = (event) => {
            obj = JSON.parse(event.data);
            if (obj.draw != null) {
                draw = obj.draw;
                return;
            }
            if (obj.loading) {
                loading = true;
                term.write(' ');
                const spin = async () => {
                    const chars = '| / - \\';
                    const arr = chars.split(' ');
                    let i = 0
                    while (loading) {
                        term.write('\b \b')
                        term.write(arr[i++ % arr.length]);
                        await new Promise(resolve => setTimeout(resolve, 200));;
                    }
                }
                spin();
            }
            if (obj.err) {
                term.write(obj.err);
            }
            if (obj.exit != null) {
                console.log(obj.exit);
                draw = true;
                term.write(userPrompt);
            }
            if (obj.out) {
                if (loading == true) {
                    term.write('\b')
                    loading = false;
                }
                message = deserialize(obj.out);
                term.write(message);
            }
        }
    }
}

function deserialize(input) {
    const buff = new Buffer(input);
    const output = buff.toString('utf8');
    return output;
}

function setLight() {
    map.forEach((value, key, map) => value.setOption('theme', lightTheme));
}

function setDark() {
    map.forEach((value, key, map) => value.setOption('theme', darkTheme));
}

