var express = require('express');
var router = express.Router();

var thermostat = require('../models/thermostat.js')

// // helpers for image urls, etc.
// function power_icon_url(hp) {
//   power = hp.power.toLowerCase()
//   return "/images/power_symbol_" + power + ".png"
// }
// 
// function mode_icon_url(hp) {
//   mode = hp.mode.toLowerCase()
//   power = hp.power.toLowerCase()
//   return "/images/" + mode + "_" + power + ".png"
// }

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
      title: 'Thermostat',
      heatpumps: thermostat.get_heatpump_states()
  });
});

module.exports = router;
