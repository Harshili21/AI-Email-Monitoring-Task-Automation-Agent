export class Logger {
  private static formatTime(date: Date) {
    return date.toISOString();
  }

  static info(message: string, context?: any) {
    console.log(`[${this.formatTime(new Date())}] [INFO] ${message}`, context ? JSON.stringify(context) : "");
  }

  static error(message: string, error?: any) {
    console.error(`[${this.formatTime(new Date())}] [ERROR] ${message}`, error ? error.message || error : "");
  }

  static warn(message: string, context?: any) {
    console.warn(`[${this.formatTime(new Date())}] [WARN] ${message}`, context ? JSON.stringify(context) : "");
  }
}
