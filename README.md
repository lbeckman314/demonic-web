![demonic logo](https://github.com/user-attachments/assets/9f8a0681-379d-4a5b-b053-7d3869d907f4)

# demonic-web

A web-based terminal for running commands and code snippets in a sandboxed environment.

Try it out at [liambeckman.com/code/demonic](https://liambeckman.com/code/demonic).

[![demonic in action](https://github.com/user-attachments/assets/fca462a7-8e06-46a3-ab31-6c7ecfcc77bc)](https://liambeckman.com/code/demonic)

## Usage

Install the package from npm or straight from GitHub:

```sh
npm install demonic-web
# or
npm install github:lbeckman314/demonic-web
```

Import it once (this registers the `<demonic-terminal>` element and its styles), then put terminals anywhere in your pages:

```html
<script type="module">
  import "demonic-web";
</script>

<demonic-terminal
  url="wss://demonic.example.com"
  command="fortune | cowsay | lolcat"
  examples='["pokeductor", "pipes.sh", "fortune | cowsay | lolcat"]'
  theme="auto"
  autostart="click">
</demonic-terminal>
```

| Attribute   | Default   | Description |
| -           | -         | -           |
| `url`       | (required) | WebSocket address of a [demonic-server](https://github.com/lbeckman314/demonic-server). |
| `command`   |           | Command typed at the prompt when the terminal starts, ready for the visitor to press Enter. |
| `examples`  | `[]`      | JSON list of commands shown as buttons below the terminal. Clicking one types it at the prompt (starting the terminal if needed). |
| `theme`     | `auto`    | `dark`, `light`, or `auto`: follow the page's `<html data-theme="...">` attribute (updating when it changes), falling back to the visitor's colour scheme preference. |
| `autostart` | `click`   | When to connect: `click` shows a start button, `visible` connects when the terminal scrolls into view, `load` connects immediately. Every open terminal holds a session on the server (which limits sessions per visitor), so prefer `click` or `visible`. |
| `prompt`    | `demo @ demonic > ` | Prompt text; may contain ANSI colour codes. |

Style it with the CSS custom properties `--demonic-height` (height of the terminal screen, default `25em`) and `--demonic-font-family`. All of the element's styles are scoped to `demonic-terminal`, so they do not affect the rest of the page.

The terminal is created when the element is added to the page and torn down (socket closed, timers stopped) when it is removed, so it works with client-side navigation such as Astro's `<ClientRouter />`, and any number of terminals can share a page. The status bar has a full-screen toggle, which suits full-screen programs.

The bundle is also available without a build step at `dist/demonic-terminal.js` (an ES module).

### Legacy `run()` API

The original API, which builds the terminal inside `.demonic-web`, `#status` and `#demonic-examples` elements, is still available as `demonic-web/legacy` (`dist/demonic-web.bundle.js`):

```js
import demonic from "demonic-web/legacy";
demonic.run({ url: "wss://demonic.example.com", data: "fortune | cowsay" });
```

Its stylesheet styles some elements page-wide (for example all `button`s), so prefer `<demonic-terminal>` for new pages.

## Development

```sh
git clone https://github.com/lbeckman314/demonic-web
cd demonic-web
npm install
npm run build   # production bundles in dist/
npm run dev     # development bundles with source maps
```

The built bundles in `dist/` are committed so the package can be installed straight from GitHub; rebuild and commit them with every change to `src/` or `assets/`.

## Attribution

When the server sends attribution for a program (its `author`, `url` and `license` from the server's `process.yaml`), the status bar shows "Running *name* by *author* (*license*)", with the name linked to the program's page, until the program exits.

# Uninstallation

```sh
# remove this directory
rm -rf demonic-web
```
# See Also

- [Demonic-Server](https://github.com/lbeckman314/demonic-web): The backend for this client.
- [Demonic-Docs](https://github.com/lbeckman314/demonic-docs): Integrates demonic-web into your documentation.
