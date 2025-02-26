export class AppletExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppletExecutionError';
  }
}

export class AppletConnectionError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'AppletConnectionError';
  }
}
