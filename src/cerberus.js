export { run };
import '../assets/demonic-web.css';
import 'xterm/css/xterm.css';
import { DemonicWeb } from './demonic-web.js';
import { Terminal } from 'xterm';

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

function run(args) {
    if (document.readyState == "complete" || document.readyState == "loaded")
        return bootup(args)
    else
        document.addEventListener('DOMContentLoaded', () => bootup(args));
}

function bootup(args) {
    const url = args.url || 'wss://liambeckman.com/8181';

    let container = args.elem;
    if (container == null)
        container = document.getElementsByClassName('demonic-web')[0];

    // xterm.js constructor
    const terminal = new Terminal({
        convertEol: true,
    });
    terminal.open(container);

    // User prompt
    const MAGENTA='\x1b[1;35m';
    const GREEN='\x1b[1;32m';
    const CYAN='\x1b[1;36m';
    const NC='\x1b[0m';
    const userPrompt = args.userPrompt ||
        `${CYAN}user${NC}${MAGENTA} @ ${NC}${CYAN}demonic${NC} ${GREEN}>${NC} `;
    terminal.write(userPrompt);

    // Command
    if (args.write != false)
        terminal.write(args.data);
    terminal.focus();

    const demonicWeb = new DemonicWeb(terminal, url, userPrompt);
    demonicWeb.connect();

    // Resize terminal
    new ResizeObserver(() => {
        if (demonicWeb.getReadyState() == WebSocket.OPEN)
            demonicWeb.fit();
    }).observe(container);

    // Status Bar
    let termElement = container.querySelector('.terminal');
    let statusBar = container.querySelector('#status');
    if (statusBar == null) {
        statusBar = document.createElement('div');
        statusBar.id = 'status';
        container.insertBefore(statusBar, termElement);
    }

    // 'connecting' Event Listener
    demonicWeb.eventEmitter.addListener('connecting', () => {
        statusBar.classList.remove('connected');
        statusBar.innerHTML = 'Status: Connecting...';
        terminal.setOption('cursorBlink', false);
    });

    // 'connected' Event Listener
    let init = true;
    demonicWeb.eventEmitter.addListener('connected', () => {
        statusBar.classList.add('connected');
        statusBar.innerHTML = 'Status: Connected!';

        terminal.setOption('cursorBlink', true);

        if (init) {
            demonicWeb.send(args);
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

            demonicWeb.clearLine();
            demonicWeb.write(data);
            demonicWeb.send(data);
            terminal.focus();
        });
    }

    // Theme
    let theme = (args.theme == 'light') ? lightTheme : darkTheme;
    terminal.setOption('theme', theme);

    // Buttons
    let buttons = document.createElement('div');
    buttons.className = 'buttons';
    termElement.appendChild(buttons);

    // Menu Button
    let menuBtn = document.createElement('button');
    menuBtn.textContent = '☰';
    menuBtn.title = 'Open Menu';
    buttons.appendChild(menuBtn);

    menuBtn.onclick = () => {
        menu.classList.toggle('hide');
    }

    window.addEventListener('click', (e) => {
        if (e.target != menuBtn && !menu.contains(e.target))
            menu.classList.add('hide');
    });

    terminal.onKey(e => {
        // Escape Key
        if (e.key == '\u001b')
            menu.classList.add('hide');
    });

    let menu = document.createElement('ul');
    menu.classList.add('demonic-menu');
    menu.classList.add('hide');
    termElement.appendChild(menu);

    // Theme Button
    let themeItem = document.createElement('li');
    themeItem.textContent = '☯ Change Theme';
    menu.appendChild(themeItem);

    themeItem.onclick = () => {
        theme = (theme == lightTheme) ? darkTheme : lightTheme;
        terminal.setOption('theme', theme);
        buttons.classList.toggle('dark-text');
    }

    // Close Button
    let closeItem = document.createElement('li');
    closeItem.textContent = '✕ Close Terminal';
    closeItem.classList.add('close');
    menu.appendChild(closeItem);

    closeItem.onclick = () => {
        demonicWeb.close();
        container.remove();
    }

    return demonicWeb;
}

