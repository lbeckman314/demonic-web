export { DemonicWeb }
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
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

        // WebLink addon
        term.loadAddon(new WebLinksAddon());

        // Fit addon
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        this.fitAddon = fitAddon;
        this.fit();
    }

    fit() {
        this.fitAddon.fit();
    }

    deserialize(input) {
        const buff = new Buffer(input);
        const output = buff.toString('utf8');
        return output;
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
    }

    connect() {
        this.ws = this.createWebSocket(this.url);

        setInterval(() => {
            if (this.ws.readyState == WebSocket.CLOSED) {
                this.clearLine();
                this.ws = this.createWebSocket(this.url);
            }
        }, 2000);

        let cmdIndex = 0;
        let cmd = '';
        this.term.onKey(e => {
            // Escape
            if (e.key == '\u001b')
                this.term.blur();

            if (this.draw && this.ws.readyState == WebSocket.OPEN) {
                switch (e.key) {
                    // Enter
                    case '\r':
                        this.term.write('\n');
                        cmdIndex = 0;
                        break;

                    // Backspace
                    case '\u007f':
                        if (!this.atPrompt())
                            this.term.write('\b \b');
                        break;

                    // Ctrl + l
                    case '\u000c':
                        this.term.clear();
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
                            this.term.write(cmd);
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
                            this.term.write(cmd);
                            this.send(cmd);
                        }
                        break;

                    // Left arrow
                    case '\u001b[D':
                        if (!this.atPrompt())
                            this.term.write(e.key);
                        break;

                    // All other keys
                    default:
                        cmdIndex = 0;
                        this.term.write(e.key);
                }
            }
            this.send(e.key);
        });
    }

    createWebSocket(url) {
        let obj = {};
        let loading = false;
        let message = '';

        let ws = new WebSocket(url);
        this.eventEmitter.emit('connecting');

        ws.onclose = () => {
            this.eventEmitter.emit('connecting');
        }

        ws.onopen = () => {
            this.eventEmitter.emit('connected');
        }

        ws.onmessage = (e) => {
            obj = JSON.parse(e.data);

            if (obj.cmd != null) {
                this.cmds.push(obj.cmd);
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
                message = this.deserialize(obj.out);
                this.term.write(message);
            }
        }

        return ws;
    }
}

