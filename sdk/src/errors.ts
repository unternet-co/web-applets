export class AppletExecutionError extends Error {
  public code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this.name = 'AppletExecutionError';
  }
}

export class AppletConnectionError extends Error {
  public code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this.name = 'AppletConnectionError';
  }
}
