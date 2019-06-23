import $ from 'jquery';

import CodeMirror from 'codemirror';
import 'codemirror/mode/python/python.js';
import 'codemirror/mode/clike/clike.js';
import 'codemirror/mode/markdown/markdown.js';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/theme/dracula.css';
import 'codemirror/lib/codemirror.css';
import './demo.css';

import {bootup} from './demo.js';

export {termInit};


$(document).ready(() => {
    pandoc_to_codemirror();
    let sourced = false;
    $('#edit-source').click(() => {
        if (! sourced) {
            source();
            sourced = true;
        }
    });
});


function source() {
    let source = new Request('client-example.md');

    const source_container = document.createElement('div');
    const source_header = document.createElement('h2');
    source_header.innerText = 'Source';
    source_header.id = source_header.innerText.toLowerCase();
    source_container.id = 'source_container';
    document.getElementsByTagName('body')[0].appendChild(source_container);
    source_container.before(source_header);

    fetch(source)
        .then(response => response.text())
        .then(data => {
            let editor = CodeMirror(source_container, {
                value: data,
                mode:  "markdown",
                theme: "dracula",
                lineNumbers: true,
                viewportMargin: Infinity,
                lineWrapping: true,
            });

            // compile/run button
            let buttons = $('<div></div>');
            buttons.attr('class', 'buttons');

            let run = $('<button></button>');
            run.text('▶');
            run.attr('onclick', 'Demo.termInit(this)');
            buttons.append(run);

            let child = source_container.childNodes[0];
            source_container.insertBefore(buttons[0], child);
        });
}

// markdown -> html -> codemirror converters
function pandoc_to_codemirror() {
    let i = 1;

    // cb = "codeblock"
    let identifier = `#cb${i}`;
    while ($(identifier).length > 0) {
        let myTextArea = $(identifier)[0].childNodes[0];

        // mode
        let mode = myTextArea.classList[1];
        if (mode == 'c') {
            mode = 'text/x-csrc';
        }

        // codemirror
        let editor = CodeMirror(function(elt) {
            myTextArea.parentNode.replaceChild(elt, myTextArea);
        }, {
            value: myTextArea.innerText,
            mode: mode,
            theme: "dracula",
            lineNumbers: true,
            viewportMargin: Infinity,
            lineWrapping: true,
        });

        console.log('identifier:', identifier);
        console.log('mode:', mode);
        console.log('editor:', editor);

        // compile/run button
        if (myTextArea.classList.contains('norun')) {
            i += 1;
            identifier = `#cb${i}`;
            continue;
        }

        let buttons = $('<div></div>');
        buttons.attr('class', 'buttons');

        let run = $('<button></button>');
        run.text('▶');
        run.attr('onclick', 'Demo.termInit(this)');
        buttons.append(run);

        let child = $(identifier)[0].childNodes[0];
        $(identifier)[0].insertBefore(buttons[0], child);

        i += 1;
        identifier = `#cb${i}`;
    }
}

function jekyll_to_codemirror() {

}

function org_to_codemirror() {

}

// starts up the websocket
function termInit(element) {
    let ed_parent = element.parentNode.parentNode;
    let ed = element.parentNode.parentNode.childNodes[1].CodeMirror;
    let code = ed.getValue();

    let language = ed.getMode().name;
    let terminal;

    if (! ed_parent.querySelector('#terminal')) {
        terminal = $('<div></div>');
        terminal.attr('id', 'terminal');

        let terminals = $('<pre></pre>')
        terminals.attr('class', 'terminals');
        terminals.attr('tabindex', '0');
        terminals.attr('contentEditable', 'true');

        terminal.append(terminals);
        ed_parent.append(terminal[0]);
        console.log('terminal:', terminal);
    }
    else {
        terminal = [
            ed_parent.querySelector('#terminal')
        ];
    }

    let args = {
        mode: 'code',
        code: code,
        language: language,
        terminal: terminal,
    }

    bootup(args);
}
