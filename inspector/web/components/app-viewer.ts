import './app-viewer.css';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { store } from '../lib/store';
import '../node_modules/@web-applets/sdk/dist/components/applet-frame';
import './url-input.css';

@customElement('app-viewer')
export class AppViewer extends LitElement {
  @property()
  appletUrl: string = '';

  connectedCallback() {
    store.subscribe((data) => {
      this.appletUrl = data.appletUrl;
    });
    super.connectedCallback();
  }

  createRenderRoot() {
    return this;
  }

  render() {
    return html`<applet-frame src=${this.appletUrl}></applet-frame>`;
  }
}
