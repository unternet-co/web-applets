import './app-viewer.css';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { store } from '../lib/store';
import './url-input.css';

@customElement('app-viewer')
export class AppViewer extends LitElement {
  @property()
  appletUrl = '';

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
    return html`<iframe src=${this.appletUrl}></iframe>`;
  }
}
