import { Applet, AppletDataEvent, AppletResizeEvent, applets } from '../index';

// TODO: Add resize event handler, and resize DOM element

class AppletFrame extends HTMLElement {
  container?: HTMLIFrameElement;
  applet?: Applet;
  loaded?: boolean;

  connectedCallback() {
    this.attachShadow({ mode: 'closed' });

    this.container = document.createElement('iframe');
    this.shadowRoot.appendChild(this.container);

    const styles = document.createElement('style');
    styles.textContent = this.styles;
    this.shadowRoot.appendChild(styles);
  }

  set url(url: string) {
    // Yeah, I can't remember why I added the timeout...
    // But you're too scared to remove it aren't you?
    setTimeout(() => this.loadApplet(url), 1);
  }

  async loadApplet(url: string) {
    if (!this.container) return;
    this.applet = await applets.load(url, this.container);

    // When data received, bubble the event up
    this.applet.ondata = (dataEvent: AppletDataEvent) => {
      this.dispatchEvent(dataEvent);
    };

    // Resize
    this.applet.onresize = (resizeEvent: AppletResizeEvent) => {
      this.resizeContainer(resizeEvent.dimensions);
    };

    // Emit a load event when loading complete
    this.dispatchEvent(new Event('load'));
    this.loaded = true;
  }

  // TODO: Handle removing listener
  set data(data: any) {
    if (this.applet && this.loaded) {
      this.applet.data = data;
    } else {
      this.addEventListener('load', () => {
        this.applet.data = data;
      });
    }
  }

  resizeContainer(dimensions: { height: number; width: number }) {
    this.container.style.height = `${dimensions.height + 2}px`;
  }

  get styles() {
    return /*css*/ `
      applet-frame {
        display: flex;
        flex-direction: column;
      }

      applet-frame iframe {
        border: none;
      }
    `;
  }
}

customElements.define('applet-frame', AppletFrame);
