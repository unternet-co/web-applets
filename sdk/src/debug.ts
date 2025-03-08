function log(location: string, ...messages: any[]) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[${location}]`, ...messages);
  }
}

export const debug = {
  log,
};
