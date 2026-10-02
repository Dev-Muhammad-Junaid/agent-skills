// Called by ViewController with the extension's state. `enabled` is undefined when Safari can't say.
function show(enabled) {
    document.body.classList.toggle('state-on', enabled === true);
    document.body.classList.toggle('state-off', enabled !== true);
}

document.querySelector('button.open-preferences').addEventListener('click', () => {
    webkit.messageHandlers.controller.postMessage('open-preferences');
});
