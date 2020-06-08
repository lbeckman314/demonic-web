import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
export { Demo }

class Demo {

    constructor(term, elem, url, userPrompt) {
        this.term = term;
        this.elem = elem;
        this.url = url;
        this.userPrompt = userPrompt;
        this.ws = null;
    }

    deserialize(input) {
        const buff = new Buffer(input);
        const output = buff.toString('utf8');
        return output;
    }

    write(data) {
        this.term.write(data);
    }

    send(data) {
        let msg = null;
        if (typeof data == 'object') {
            msg = data;
        }
        else {
            msg = {'data': data};
        }
        if (this.ws.readyState == WebSocket.CONNECTING) {
            this.ws.addEventListener('open', () => this.ws.send(JSON.stringify(msg)));
        }
        else {
            this.ws.send(JSON.stringify(msg));
        }
    }

    writeAndSend(data) {
        this.write(data);
        this.send(data);
    }

    open() {
        let draw = true;
        let data = {};
        let obj = {};
        let loading = false;
        let message = '';

        // Fit addon
        const fitAddon = new FitAddon();
        this.term.loadAddon(fitAddon);
        this.term.loadAddon(new WebLinksAddon());
        this.elem.addEventListener('click', () => fitAddon.fit());

        const ws = new WebSocket(this.url);
        this.ws = ws;
        ws.onopen = (event) => {
            fitAddon.fit();
            this.term.onKey((event) => {
                if (draw) {
                    if (event.key == '\r')
                        this.term.write('\n');

                    else if (event.key == '\u007f')
                        this.term.write('\b \b');

                    else if (event.key == '\u000c') {
                        this.term.clear();
                        return;
                    }

                    else if (event.key == '\u001b') {
                        this.term.blur();
                        return;
                    }

                    else {
                        this.term.write(event.key);
                    }
                }
                data = {'data': event.key};
                ws.send(JSON.stringify(data));
            });

        }

        ws.onmessage = (event) => {
            obj = JSON.parse(event.data);
            if (obj.draw != null) {
                draw = obj.draw;
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
                this.term.write(obj.err);
            }

            if (obj.exit != null) {
                draw = true;
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
    }
}

