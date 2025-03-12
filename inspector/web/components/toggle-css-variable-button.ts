import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { classMap } from 'lit/directives/class-map.js';

import './toggle-css-variable-button.css';

const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path fill-rule="evenodd" d="M6 4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H6ZM5 7a1 1 0 0 1 1-1h3v12H6a1 1 0 0 1-1-1V7Zm6 11h7a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-7v12Z" clip-rule="evenodd"/>
  </svg>`;

@customElement('toggle-css-variable-button')
export class ToggleCSSVariableButton extends LitElement {
  // Name of the CSS variable to toggle (e.g. '--sidebar-width')
  @property({ type: String }) componentName: string = '';
  // The value when the variable is "open"
  @property({ type: String }) defaultValue: string = '350px';
  // The SVG icon markup to use (default uses the provided arrow).
  @property({ type: String }) icon: string = defaultSvg;
  // Internal state for the button’s active class
  @property({ type: Boolean }) active: boolean = true;

  createRenderRoot() {
    return this;
  }

  toggle() {
    // Target the main element, or adjust the selector as needed.
    const element = document.querySelector(this.componentName) as HTMLElement;
    if (!element) {
      console.error('Element to toggle not found.');
      return;
    }

    if (element.classList.contains('open')) {
      element.classList.remove('open');
      element.classList.add('closed');
      this.active = false;
    } else {
      element.classList.remove('closed');
      element.classList.add('open');
      this.active = true;
    }
  }

  render() {
    return html`
      <button
        class=${classMap({ 'menu-button': true, active: this.active })}
        @click=${this.toggle}
      >
        ${unsafeHTML(this.icon)}
      </button>
    `;
  }
}
