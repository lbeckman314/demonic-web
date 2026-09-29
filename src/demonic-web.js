export { DemonicWeb }
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
const events = require('events');

class DemonicWeb {
    constructor(term, url, userPrompt) {
        this.term = term;
        this.url = url;
        this.userPrompt = userPrompt;
        this.eventEmitter = new events.EventEmitter();
        this.ws = null;
        this.cmds = [];
        this.draw = true;
        this.heartbeat = null;

        // WebLink addon
        term.loadAddon(new WebLinksAddon());

        // Fit addon
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        this.fitAddon = fitAddon;
        this.fit();

        // Tell the server whenever the terminal size changes (e.g. after
        // fit()), so full-screen programs can redraw at the new size.
        term.onResize(() => this.sendResize());

        // Add key listeners
        this.addKeyListeners(term);
    }

    fit() {
        this.fitAddon.fit();
    }

    // Send the current terminal size. 'data' is included (empty) so servers
    // that predate the resize message treat it as harmless input; they
    // still read 'cols' and 'rows', which send() adds.
    sendResize() {
        if (this.ws == null || this.ws.readyState != WebSocket.OPEN)
            return;
        this.send({
            resize: { cols: this.term.cols, rows: this.term.rows },
            data: '',
        });
    }

    getReadyState() {
        return this.ws.readyState;
    }

    isOpen() {
        return this.getReadyState() == WebSocket.OPEN;
    }

    clear() {
        this.term.clear();
    }

    clearLine() {
        this.write('\x1b[2K\r');
        this.send('\x1b[2K\r');
        this.write(this.userPrompt);
    }

    write(data) {
        this.term.write(data);
    }

    send(data) {
        let msg;
        if (typeof data == 'object')
            msg = data;
        else
            msg = {'data': data};

        msg.cols = this.term.cols;
        msg.rows = this.term.rows;

        if (this.ws.readyState == WebSocket.CONNECTING)
            this.ws.addEventListener('open', () => this.ws.send(JSON.stringify(msg)));
        else
            this.ws.send(JSON.stringify(msg));
    }

    atPrompt() {
        let plainPrompt = this.userPrompt.replace(/\x1B\[.*?m/g, '');
        return (this.term.buffer.active.cursorX == plainPrompt.length);
    }

    close() {
        this.ws.close();
        clearInterval(this.heartbeat);
    }

    connect() {
        this.ws = this.createWebSocket(this.url);

        this.heartbeat = setInterval(() => {
            if (this.ws.readyState == WebSocket.CLOSED) {
                this.clearLine();
                this.ws = this.createWebSocket(this.url);
            }
        }, 2000);
    }

    addKeyListeners(term) {
        let cmdIndex = 0;
        let cmd = '';
        term.onKey((e) => {
            // Escape leaves the terminal at the prompt. While a program
            // is running it is passed through (vim and most TUIs need it).
            if (e.key == '\u001b' && this.draw)
                term.blur();

            if (!this.isOpen)
                return;

            this.send(e.key);

            if (!this.draw)
                return;

            switch (e.key) {
                    // Enter
                case '\r':
                    term.write('\n');
                    cmdIndex = 0;
                    break;

                    // Backspace
                case '\u007f':
                    if (!this.atPrompt())
                        term.write('\b \b');
                    break;

                    // Ctrl + l
                case '\u000c':
                    term.clear();
                    this.clearLine();
                    break;

                    // Ctrl + a
                case '\u0001':
                    break;

                    // Ctrl + e
                case '\u0005':
                    break;

                    // Ctrl + u
                case '\u0015':
                    this.clearLine();
                    break;

                    // Up arrow
                case '\u001b[A':
                    this.clearLine();
                    if (cmdIndex < this.cmds.length)
                        cmdIndex += 1;
                    cmd = this.cmds[this.cmds.length - cmdIndex];
                    if (typeof cmd != 'undefined') {
                        term.write(cmd);
                        this.send(cmd);
                    }
                    break;

                    // Down arrow
                case '\u001b[B':
                    this.clearLine();
                    if (cmdIndex > 0)
                        cmdIndex -= 1;
                    cmd = this.cmds[this.cmds.length - cmdIndex];
                    if (typeof cmd != 'undefined') {
                        term.write(cmd);
                        this.send(cmd);
                    }
                    break;

                    // Left arrow
                case '\u001b[D':
                    if (!this.atPrompt())
                        term.write(e.key);
                    break;

                    // All other keys
                default:
                    cmdIndex = 0;
                    term.write(e.key);
            }
        });
    }

    createWebSocket(url) {
        let obj = {};
        let loading = false;

        let ws = new WebSocket(url);
        this.eventEmitter.emit('connecting');

        ws.onclose = () => {
            this.eventEmitter.emit('connecting');
        }

        ws.onopen = () => {
            this.eventEmitter.emit('connected');
            this.sendResize();
        }

        ws.onmessage = (e) => {
            obj = JSON.parse(e.data);

            if (obj.cmd != null) {
                this.cmds.push(obj.cmd);
            }

            // Attribution for the program that is starting; cleared when
            // it exits.
            if (obj.meta != null) {
                this.eventEmitter.emit('meta', obj.meta);
                return;
            }

            if (obj.draw != null) {
                this.draw = obj.draw;
                return;
            }

            if (obj.loading) {
                loading = true;
                this.term.write(' ');
                const spin = async () => {
                    const chars = '| / - \\';
                    const arr = chars.split(' ');
                    let i = 0

                    while (loading) {
                        this.term.write('\b \b')
                        this.term.write(arr[i++ % arr.length]);
                        await new Promise(resolve => setTimeout(resolve, 200));;
                    }
                }
                spin();
            }

            if (obj.err) {
                if (loading)
                    this.term.write('\b \b')
                this.term.write(obj.err);
            }

            if (obj.exit != null) {
                this.eventEmitter.emit('meta', null);
                this.draw = true;
                if (loading)
                    loading = false;
                this.term.write(this.userPrompt);
            }

            if (obj.out) {
                if (loading == true) {
                    this.term.write('\b')
                    loading = false;
                }
                this.term.focus();
                this.term.write(obj.out);
            }
        }

        return ws;
    }
}
