import config from './config.js';

export default {
  type: config.database.type,
  sqlitePath: config.database.path,
  mongodbUri: config.database.mongodbUri
};
