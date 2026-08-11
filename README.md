![demonic logo](https://github.com/user-attachments/assets/9f8a0681-379d-4a5b-b053-7d3869d907f4)

# demonic-web

A web-based terminal for running commands and code snippets in a sandboxed environment.

Try it out at [liambeckman.com/code/demonic](https://liambeckman.com/code/demonic).

[![demonic in action](https://github.com/user-attachments/assets/fca462a7-8e06-46a3-ab31-6c7ecfcc77bc)](https://liambeckman.com/code/demonic)

## Installation

```sh
# get code
git clone https://github.com/lbeckman314/demonic-web
cd demonic-web

# install dependencies
npm install

# bundle webpack
npm run build
```

Upon opening `site/client.html` in your favorite browser you'll have an example of the demonic web client sharing commands and output with the demonic server.

![client terminal](https://github.com/user-attachments/assets/21f6966e-ba56-46da-a8cf-cf8c454bacfd)

# Uninstallation

```sh
# remove this directory
rm -rf demonic-web
```
# See Also

- [Demonic-Server](https://github.com/lbeckman314/demonic-web): The backend for this client.
- [Demonic-Docs](https://github.com/lbeckman314/demonic-docs): Integrates demonic-web into your documentation.
