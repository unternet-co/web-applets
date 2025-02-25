export function dispatchEventAndHandler(event: Event) {
  if (typeof this[`on${event.type}`] === 'function') {
    this[`on${event.type}`](event);
  }
  this.dispatchEvent(event);
}
