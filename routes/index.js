var express = require('express');
var router = express.Router();

var thermostat = require('../models/thermostat.js')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
      title: 'Thermostat',
      heatpumps: thermostat.heatpumps
  });
});

module.exports = router;
