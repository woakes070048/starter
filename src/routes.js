const configService = require('./services/config')
const urlHelper = require('./helpers/url');
const statusHelper = require('./helpers/status');
const config = require('./../config/index').get();
const redis_client = require('./../config/redis')
const Promise = require('bluebird')
const _ = require('lodash')
const emitter = require('./../config/emitter');
const Subscriber = require('./models/subscriber');
const slug = require('slug');
const db = require('./clients/db');
const Order = require('./models/order');

/**
 * list of all routes
 */
module.exports = function(app) {

  function isAuthenticated(req, res, next) {

    if (!req.user || !req.user.is_admin) {
      return res.redirect('/');
    }

    next();
  }


  app.get('/*', function(req, res, next) {
    res.locals.user = req.user;
    next();
  });

  app.get(['/', '/catalog'], function(req, res) {

    var page = parseInt(req.query.page, 10);
    var is_ajax = req.query.is_ajax || req.xhr;

    var sort = 'visits'

    var query = req.query.query;
    if (query && query.match('moebel.de')) {
      return res.redirect('/item/' + query);
    }

    //console.log(req.query.filters);
    var filters = JSON.parse(req.query.filters || '{}');

    var query_string = '(enabled:true OR _missing_:enabled)';

    if (req.query.query) {
      query_string = req.query.query + ' AND ' + query_string;
    }

    var query = {
      sort: sort,
      query_string: query_string,
      page: page,
      aggs: req.query.filters,
      per_page: 16
    }

    if (!req.user && (_.sum(_.map(filters, (val) => { return val.length })) > 1 || page > 1)) {
      if (is_ajax === true) {
        return res.status(401).json({
          message: 'Login is required'
        });
      }
      return res.redirect('/login');
    }

    return req.client.search(query)
    .then(function(result) {
      return res.render('basic/catalog', {
        items: result.data.items,
        pagination: result.pagination,
        query: req.query.query,
        page: page,
        sort: sort,
        is_ajax: is_ajax,
        url: req.url,
        aggregations: result.data.aggregations,
        sortings: result.data.sortings,
        filters: filters,
        //sortings: sortings
      });
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).json({
        message: 'unexpected error'
      });
    })
  })

  /**
   * for experimenting purposes now
   */
  app.get(['/landing2'], function(req, res) {

    var filters = JSON.parse(req.query.filters || '{}');
    var query = {
      sort: 'most_votes',
      query_string: 'enabled:true OR _missing_:enabled',
      page: 1,
      per_page: 12
    }

    var recent
    var popular

    var promises = []
    var per_page = 6

    promises.push(req.client.search({
      sort: 'created_at',
      query_string: 'enabled:true OR _missing_:enabled',
      page: 1,
      per_page: per_page
    }))

    promises.push(req.client.search({
      sort: 'year',
      query_string: 'enabled:true OR _missing_:enabled',
      page: 1,
      per_page: per_page
    }))

    Promise.all(promises)
    .spread(function(recent, year, comments, history, users) {
      console.log(recent);

      res.render('basic/landing2', {
        recent_items: recent.data.items,
        items2: year.data.items,
        aggregations: recent.data.aggregations,
        url: req.url
      })
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).render('pages/error');
    })
  })

  app.get(['/xxxinstallation'], function(req, res) {

    if (req.settings && !req.settings.is_installation) {
      return res.status(404).json({
        message: 'Not found'
      });
    }

    var url = config.elasticsearch.host

    return statusHelper.elasticsearch(url)
    .then(function(result) {

      result.data_url = process.env.DATA_URL || 'https://raw.githubusercontent.com/itemsapi/itemsapi-example-data/master/items/movies-processed.json';
      return res.render('installation/start', result);
    })
  })

  app.get('/api', function(req, res) {
    res.render('api');
  })

  /**
   * get item by id or permalink
   */
  app.get(['/popular/germany'], function(req, res) {

    var page = parseInt(req.query.page, 10);
    var is_ajax = req.query.is_ajax || req.xhr;

    var sort = 'visits'

    var query = req.query.query;
    if (query && query.match('moebel.de')) {
      return res.redirect('/item/' + query);
    }

    var query = {
      sort: sort,
      query_string: req.query.query,

      page: page,
      aggs: '{"ltd":["Poland"]}',
      per_page: 16
    }

    return req.client.search(query)
    .then(function(result) {
      return res.render('basic/top', {
        items: result.data.items
      });
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).json({
        message: 'unexpected error'
      });
    })
  });

  app.get(['/website/:domain'], function(req, res) {

    return db.first('*').from('domains')
    .where({
      domain: req.params.domain
    })
    .then(function(result) {

      if (!result || result.enabled === false) {
        return Promise.reject('Not found');
      }

      return res.render('basic/item', {
        row: result
      });
    })
    .catch(function(result) {
      console.log(result);
      return res.status(404).send('Sorry cant find that!');
    })
  })

  app.get(['/admin/website/:domain'], isAuthenticated, function(req, res) {

    if (!req.user || !req.user.is_admin) {
      return res.redirect('/');
    }

    return Promise.all([
      db.first('*').from('domains')
      .where({
        domain: req.params.domain
      }), req.client.getItemByKeyValue('domain', req.params.domain)
    ])
    .spread(function(row, item) {

      if (!row) {
        return Promise.reject('Not found');
      }

      return res.render('basic/admin_item', {
        row: row,
        item: item
      });
    })
    .catch(function(result) {
      console.log(result);
      return res.status(404).send('Sorry cant find that!');
    })
  })


  /**
   * items delete
   */
  app.all(['/admin/websites/delete/:domain'], isAuthenticated, function(req, res) {

    return db('domains')
    .where({
      domain: req.params.domain
    })
    .update({
      is_ecommerce_manual: false
    })
    .then(function(result) {

      return req.client.getItemByKeyValue('domain', req.params.domain)
      .then(function(result) {
        return req.client.partialUpdateItem(result.id, {
          enabled: false
        })
      })
    })
    .then(function(result) {
      return res.redirect('/admin/website/' + req.params.domain);
    })
  });

  app.post(['/order'], function(req, res) {

    //return res.status(200).json({})
    var order = new Order(_.merge(req.body, {
      email: req.user.email
    }));

    return order.save()
    .then(function(result) {
      return emitter.emitAsync('order.created', result);
    })
    .then(function(result) {
      console.log(result);
      return res.json({});
    })
    .catch(function(result) {
      return res.status(400).json({})
    })

  })

}
