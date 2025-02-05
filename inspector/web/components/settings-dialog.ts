import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ref, createRef, Ref } from 'lit/directives/ref.js';
import { store } from '../lib/store';
import './settings-dialog.css';

@customElement('settings-dialog')
export class SettingsDialog extends LitElement {
  @property({ type: Boolean })
  open: boolean = false;

  @property({ type: String })
  openAIAPIToken: string = '';

  private dialogRef: Ref<HTMLDialogElement> = createRef();
  private formRef: Ref<HTMLFormElement> = createRef();

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    store.subscribe((data) => {
      this.openAIAPIToken = data.settings?.openAIAPIToken;
      this.open = data.settingsDialogOpen;
    });
    super.connectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has('open')) {
      if (this.open) {
        this.dialogRef.value?.showModal();
      } else {
        this.dialogRef.value?.close();
      }
    }
  }

  onSave(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('openAIAPIToken') as HTMLInputElement;
    const openAIAPIToken = input.value;
    const settings = store.get().settings;

    store.update({ settings: { openAIAPIToken, ...settings } });

    this.onDismiss();
  }

  onClear(e: SubmitEvent) {
    e.preventDefault();

    const settings = store.get().settings;
    delete settings.openAIAPIToken;

    store.update({ settings: settings });
  }

  onDismiss() {
    this.formRef.value?.reset();
    store.update({ settingsDialogOpen: false });
  }

  render() {
    return html`
      <dialog ${ref(this.dialogRef)}>
        <div class="dialog-header">
          <h2>Settings</h2>
          <button
            aria-label="close dialog"
            class="close-dialog-button"
            @click="${this.onDismiss}"
          >
            <svg
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div class="dialog-content">
          <form
            ${ref(this.formRef)}
            id="settings-form"
            class="settings-form"
            @submit="${this.onSave}"
          >
            <fieldset .disabled=${!!this.openAIAPIToken}>
              <label for="openAIAPIToken">OpenAI API token</label>

              <input
                id="openAIAPIToken"
                name="openAIAPIToken"
                placeholder="${this.openAIAPIToken
                  ? '••••••••••••••••••••'
                  : ''}"
              />
            </fieldset>
            ${this.openAIAPIToken
              ? html`<button
                  class="clear-button"
                  ?disabled=${false}
                  @click="${this.onClear}"
                >
                  Clear
                </button>`
              : nothing}
          </form>
        </div>
        <div class="dialog-footer">
          <button type="submit" form="settings-form">Save</button>
          <button @click="${this.onDismiss}">Cancel</button>
        </div>
      </dialog>
    `;
  }
}
