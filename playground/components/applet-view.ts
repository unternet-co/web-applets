export class AppletView extends HTMLElement {
  iframe = document.createElement('iframe');
  ready: boolean = false;

  connectedCallback() {
    this.appendChild(this.iframe);
    window.addEventListener('message', (event) => {
      if (
        event.source === this.iframe.contentWindow &&
        event.data.type === 'ready'
      ) {
        this.ready = true;
        this.dispatchEvent(new CustomEvent('ready'));
      }
    });
  }

  set url(url: string) {
    this.iframe.src = url;
  }

  set state(state: unknown) {
    if (this.ready) {
      this.iframe.contentWindow?.postMessage({ type: 'state', payload: state });
    } else {
      this.addEventListener('ready', () => {
        this.iframe.contentWindow?.postMessage({
          type: 'state',
          payload: state,
        });
      });
    }
  }
}

customElements.define('applet-view', AppletView);
