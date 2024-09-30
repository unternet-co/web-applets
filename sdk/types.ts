export interface AppletManifest {
  type: 'applet';
  name: string;
  description: string;
  icon?: string;
  entrypoint: string;
  actions: AppletAction[];
}

export interface AppletAction {
  id: string;
  description: string;
  params?: { name: string; type: string; description: string }[];
}

export class AppletMessage {
  type: string;
  detail: unknown;
  timestamp: number;

  constructor(type, detail) {
    this.type = type;
    this.detail = detail;
    this.timestamp = Date.now();
  }
}
