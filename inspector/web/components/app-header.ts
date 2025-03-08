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
        icon='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="transform: rotate(180deg)">
            <path fill="currentColor" fill-rule="evenodd" d="M11.28 9.53 8.81 12l2.47 2.47a.75.75 0 1 1-1.06 1.06l-3-3a.75.75 0 0 1 0-1.06l3-3a.75.75 0 1 1 1.06 1.06z"/>
            <path fill="currentColor" fill-rule="evenodd" d="M3.75 2A1.75 1.75 0 0 0 2 3.75v16.5c0 .966.784 1.75 1.75 1.75h16.5A1.75 1.75 0 0 0 22 20.25V3.75A1.75 1.75 0 0 0 20.25 2H3.75zM3.5 3.75a.25.25 0 0 1 .25-.25H15v17H3.75a.25.25 0 0 1-.25-.25V3.75zm13 16.75v-17h3.75a.25.25 0 0 1 .25.25v16.5a.25.25 0 0 1-.25.25H16.5z"/>
         </svg>'
      >
      </toggle-css-variable-button>
    `;
  }
}
