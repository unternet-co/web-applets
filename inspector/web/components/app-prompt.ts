import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './app-prompt.css';
import { model } from '../lib/model';
import { store } from '../lib/store';
import { historyContext, InteractionOutput } from '../lib/history-context';

type State = 'idle' | 'thinking';

@customElement('app-prompt')
export class AppPrompt extends LitElement {
  @property({ type: String })
  openAIAPIToken: string = '';

  @property({ type: String })
  promptState: State = 'idle';

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    store.subscribe((data) => {
      this.openAIAPIToken = data.settings?.openAIAPIToken;
    });
    super.connectedCallback();
  }

  async onSubmit(e: SubmitEvent) {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('prompt') as HTMLInputElement;
    const userMessage = input.value.trim();
    if (!userMessage) return;

    this.promptState = 'thinking';
    input.value = '';

    const response = await model.getModelResponse(userMessage, window.applet);

    // contruct array for storing outputs from model
    const outputs: InteractionOutput[] = [];

    // store text in the output array
    if (response.text) outputs.push({ type: 'text', content: response.text });

    if (response.tools && response.tools.length > 0) {
      await Promise.all(
        response.tools.map(async (tool) => {
          await window.applet.sendAction(tool.id, tool.arguments);

          // store tool used in the output array
          outputs.push({ type: tool.id, arguments: tool.arguments });

          // store tool data in the output array
          if (window.applet.data)
            outputs.push({
              type: 'data',
              content: window.applet.data as object,
            });
        })
      );
    }

    // Add the interaction to the context.
    historyContext.addInteraction({
      input: { type: 'command', text: userMessage },
      outputs,
      timestamp: Date.now(),
    });

    this.promptState = 'idle';
    setTimeout(() =>
      (document.getElementById('prompt') as HTMLInputElement).focus()
    );
  }

  render() {
    return html`
      <form @submit="${this.onSubmit}">
        <input
          autocomplete="off"
          id="prompt"
          name="prompt"
          autofocus
          .disabled="${!this.openAIAPIToken || this.promptState === 'thinking'}"
          placeholder="${this.openAIAPIToken
            ? this.promptState === 'thinking'
              ? 'Thinking…'
              : 'Start typing to interact…'
            : 'Update your OpenAI API key in the settings dialog to interact via the prompt.'}"
        />
        ${this.promptState === 'thinking'
          ? html`
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="loader"
              >
                <circle cx="12" cy="12" r="9" />
              </svg>
            `
          : nothing}
      </form>
    `;
  }
}
