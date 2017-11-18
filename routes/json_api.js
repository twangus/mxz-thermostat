const util = require ('util')

var express = require('express');
var router = express.Router();

var thermostat = require('../models/thermostat.js')

/* GET data for all the heatpumps */
router.get('/heatpumps', function(req, res) {
  var heatpumps = thermostat.get_heatpump_states();
  res.json(heatpumps);
});

/* GET data for a single heatpump */
router.get('/heatpumps/:heatpump_id', function(req, res) {
  heatpump_id = req.params.heatpump_id
  var heatpump = thermostat.get_heatpump_state(heatpump_id);
  res.json(heatpump);
});

/* PUT data to update state for a single heatpump */
/* Only overwrites the values provided in the put request, */
/* so technically not pure REST */
router.put('/heatpumps/:heatpump_id', function(req, res) {
  heatpump_id = req.params.heatpump_id

  thermostat.update_heatpump(heatpump_id, req.body)  
  
  res.sendStatus(200);
});

module.exports = router;
