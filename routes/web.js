var express = require('express');
var router = express.Router();

var thermostat = require('../models/thermostat.js')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
      title: 'Thermostat',
      heatpumps: thermostat.get_heatpump_states()
  });
});

/* GET HTML for just the heatpumps (for AJAX reloading, etc.) */
router.get('/heatpumps', function(req, res, next) {
  res.render('heatpumps', {
      heatpumps: thermostat.get_heatpump_states()
  });
});

/* GET HTML for a single heatpump (for AJAX reloading, etc.) */
router.get('/heatpumps/:heatpump_id', function(req, res, next) {
  heatpump_id = req.params.heatpump_id
  var heatpump = thermostat.get_heatpump_state(heatpump_id);
  res.render('heatpump', {
      heatpump: heatpump
  });
});

module.exports = router;
