const i18n = require('i18n');

i18n.configure({
  locales: ['en'],
  //cookie: 'language',
  updateFiles: false,
  objectNotation: true,
  directory: __dirname + '/../../locales'
});

module.exports = i18n
