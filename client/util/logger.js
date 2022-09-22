
const debug = false;

class Logger {

  log() {
    if (debug) {
      console.log(...arguments);
    }
  }

  error() {
    // report / handle error
    console.error(...arguments);
  }

  warn() {
    console.warn(...arguments)
  }
}

const logger = new Logger();

export default logger;