const util = require ('util')

var express = require('express');
var router = express.Router();

var thermostat = require('../models/thermostat.js')

/* GET data for all the heatpumps */
router.get('/heatpumps', function(req, res) {
  res.json({ message : "not implemented"});
});

/* GET data for a single heatpump */
router.get('/heatpumps/:heatpump_id', function(req, res) {
  heatpump_id = req.params.heatpump_id
  console.log("API GET request for heatpump with id: " + heatpump_id)
  var heatpump = thermostat.get_heatpump_state(heatpump_id);
  console.log(heatpump);
  res.json(heatpump);
});

/* PUT data to update state for a single heatpump */
/* Only overwrites the values provided in the put request, */
/* so technically not pure REST */
router.put('/heatpumps/:heatpump_id', function(req, res) {
  heatpump_id = req.params.heatpump_id

  console.log("API PUT request for heatpump with id: " + heatpump_id)

  thermostat.update_heatpump(heatpump_id, req.body)  
});

module.exports = router;
