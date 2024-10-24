import { AppletManifestDict, applets } from '../../../sdk/dist';
export type SelectEvent = CustomEvent<string>;

export class AppletSelect extends HTMLElement {
  selectElem = document.createElement('select');
  applets: AppletManifestDict = {};

  connectedCallback() {
    this.selectElem.addEventListener('change', this.handleSelect.bind(this));
    this.asyncSetup();
  }

  async asyncSetup() {
    this.applets = await applets.list('/applets');
    console.log(this.applets);
    this.render();
  }

  disconnectedCallback() {
    this.selectElem.removeEventListener('change', this.handleSelect.bind(this));
  }

  handleSelect() {
    this.dispatchEvent(
      new CustomEvent('applet-select', { detail: this.selectElem.value })
    );
  }

  render() {
    this.selectElem.innerHTML = Object.keys(this.applets)
      .map((url) => {
        return `
          <option value=${url}>
            ${this.applets[url].name}
          </option>
        `;
      })
      .join('');
    this.appendChild(this.selectElem);
  }
}

customElements.define('applet-select', AppletSelect);
