import { Applet, AppletEvent, applets } from '../index';
import { dispatchEventAndHandler } from '../utils';

export class AppletFrameElement extends HTMLElement {
  #root: ShadowRoot;
  #src?: string;
  #applet?: Applet;
  #dispatchEventAndHandler = dispatchEventAndHandler.bind(this);
  container?: HTMLIFrameElement;
  ready?: boolean;

  onload: (event: Event) => Promise<void> | void;
  onactions: (event: AppletEvent) => Promise<void> | void;
  ondata: (event: AppletEvent) => Promise<void> | void;

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
    if (!this.container) return;

    this.container.src = url;
    const window = this.container.contentWindow;
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
      this.#dispatchEventAndHandler(event);
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

  #resizeContainer(dimensions: { height: number; width: number }) {
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

customElements.define('applet-frame', AppletFrameElement);
