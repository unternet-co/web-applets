import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
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
      <toggle-css-variable-button componentName="app-sidebar">
      </toggle-css-variable-button>
      <h1>Applet Inspector</h1>
      <div class="center-group">
        <url-input></url-input>
        <settings-button></settings-button>
      </div>
      <toggle-css-variable-button
        componentName="app-history"
        icon='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M6 4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H6ZM5 7a1 1 0 0 1 1-1h7v12H6a1 1 0 0 1-1-1V7Zm10 11h3a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-3v12Z" clip-rule="evenodd"/>
          </svg>'
      >
      </toggle-css-variable-button>
    `;
  }
}
