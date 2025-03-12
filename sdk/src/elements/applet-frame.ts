import { Applet, AppletEvent, applets } from '../index.js';
import { dispatchEventAndHandler } from '../utils.js';

export class AppletFrameElement extends HTMLElement {
  #root: ShadowRoot;
  #src?: string;
  #applet?: Applet;
  #dispatchEventAndHandler = dispatchEventAndHandler.bind(this);
  #iframe?: HTMLIFrameElement = document.createElement('iframe');

  onload: (event: Event) => Promise<void> | void;
  onactions: (event: AppletEvent) => Promise<void> | void;
  ondata: (event: AppletEvent) => Promise<void> | void;

  static observedAttributes = ['src'];

  connectedCallback() {
    this.#root = this.attachShadow({ mode: 'closed' });
    this.#root.appendChild(this.#iframe);
    const styles = document.createElement('style');
    styles.textContent = this.styles;
    this.#root.appendChild(styles);
    this.src = this.getAttribute('src');
  }

  get contentWindow() {
    return this.#iframe.contentWindow;
  }

  set src(value: string) {
    this.#src = value;
    this.#applet = undefined;
    this.#loadApplet(value);
  }

  get src() {
    return this.#src || '';
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'src') {
      this.src = newValue;
    }
  }

  async #loadApplet(url: string) {
    this.#iframe.src = url;
    const window = this.#iframe.contentWindow;
    if (!window) return;

    this.#applet = await applets.connect(window);

    // When data received, bubble the event up
    this.#applet.ondata = (event: AppletEvent) => {
      this.#dispatchEventAndHandler(event);
    };

    // Resize
    this.#applet.onresize = (event: AppletEvent) => {
      this.#resizeContainer({
        width: this.#applet.width,
        height: this.#applet.height,
      });
    };

    this.#applet.onactions = (event: AppletEvent) => {
      this.#dispatchEventAndHandler(event);
    };

    // Emit load event when setup & connection complete
    this.#dispatchEventAndHandler(new Event('load'));
    if (this['load'] && typeof this['load'] === 'function') {
      this.onload(new Event('load'));
    }
  }

  get applet() {
    return this.#applet;
  }

  set data(data: any) {
    if (this.applet) {
      this.applet.data = data;
    } else {
      const listener = () => {
        if (this.applet) this.applet.data = data;
        this.removeEventListener('load', listener);
      };
      this.addEventListener('load', listener);
    }
  }

  #resizeContainer(dimensions: { height: number; width: number }) {
    this.style.height = `${dimensions.height}px`;
  }

  get styles() {
    return /*css*/ `
      :host {
        background: white;
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

export const test = 'test';

customElements.define('applet-frame', AppletFrameElement);
