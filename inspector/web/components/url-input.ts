import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { store } from '../lib/store';
import './url-input.css';

@customElement('url-input')
export class UrlInput extends LitElement {
  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      if (
        target.value &&
        !target.value.startsWith('http://') &&
        !target.value.startsWith('https://')
      ) {
        target.value = `http://${target.value}`;
      }
      store.update({ appletUrl: target.value });
    }
  }

  render() {
    return html`<input
      value=${store.get().appletUrl}
      type="text"
      placeholder="Enter an applet URL to inspect..."
      @keydown=${this.handleKeyDown.bind(this)}
    />`;
  }
}
