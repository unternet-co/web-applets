import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './app-header.css';
import './url-input';
import './settings-button';
import './toggle-css-variable-button';

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

      <toggle-css-variable-button
        variableName="--sidebar-width"
        defaultValue="1fr"
      >
      </toggle-css-variable-button>

      <toggle-css-variable-button
        variableName="--history-width"
        defaultValue="1.5fr"
        icon='<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.5 2.5V17.5M11.6667 7.5L14.1667 10L11.6667 12.5M4.16667 2.5H15.8333C16.7538 2.5 17.5 3.24619 17.5 4.16667V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>'
      >
      </toggle-css-variable-button>
    `;
  }
}
