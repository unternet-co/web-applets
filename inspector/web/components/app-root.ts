import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './app-root.css';
import './app-header';
import './app-viewer';
import './app-sidebar';
import './app-prompt';
import './settings-dialog';

@customElement('app-root')
export class UrlInput extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <app-header></app-header>
      <main>
        <app-sidebar></app-sidebar>
        <div class="column">
          <app-viewer></app-viewer>
          <app-prompt></app-prompt>
        </div>
      </main>
      <settings-dialog></settings-dialog>
    `;
  }
}
