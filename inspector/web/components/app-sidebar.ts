import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './app-sidebar.css';
import { StorageData, store } from '../lib/store';
import { AppletActionDescriptor } from '@web-applets/sdk';
import { isEmpty } from '../../../utils/common-utils.mjs';
import { historyContext } from '../lib/history-context';

@customElement('app-sidebar')
export class AppSidebar extends LitElement {
  renderRoot = this;

  @property({ type: Number })
  selected: number = 0;

  @property({ attribute: false })
  actions: { [id: string]: AppletActionDescriptor } = {};

  @property({ type: String })
  schemaError: string = '';

  connectedCallback() {
    store.subscribe((data: StorageData) => {
      if (!data.applet) return;
      this.actions = data.applet.actions;
      data.applet.onactions = (e) => (this.actions = e.actions);
    });
    super.connectedCallback();
  }

  handleSelect(e: InputEvent) {
    const select = e.target as HTMLSelectElement;
    this.selected = select.selectedIndex;
  }

  handleSchemaChange(e: InputEvent) {
    const textarea = e.target as HTMLTextAreaElement;

    const trimmed = textarea.value.trim();

    if (!trimmed) {
      this.schemaError = '';
      textarea.setCustomValidity('');
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      const formatted = JSON.stringify(parsed, null, 2);

      textarea.value = formatted;
      this.schemaError = '';
      textarea.setCustomValidity('');
    } catch (err) {
      this.schemaError = err.message;
      textarea.setCustomValidity('Invalid JSON');
    }
  }

  handleSchemaFocus(e: InputEvent) {
    const textarea = e.target as HTMLTextAreaElement;

    textarea.setCustomValidity('');
  }

  async handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const actionId = formData.get('action-id') as string;
    const params = formData.get('params') as string;

    await window.applet.sendAction(actionId, JSON.parse(params));

    // Add the user's action to the context.
    historyContext.addInteraction({
      input: { type: 'action', text: actionId },
      outputs: [
        { type: actionId, ...JSON.parse(params) },
        { type: 'data', content: window.applet.data },
      ],
      timestamp: Date.now(),
    });
  }

  render() {
    if (!this.actions || isEmpty(this.actions)) {
      return html`<p class="status-message">No actions available.</p>`;
    }

    const action = Object.values(this.actions)[this.selected];

    const schema = JSON.stringify(action?.params_schema, null, 2) ?? 'None';

    return html`
      <form @submit=${this.handleSubmit.bind(this)}>
        <fieldset class="select">
          <label>Select an action</label>
          <action-select
            .actions=${this.actions}
            name="action-id"
            @change=${this.handleSelect.bind(this)}
          ></action-select>
        </fieldset>
        <fieldset>
          <label>Description</label>
          <p class="description">${action?.description}</p>
        </fieldset>
        <fieldset>
          <label>Schema</label>
          <pre class="schema">${schema}</pre>
        </fieldset>
        <fieldset>
          <label>Parameters</label>
          <textarea
            rows=${6}
            name="params"
            @focus=${this.handleSchemaFocus}
            @change=${this.handleSchemaChange.bind(this)}
          >
{}</textarea
          >
          ${this.schemaError
            ? html`<div class="error-message">${this.schemaError}</div>`
            : ''}
        </fieldset>
        <fieldset>
          <input type="submit" value="Dispatch action" />
        </fieldset>
      </form>
    `;
  }
}

@customElement('action-select')
export class ActionSelect extends LitElement {
  renderRoot = this;

  @property({ type: String })
  name: string;

  @property({ attribute: false })
  actions: { [id: string]: AppletActionDescriptor };

  render() {
    return html`
      <select name=${this.name}>
        ${Object.keys(this.actions).map((actionId) => {
          return html`<option id="action">${actionId}</option>`;
        })}
      </select>
    `;
  }
}
