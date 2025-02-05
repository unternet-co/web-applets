import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './app-prompt.css';
import { model } from '../lib/model';
import { store } from '../lib/store';

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
    const value = input.value;

    this.promptState = 'thinking';
    input.value = '';

    const action = await model.getModelResponse(value, window.applet);

    window.applet.dispatchAction(action.id, action.arguments);

    this.promptState = 'idle';
  }

  render() {
    return html`
      <form @submit="${this.onSubmit}">
        <input
          autocomplete="off"
          id="prompt"
          name="prompt"
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
