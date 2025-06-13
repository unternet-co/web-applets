import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './app-history.css';
import {
  historyContext,
  Interaction,
  TextOutput,
} from '../lib/history-context';

@customElement('app-history')
export class AppHistory extends LitElement {
  createRenderRoot() {
    return this;
  }

  @state()
  interactions: Interaction[] = [];

  private unsubscribe?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribe = historyContext.subscribe((interactions) => {
      // Create a new array reference to trigger reactivity.
      this.interactions = [...interactions];
    });
  }

  disconnectedCallback() {
    this.unsubscribe && this.unsubscribe();
    super.disconnectedCallback();
  }

  render() {
    // Helper to render all properties of an output (except the "type" property).
    const renderOutputProperties = (output: any): string => {
      return Object.entries(output)
        .filter(([key]) => key !== 'type')
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // Use JSON.stringify for objects; you can also customize formatting if needed.
            return `${key}: ${JSON.stringify(value)}`;
          }
          return `${key}: ${value}`;
        })
        .join(', ');
    };

    return html`
      <div class="history">
        ${this.interactions.length <= 0
        ? html`
              <div class="action-output">
                <span class="status-message">Enter a message below to interact</span>
              </div>
            `
        : html``}
        ${this.interactions.slice().reverse().map((interaction) => {
          // Render the user's input bubble.
          const inputBubble =
            interaction.input.type === 'command'
              ? html`
                  <div class="bubble-container user-bubble-container">
                    <div class="bubble user">
                      <strong>You:</strong>
                      <span>${interaction.input.text}</span>
                    </div>
                  </div>
                `
              : html``;

          // Render outputs that are not of type "data".
          const outputBubbles = interaction.outputs
            .filter((output) => output.type !== 'data')
            .map((output) => {
              if (interaction.input.type === 'command') {
                // For command inputs:
                if (output.type === 'text') {
                  // "text" outputs from the assistant.
                  return html`
                    <div class="bubble-container assistant-bubble-container">
                      <div class="bubble assistant">
                        <strong>Assistant:</strong>
                        <span>${(output as TextOutput).content}</span>
                      </div>
                    </div>
                  `;
                } else {
                  // Any other output type (generic AppletOutput) shown as grey bubble.
                  return html`
                    <div class="action-output">
                      <strong>Action: ${output.type}</strong>
                      <span>${renderOutputProperties(output)}</span>
                    </div>
                  `;
                }
              } else if (interaction.input.type === 'action') {
                // For action inputs, always use a grey bubble.
                return html`
                  <div class="action-output">
                    <strong>Action: ${interaction.input.text}</strong>
                    <span>{${renderOutputProperties(output)}}</span>
                  </div>
                `;
              }
              return html``;
            });

          return html`${outputBubbles}${inputBubble}`;
        })}
      </div>
    `;
  }
}
