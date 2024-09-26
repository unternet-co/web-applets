type CallbackFunction<T> = (obj: T) => void;

class Store<T> {
  name: string;
  callbacks: CallbackFunction<T>[];

  constructor(name: string) {
    this.name = name;
  }

  set() {}

  subscribe(callback: CallbackFunction<T>) {
    this.callbacks.push(callback);
  }
}
