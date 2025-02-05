import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './app-header.css';
import './url-input';
import './settings-button';

@customElement('app-header')
export class UrlInput extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <h1>Applet Inspector</h1>
      <url-input></url-input>
      <settings-button></settings-button>
    `;
  }
}
