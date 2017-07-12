var nunjucks = require('nunjucks');

var nunenv = new nunjucks.Environment(
  new nunjucks.FileSystemLoader('./views')
)

module.exports = nunenv;
