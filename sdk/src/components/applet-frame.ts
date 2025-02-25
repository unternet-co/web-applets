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
  #applet?: Applet;
  container?: HTMLIFrameElement;
  ready?: boolean;

  static observedAttributes = ['src'];

  connectedCallback() {
    this.#root = this.attachShadow({ mode: 'open' });

    this.container = document.createElement('iframe');
    this.#root.appendChild(this.container);

    const styles = document.createElement('style');
    styles.textContent = this.styles;
    this.#root.appendChild(styles);
    this.src = this.getAttribute('src');
  }

  set src(value: string) {
    this.#src = value;
    this.loadApplet(value);
  }

  get src() {
    return this.#src || '';
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'src') {
      this.src = newValue;
    }
  }

  async loadApplet(url: string) {
    if (!this.container) return;

    this.container.src = url;
    const window = this.container.contentWindow;
    if (!window) return;

    this.#applet = await applets.connect(window);

    // When data received, bubble the event up
    this.#applet.ondata = (dataEvent: AppletDataEvent) => {
      this.dispatchEvent(dataEvent);
    };

    // Resize
    this.#applet.onresize = (resizeEvent: AppletResizeEvent) => {
      this.resizeContainer(resizeEvent.dimensions);
    };

    this.#applet.onactions = (e: AppletActionsEvent) => {};

    // Emit ready load event when loading complete
    this.dispatchEvent(new Event('load'));
    if (this['load'] && typeof this['load'] === 'function') {
      this.onload(new Event('load'));
    }
  }

  get applet() {
    return this.#applet;
  }

  set data(data: any) {
    if (this.applet && this.ready) {
      this.applet.data = data;
    } else {
      const listener = () => {
        if (this.applet) this.applet.data = data;
        this.removeEventListener('load', listener);
      };
      this.addEventListener('load', listener);
    }
  }

  resizeContainer(dimensions: { height: number; width: number }) {
    this.style.height = `${dimensions.height}px`;
  }

  get styles() {
    return /*css*/ `
      :host {
        display: flex;
        flex-direction: column;
        height: 350px;
      }

      iframe {
        border: none;
        height: 100%;
        width: 100%;
      }
    `;
  }
}

customElements.define('applet-frame', AppletFrame);
