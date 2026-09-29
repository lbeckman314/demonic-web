// Show "Running <name> by <author> (<license>)" in 'elem', with the name
// linked to the program's URL, or clear it when 'meta' is null. Built with
// textContent so values from the server are never parsed as HTML.
export function showAttribution(elem, meta) {
    elem.replaceChildren();
    if (meta == null)
        return;

    elem.append('Running ');

    let name = document.createElement('span');
    let url = null;
    try {
        url = meta.url ? new URL(meta.url) : null;
    } catch (err) {
        url = null;
    }
    if (url && (url.protocol == 'https:' || url.protocol == 'http:')) {
        name = document.createElement('a');
        name.href = url.href;
        name.target = '_blank';
        name.rel = 'noopener noreferrer';
    }
    name.textContent = meta.name;
    elem.append(name);

    if (meta.author)
        elem.append(` by ${meta.author}`);
    if (meta.license)
        elem.append(` (${meta.license})`);
}
