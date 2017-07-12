'use strict';

const config = require('./../../config/index').get();
const Mailjet = require('node-mailjet').connect(
  config.mailjet.key,
  config.mailjet.secret
);

module.exports.sendMail = function(data) {
  return Mailjet.post('send').request(data);
}

