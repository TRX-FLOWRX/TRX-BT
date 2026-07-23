import pino from 'pino';
import path from 'path';
import fs from 'fs-extra';

const logsDir = path.resolve(process.cwd(), 'logs');
fs.ensureDirSync(logsDir);

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

export default logger;
