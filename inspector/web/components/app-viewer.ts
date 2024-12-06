import './app-viewer.css';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { store } from '../lib/store';
import '@web-applets/sdk/dist/components/applet-frame';
import { AppletFrame } from '@web-applets/sdk/dist/components/applet-frame';
import './url-input.css';
import { Applet } from '@web-applets/sdk';

@customElement('app-viewer')
export class AppViewer extends LitElement {
  renderRoot = this;

  @property()
  appletUrl: string = '';

  connectedCallback() {
    store.subscribe((data) => {
      this.appletUrl = data.appletUrl;
    });
    super.connectedCallback();
  }

  updated() {
    const frame = document.querySelector('applet-frame') as AppletFrame;
    frame.onload = () => {
      store.update({ applet: frame.applet });
      window.applet = frame.applet;
    };
  }

  render() {
    return html`<applet-frame src=${this.appletUrl}></applet-frame>`;
  }
}

declare global {
  interface Window {
    applet: Applet;
  }
}
