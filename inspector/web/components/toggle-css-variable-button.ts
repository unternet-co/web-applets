import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import './toggle-css-variable-button.css';

const defaultSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12.5 2.5V17.5M8.33333 12.5L5.83333 10L8.33333 7.5M4.16667 2.5H15.8333C16.7538 2.5 17.5 3.24619 17.5 4.16667V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

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
