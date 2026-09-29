// <demonic-terminal>: a web terminal connected to a demonic server.
//
//   <demonic-terminal
//     url="wss://demonic.example.com"
//     command="fortune | cowsay | lolcat"
//     examples='["pokeductor", "pipes.sh"]'
//     theme="auto"
//     autostart="click">
//   </demonic-terminal>
//
// Attributes:
//   url        WebSocket address of the demonic server (required).
//   command    Command typed at the prompt when the terminal starts, ready
//              for the visitor to press Enter.
//   examples   JSON list of commands shown as buttons; clicking one types it
//              at the prompt.
//   theme      'dark', 'light', or 'auto' (default): follow the page's
//              <html data-theme="..."> attribute, falling back to the
//              visitor's colour scheme preference.
//   autostart  When to connect: 'click' (default; shows a start button),
//              'visible' (when scrolled into view) or 'load' (immediately).
//              Every open terminal holds a session on the server, so avoid
//              'load' on pages many people visit.
//   prompt     Prompt text (may contain ANSI colour codes).
//
// Everything is created when the element is added to the page and torn down
// (socket closed, timers stopped) when it is removed, so it works with
// client-side navigation such as Astro's <ClientRouter />. Any number of
// terminals can be on one page.

import '@xterm/xterm/css/xterm.css';
import '../assets/demonic-terminal.css';
import { Terminal } from '@xterm/xterm';
import { DemonicWeb } from './demonic-web.js';
import { darkTheme, lightTheme, defaultPrompt } from './themes.js';
import { showAttribution } from './attribution.js';

class DemonicTerminal extends HTMLElement {
    static observedAttributes = ['theme'];

    connectedCallback() {
        this.build();

        const autostart = this.getAttribute('autostart') || 'click';
        if (autostart == 'load') {
            this.start();
        } else if (autostart == 'visible') {
            this.visibility = new IntersectionObserver((entries) => {
                if (entries.some(entry => entry.isIntersecting))
                    this.start();
            });
            this.visibility.observe(this);
        }
    }

    disconnectedCallback() {
        this.stop();
        this.replaceChildren();
    }

    attributeChangedCallback(name) {
        if (name == 'theme')
            this.applyTheme();
    }

    // Create the status bar, screen, start button and examples.
    build() {
        const el = (tag, className, text) => {
            const node = document.createElement(tag);
            if (className)
                node.className = className;
            if (text)
                node.textContent = text;
            return node;
        };

        this.replaceChildren();
        this.root = el('div', 'demonic-terminal');

        this.status = el('div', 'demonic-status');
        this.statusText = el('span', 'demonic-status-text', 'Not connected');
        this.attribution = el('span', 'demonic-attribution');
        this.fullscreenButton = el('button', 'demonic-fullscreen', '⛶');
        this.fullscreenButton.type = 'button';
        this.fullscreenButton.title = 'Toggle full screen';
        this.fullscreenButton.setAttribute('aria-label', 'Toggle full screen');
        this.fullscreenButton.onclick = () => {
            this.root.classList.toggle('demonic-fullscreen-on');
            if (this.terminal)
                this.terminal.focus();
        };
        this.status.append(this.statusText, this.attribution, this.fullscreenButton);

        this.screen = el('div', 'demonic-screen');

        this.startButton = el('button', 'demonic-start', '▶ Start terminal');
        this.startButton.type = 'button';
        this.startButton.onclick = () => this.start();
        this.screen.append(this.startButton);

        this.root.append(this.status, this.screen);

        const examples = this.examples();
        if (examples.length) {
            const list = el('div', 'demonic-examples');
            for (const example of examples) {
                const button = el('button', 'demonic-example', example);
                button.type = 'button';
                button.onclick = () => this.run(example);
                list.append(button);
            }
            this.root.append(list);
        }

        this.append(this.root);
        this.applyTheme();
    }

    examples() {
        try {
            const list = JSON.parse(this.getAttribute('examples') || '[]');
            return Array.isArray(list) ? list.map(String) : [];
        } catch (err) {
            console.warn('demonic-terminal: examples must be a JSON list of strings');
            return [];
        }
    }

    // Create the terminal and connect to the server.
    start() {
        if (this.demonicWeb || !this.isConnected)
            return;
        if (this.visibility) {
            this.visibility.disconnect();
            this.visibility = null;
        }

        const url = this.getAttribute('url');
        if (!url) {
            this.statusText.textContent = 'No server address (url attribute) set';
            return;
        }

        this.startButton.remove();
        this.terminal = new Terminal({ convertEol: true });
        this.terminal.open(this.screen);
        this.applyTheme();

        const prompt = this.getAttribute('prompt') || defaultPrompt;
        this.terminal.write(prompt);

        this.demonicWeb = new DemonicWeb(this.terminal, url, prompt);
        const events = this.demonicWeb.eventEmitter;

        events.addListener('connecting', () => {
            this.status.classList.remove('demonic-connected');
            this.statusText.textContent = 'Connecting…';
            showAttribution(this.attribution, null);
        });

        let first = true;
        events.addListener('connected', () => {
            this.status.classList.add('demonic-connected');
            this.statusText.textContent = 'Connected';
            if (first) {
                first = false;
                const command = this.getAttribute('command');
                if (command)
                    this.type(command);
            }
        });

        events.addListener('meta', (meta) => showAttribution(this.attribution, meta));

        this.demonicWeb.connect();

        this.resizer = new ResizeObserver(() => this.demonicWeb && this.demonicWeb.fit());
        this.resizer.observe(this.screen);

        this.terminal.focus();
    }

    // Disconnect and release everything. The element can be started again.
    stop() {
        if (this.visibility) {
            this.visibility.disconnect();
            this.visibility = null;
        }
        if (this.resizer) {
            this.resizer.disconnect();
            this.resizer = null;
        }
        if (this.demonicWeb) {
            this.demonicWeb.close();
            this.demonicWeb = null;
        }
        if (this.terminal) {
            this.terminal.dispose();
            this.terminal = null;
        }
    }

    // Type a command at the prompt (replacing anything typed so far),
    // ready for the visitor to press Enter. Ignored while a program runs.
    type(command) {
        if (!this.demonicWeb || !this.demonicWeb.draw)
            return;
        this.demonicWeb.clearLine();
        this.demonicWeb.write(command);
        this.demonicWeb.send(command);
        this.terminal.focus();
    }

    // Type an example command, starting the terminal first if needed.
    run(command) {
        if (!this.demonicWeb) {
            this.setAttribute('command', command);
            this.start();
        } else {
            this.type(command);
        }
    }

    currentTheme() {
        const theme = this.getAttribute('theme') || 'auto';
        if (theme == 'dark' || theme == 'light')
            return theme;

        const page = document.documentElement.dataset.theme;
        if (page == 'dark' || page == 'light')
            return page;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    applyTheme() {
        const theme = this.currentTheme();
        if (this.root)
            this.root.dataset.theme = theme;
        if (this.terminal)
            this.terminal.options.theme = theme == 'light' ? lightTheme : darkTheme;
    }
}

// In 'auto' mode, follow the page's theme and the colour scheme preference.
function updateAutoThemes() {
    for (const terminal of document.querySelectorAll('demonic-terminal'))
        terminal.applyTheme();
}

if (!customElements.get('demonic-terminal')) {
    customElements.define('demonic-terminal', DemonicTerminal);
    new MutationObserver(updateAutoThemes)
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', updateAutoThemes);
}

export { DemonicTerminal, DemonicWeb };
