const emitter = require('./../../config/emitter');
const log = require('./../../config/logger');
const Promise = require('bluebird')
const mailjet = require('./../clients/mailjet');
const nunenv = require('./../clients/nunenv');

emitter.on('order.created', function(order) {
  log.info('order created successfully')
})

emitter.on('order.created', function(order) {

  const options = {
    'FromEmail': 'info@digestoo.com',
    'FromName': 'Digestoo',
    'Subject': 'Research market - inquiry',
    'Cc': 'info@digestoo.com',
    'Html-part': nunenv.render('emails/order.html.twig', {
      order: order
    }),
    'Recipients': [{
      'Email': 'mrzepa89@gmail.com'
    }]
  }

  //console.log(options);

  mailjet.sendMail(options)
  .then(res => {
    console.log(res);
    return res;
  })
})

