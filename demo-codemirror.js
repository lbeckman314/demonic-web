var sel_top = document.getElementById("buffers_top");
CodeMirror.on(sel_top, "change", function() {
    selectBuffer(ed, sel_top.options[sel_top.selectedIndex].value);
});


var buffers = {};

function openBuffer(name, text, mode) {
    buffers[name] = CodeMirror.Doc(text, mode);
    var opt = document.createElement("option");
    opt.appendChild(document.createTextNode(name));
    sel_top.appendChild(opt);
}

function newBuf(where) {
    var name = prompt("Name for the buffer", "*scratch*");
    if (name == null) return;
    if (buffers.hasOwnProperty(name)) {
        alert("There's already a buffer by that name.");
        return;
    }
    openBuffer(name, "", "javascript");
}

function selectBuffer(editor, name) {
    var buf = buffers[name];
    if (buf.getEditor()) buf = buf.linkedDoc({sharedHist: true});
    var old = editor.swapDoc(buf);
    var linked = old.iterLinkedDocs(function(doc) {linked = doc;});
    if (linked) {
        // Make sure the document in buffers is the one the other view is looking at
        for (var name in buffers) if (buffers[name] == old) buffers[name] = linked;
        old.unlinkDoc(linked);
    }
    editor.focus();
}

function nodeContent(id) {
    console.log(id);
    var node = document.getElementById(id), val = node.textContent || node.innerText;
    val = val.slice(val.match(/^\s*/)[0].length, val.length - val.match(/\s*$/)[0].length) + "\n";
    return val;
}

openBuffer("c",
`#include <stdio.h>

int main() {
    printf("%s\\n", "hello!");
    return 0;
}

`, "text/x-csrc");

openBuffer("js", "console.log('hello!');", "javascript");
openBuffer("py", `print('hello!')
val = input("Enter your value: ")
print(val)`, "python");
openBuffer("css", nodeContent("style"), "css");
var ed = CodeMirror(document.getElementById("code_top"), {
    lineNumbers: true,
    mode: "text/x-csrc",
    theme: "dracula",
});
selectBuffer(ed, "c");


function termInit() {
    let ed = document.querySelector('.CodeMirror').CodeMirror;
    console.log('ed:', ed);

    let code = ed.getValue();
    console.log('code:', code);

    let language = ed.getMode().name;
    console.log('language:', language);
    console.log('SHOW:', $('#terminal').show().length);

    if ($('#terminal').show().length == 0) {
        let terminal = $('<div></div>');
        terminal.attr('id', 'terminal');

        let terminals = $('<pre></pre>')
        terminals.attr('class', 'terminals');
        terminals.attr('tabindex', '0');
        terminals.attr('contentEditable', 'true');

        terminal.append(terminals);
        $('#buttons').append(terminal);
        console.log('terminal:', terminal);
    }

    let args = {
        mode: 'code',
        code: code,
        language: language,
    }

    Demo.bootup(args);
}

