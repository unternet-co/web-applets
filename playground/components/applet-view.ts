export class AppletView extends HTMLElement {
  iframe = document.createElement('iframe');
  ready: boolean = false;

  connectedCallback() {
    this.appendChild(this.iframe);
    window.addEventListener('message', (event) => {
      if (event.source !== this.iframe.contentWindow) return;
      if (event.data.type === 'ready') {
        this.ready = true;
        this.dispatchEvent(new CustomEvent('ready'));
      } else {
        this.dispatchEvent(
          new CustomEvent('message', {
            detail: event.data,
          })
        );
      }
    });
  }

  set url(url: string) {
    this.iframe.src = url;
  }

  postMessage(obj: unknown) {
    if (this.ready) {
      this.iframe.contentWindow?.postMessage(obj);
    } else {
      // Change to a queue of messages, and make ready just a normal message
      this.addEventListener('ready', () => {
        console.log('ready');
        this.iframe.contentWindow?.postMessage(obj);
      });
    }
  }

  set state(state: unknown) {
    if (this.ready) {
      this.iframe.contentWindow?.postMessage({ type: 'state', state });
    } else {
      this.addEventListener('ready', () => {
        this.iframe.contentWindow?.postMessage({
          type: 'state',
          state,
        });
      });
    }
  }
}

customElements.define('applet-view', AppletView);
