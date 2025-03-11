const isProduction = process.env.NODE_ENV === "production";

function log(location: string, ...messages: any[]) {
  if (!isProduction) {
    console.log(`[${location}]`, ...messages);
  }
}

export const debug = {
  log,
};
