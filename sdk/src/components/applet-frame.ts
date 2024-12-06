import {
  Applet,
  AppletActionsEvent,
  AppletDataEvent,
  AppletResizeEvent,
  applets,
} from '../index';

// TODO: Add resize event handler, and resize DOM element

export class AppletFrame extends HTMLElement {
  #root: ShadowRoot;
  #src?: string;
  container?: HTMLIFrameElement;
  applet?: Applet;
  loaded?: boolean;

  static observedAttributes = ['src'];

  connectedCallback() {
    this.#root = this.attachShadow({ mode: 'open' });

    this.container = document.createElement('iframe');
    this.#root.appendChild(this.container);

    const styles = document.createElement('style');
    styles.textContent = this.styles;
    this.#root.appendChild(styles);

    const url = this.getAttribute('src');
    if (url) this.loadApplet(url);
  }

  set src(value: string) {
    this.#src = value;
    this.loadApplet(value);
  }

  get src() {
    return this.#src;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'src') {
      this.src = newValue;
    }
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

    this.applet.onactions = (e: AppletActionsEvent) => {};

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
      :host {
        display: flex;
        flex-direction: column;
      }

      iframe {
        border: none;
      }
    `;
  }
}

customElements.define('applet-frame', AppletFrame);
