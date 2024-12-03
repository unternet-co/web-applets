import { Applet, AppletDataEvent, applets } from '../index';

// TODO: Add resize event handler, and resize DOM element

// resizeContainer(dimensions: { height: number; width: number }) {
//   this.container.style.height = `${dimensions.height + 2}px`;
// }

class AppletFrame extends HTMLElement {
  container?: HTMLIFrameElement;
  applet?: Applet;

  connectedCallback() {
    const styles = document.createElement('style');
    styles.textContent = this.styles;
    this.appendChild(styles);

    this.container = document.createElement('iframe');
    this.appendChild(this.container);
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

    applet-frame:not(.frameless) {
      border: 1px solid #ddd;
    }

    applet-frame.frameless {
      padding: 0 7px;
    }
    `;
  }

  set url(url: string) {
    setTimeout(() => this.loadApplet(url), 1);
  }

  async loadApplet(url: string) {
    if (!this.container) return;
    this.applet = await applets.load(url, this.container);
    // if (this.applet.manifest.frameless) this.classList.add('frameless');
    this.applet.ondata = (dataEvent: AppletDataEvent) => {
      this.dispatchEvent(dataEvent);
    };
    this.dispatchEvent(new Event('load'));
  }

  set data(data: any) {
    if (this.applet) this.applet.data = data;
    // In case applet hasn't loaded yet
    this.addEventListener('load', () => {
      this.applet.data = data;
    });
  }
}

customElements.define('applet-frame', AppletFrame);
