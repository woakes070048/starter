'use strict';

var conf = {
  client: 'pg',
  migrations: {
    directory: './db/migrations',
    tableName: 'knex_migrations'
  },
  connection: process.env.DB_URL || 'postgres://andy:andy@localhost:5435/digestoo'
  /*connection: {
    host: 'localhost',
    port: '5435',
    database: 'digestoo',
    user: 'andy',
    password: 'andy'
  }*/
};

//'postgres://andy:@digestoo.cugicdbaa12d.eu-central-1.rds.amazonaws.com:5432/digestoo'

module.exports = conf;
