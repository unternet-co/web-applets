import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './app-history.css';
import { historyContext, Interaction } from '../lib/history-context';

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
    // Subscribe to updates in the history context.
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
    // Helper function to dynamically render all properties of the output,
    // excluding the "type" property.
    const renderOutputProperties = (output: any): string => {
      return Object.entries(output)
        .filter(([key]) => key !== 'type')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    };

    return html`
      <div class="history">
        ${this.interactions.map((interaction) => {
          // Render input bubble (always user)
          const inputBubble = html`
            <div class="bubble-container user-bubble-container">
              <div class="bubble user">
                <strong>You:</strong>
                <span>${interaction.input.text}</span>
              </div>
            </div>
          `;

          let outputBubble = html``;
          if (interaction.outputs && interaction.outputs.length > 0) {
            const output = interaction.outputs[0];
            let containerClass = '';
            let label = '';
            let outputContent = '';

            if (interaction.input.type === 'command') {
              // For "command", the output is from the assistant.
              containerClass = 'assistant-bubble-container';
              label = 'Assistant:';
              outputContent = `ACTION: ${
                interaction.id
              },\n${renderOutputProperties(output)}`;
            } else if (interaction.input.type === 'action') {
              // For "action", the output is from the user (omit the ID).
              containerClass = 'user-bubble-container';
              label = 'You:';
              outputContent = renderOutputProperties(output);
            }

            outputBubble = html`
              <div class="bubble-container ${containerClass}">
                <div
                  class="bubble ${interaction.input.type === 'command'
                    ? 'assistant'
                    : 'user'}"
                >
                  <strong>${label}</strong>
                  <span>${outputContent}</span>
                </div>
              </div>
            `;
          }

          return html`${inputBubble}${outputBubble}`;
        })}
      </div>
    `;
  }
}
