export { bootup };
export { setDark };
export { setLight };
export { write };
import 'xterm/css/xterm.css';
import { Demonic } from './demonic-class.js';
import { Terminal } from 'xterm';
import '../assets/demonic-web.css';

const url = 'ws://localhost:8181';

let darkTheme = {
    brightMagenta: '#ed68d9',
    brightGreen:   '#5af78e',
    brightBlue:    '#678cfa',
    brightCyan:    '#9aedfe',
    background:    '#000000',
    foreground:    '#ffffff',
    cursor:        '#ffffff',
};

let lightTheme = {
    brightMagenta: '#ed68d9',
    brightGreen:   '#008000',
    brightBlue:    '#678cfa',
    brightCyan:    '#02bfe5',
    background:    '#fffafa',
    foreground:    '#000000',
    cursor:        '#000000',
};

function write(data) {
    const demonic = map.values().next().value;
    demonic.term.focus();
    demonic.clearLine();
    demonic.send(data);
}

let map = new Map();

function bootup(args) {
    let container = args.elem;
    if (container == null)
        container = document.getElementsByClassName('demonic-web')[0];

    if (map.has(container)) {
        const demonic = map.get(container);
        demonic.term.dispose();
    }

    // xterm.js constructor
    const term = new Terminal({
        convertEol: true,
    });
    term.open(container);

    // User prompt
    const MAGENTA='\x1b[1;35m';
    const GREEN='\x1b[1;32m';
    const CYAN='\x1b[1;36m';
    const NC='\x1b[0m';
    const userPrompt = args.userPrompt ||
        `${CYAN}user${NC}${MAGENTA} @ ${NC}${CYAN}demonic${NC} ${GREEN}>${NC} `;
    term.write(userPrompt);

    // Command
    const data = args.data || '';
    term.write(data);
    term.focus();

    // Theme
    const theme = args.theme;
        term.setOption('theme', lightTheme);

    if (theme == 'light')
        term.setOption('theme', lightTheme);
    else
        term.setOption('theme', darkTheme);

    const demonic = new Demonic(term, url, userPrompt);
    map.set(container, demonic);

    new ResizeObserver(() => {
        demonic.fit();
    }).observe(container);

    let statusBar = container.querySelector('#status');
    if (statusBar == null) {
        statusBar = document.createElement('div');
        statusBar.id = 'status';
        const termElem = container.querySelector('.terminal');
        container.insertBefore(statusBar, termElem);
    }

    demonic.eventEmitter.addListener('connecting', () => {
        statusBar.classList.remove('connected');
        statusBar.innerHTML = 'Status: Connecting...';
        term.setOption('cursorBlink', false);
    });

    demonic.connect();

    let init = true;
    demonic.eventEmitter.addListener('connected', () => {
        statusBar.classList.add('connected');
        statusBar.innerHTML = 'Status: Connected!';

        term.setOption('cursorBlink', true);

        if (init) {
            demonic.send(args);
            init = false;
        }
    });

    // Examples
    const examples = document.getElementById('demonic-examples');
    if (examples != null) {
        examples.addEventListener('click', (event) => {
            const example = event.target;
            if (example == examples)
                return;
            const data = example.innerHTML;

            demonic.clearLine();
            demonic.write(data);
            demonic.send(data);
            term.focus();
        });
    }

    return demonic;
}

function setLight() {
    setTheme(lightTheme);
}

function setDark() {
    setTheme(darkTheme);
}

function setTheme(theme) {
    map.forEach(value => value.term.setOption('theme', theme));
}

