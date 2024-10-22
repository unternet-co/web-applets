import { Applet, applets } from '../index';

class AppletView extends HTMLElement {
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
    if (this.applet.manifest.frameless) this.classList.add('frameless');
    this.applet.onstateupdated = () => {
      this.dispatchEvent(
        new CustomEvent('stateupdated', { detail: this.applet!.state })
      );
    };
    this.dispatchEvent(new CustomEvent('load'));
  }

  set state(state: any) {
    if (this.applet) this.applet.state = state;
    this.addEventListener('load', () => {
      this.applet!.state = state;
    });
  }
}

customElements.define('applet-frame', AppletView);
