export interface AppletManifest {
  name: string;
  description: string;
  icon: string;
  initState: Record<string, unknown>;
  actions: AppletAction[];
}

export interface AppletAction {
  id: string;
  description: string;
  params?: { name: string; type: string; description: string }[];
}
