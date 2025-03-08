import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import './toggle-css-variable-button.css';

const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path fill="currentColor" fill-rule="evenodd" d="M11.28 9.53 8.81 12l2.47 2.47a.75.75 0 1 1-1.06 1.06l-3-3a.75.75 0 0 1 0-1.06l3-3a.75.75 0 1 1 1.06 1.06z"/>
  <path fill="currentColor" fill-rule="evenodd" d="M3.75 2A1.75 1.75 0 0 0 2 3.75v16.5c0 .966.784 1.75 1.75 1.75h16.5A1.75 1.75 0 0 0 22 20.25V3.75A1.75 1.75 0 0 0 20.25 2H3.75zM3.5 3.75a.25.25 0 0 1 .25-.25H15v17H3.75a.25.25 0 0 1-.25-.25V3.75zm13 16.75v-17h3.75a.25.25 0 0 1 .25.25v16.5a.25.25 0 0 1-.25.25H16.5z"/>
</svg>`;

@customElement('toggle-css-variable-button')
export class ToggleCSSVariableButton extends LitElement {
  // Name of the CSS variable to toggle (e.g. '--sidebar-width')
  @property({ type: String }) variableName: string = '';
  // The value when the variable is "open"
  @property({ type: String }) defaultValue: string = '1fr';
  // The SVG icon markup to use (default uses the provided arrow).
  @property({ type: String }) icon: string = defaultSvg;

  createRenderRoot() {
    return this;
  }

  toggle() {
    // Target the main element, or adjust the selector as needed.
    const mainElement = document.querySelector('main') as HTMLElement;
    if (!mainElement) {
      console.error('Main element not found.');
      return;
    }
    const currentValue = getComputedStyle(mainElement)
      .getPropertyValue(this.variableName)
      .trim();
    // If the value is '0px', switch to the default open value, otherwise set to '0px'
    if (currentValue === '0px') {
      mainElement.style.setProperty(this.variableName, this.defaultValue);
    } else {
      mainElement.style.setProperty(this.variableName, '0px');
    }
  }

  render() {
    return html`
      <button class="menu-button" @click=${this.toggle}>
        ${unsafeHTML(this.icon)}
      </button>
    `;
  }
}
