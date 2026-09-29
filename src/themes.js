// xterm.js colour themes shared by run() and <demonic-terminal>.
export const darkTheme = {
    brightMagenta: '#ed68d9',
    brightGreen:   '#5af78e',
    brightBlue:    '#678cfa',
    brightCyan:    '#9aedfe',
    background:    '#000000',
    foreground:    '#ffffff',
    cursor:        '#ffffff',
};

export const lightTheme = {
    brightMagenta: '#ed68d9',
    brightGreen:   '#008000',
    brightBlue:    '#678cfa',
    brightCyan:    '#02bfe5',
    background:    '#fffafa',
    foreground:    '#000000',
    cursor:        '#000000',
};

// Default prompt shown before each command.
const MAGENTA = '\x1b[1;35m';
const GREEN = '\x1b[1;32m';
const CYAN = '\x1b[1;36m';
const NC = '\x1b[0m';
export const defaultPrompt = `${CYAN}demo${NC}${MAGENTA} @ ${NC}${CYAN}demonic${NC} ${GREEN}>${NC} `;
