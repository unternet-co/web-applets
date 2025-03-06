import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './app-root.css';
import './app-header';
import './app-viewer';
import './app-sidebar';
import './app-prompt';
import './app-history';
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
        <app-viewer></app-viewer>
        <app-history></app-history>
        <app-prompt></app-prompt>
      </main>
      <settings-dialog></settings-dialog>
    `;
  }
}
