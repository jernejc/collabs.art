
const debug = false;

class Logger {

  log() {
    if (debug) {
      console.log(...arguments);
    }
  }

  error() {
    // report / handle error
    if (debug) {
      console.error(...arguments);
    }
  }

  warn() {
    if (debug) {
      console.warn(...arguments);
    }
  }
}

const logger = new Logger();

export default logger;