export interface AppletProjectConfig {
  input: {
    path: string;
    buildDir: string;
    buildCommand: string;
  };

  output: {
    path: string;
    baseUrl: '/';
    createRootManifest: boolean;
  };

  playground: {
    port: number;
  };
}

export interface DevOptions {
  port: string;
}
