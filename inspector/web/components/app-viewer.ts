import './app-viewer.css';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { StorageData, store } from '../lib/store';
import '@web-applets/sdk/dist/elements/applet-frame';
import { AppletFrame } from '@web-applets/sdk/dist/elements/applet-frame';
import './url-input.css';
import { Applet } from '@web-applets/sdk';

declare global {
  interface Window {
    applet: Applet;
  }
}

@customElement('app-viewer')
export class AppViewer extends LitElement {
  renderRoot = this;

  @property()
  appletUrl: string = '';

  @property()
  mode: string = 'gui';

  @property({ attribute: false })
  data: any = {};

  connectedCallback() {
    store.subscribe((data: StorageData) => {
      this.appletUrl = data.appletUrl;
      if (!data.applet) return;
      this.data = data.applet.data;
      data.applet.ondata = () => (this.data = data.applet.data);
    });
    super.connectedCallback();
  }

  updated() {
    const frame = document.querySelector('applet-frame') as AppletFrame;
    if (!frame) return;
    frame.onload = () => {
      store.update({ applet: frame.applet });
      window.applet = frame.applet;
      window.applet.ondata = (e) => (this.data = e.data);
    };
  }

  render() {
    const footer = html`<div class="applet-footer">
      <label>View as:</label>
      <div class="toggle">
        <button
          data-selected=${this.mode === 'gui'}
          @mousedown=${() => (this.mode = 'gui')}
        >
          GUI
        </button>
        <button
          data-selected=${this.mode === 'data'}
          @mousedown=${() => (this.mode = 'data')}
        >
          Data
        </button>
      </div>
    </div>`;

    return html`
      <div class="container">
        <applet-frame
          src=${this.appletUrl}
          class=${this.mode === 'gui' ? '' : 'hidden'}
        ></applet-frame>
        <pre class=${this.mode === 'gui' ? 'hidden' : 'data-view'}>
${JSON.stringify(this.data, null, 2)}</pre
        >
        ${footer}
      </div>
    `;
  }
}
