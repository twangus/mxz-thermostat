const util = require ('util')

var mqtt = require('mqtt')

// Initialize the heatpumps

heatpumps = []

function addHeatPump (name, id) {
	heatpumps.push({
		name: name, 
		id: id,
		get topic() { return "hp/" + id },
		get status_topic() { return "hp/" + id + "/status" },
		get set_topic() { return "hp/" + id + "/set" },
		room_temp: 0,
		power: "OFF",
		mode: "AUTO",
		target_temp: 0
	})
}

addHeatPump("Nursery", "1")
addHeatPump("Sophie's Room", "2")
addHeatPump("Master", "3")
addHeatPump("Playroom", "4")

function heatpump_with_id(heatpump_id) {
	result = null
	heatpumps.forEach(function (heatpump) {
		if (heatpump.id === heatpump_id) { 
			result = heatpump;
		}
	})
	return result
}

// Helpers

// These are the same helpers used in the heatpump library, but the Mitsubishi remotes
// do weird, inaccurate temperature conversions.  So, for several temperature settings,
// the remote will actually set the heatpump to a Celcius setting more than one degree
// Fahrenheit off from what the user actually sets

function fToC (tempF) {
  tempC = (tempF - 32) * (5/9)
  tempC = Math.round(tempC * 2.0) / 2.0 // Round to the nearest 0.5 decimal place
  return tempC
}

function cToF (tempC) {
	tempF = tempC * (9/5) + 32
	return Math.round(tempF)
}

// Set up the MQTT client and subscribe to the relevant topics for each heat pump

var client  = mqtt.connect('mqtt://192.168.1.112/')

client.on('connect', function () {
    heatpumps.forEach(function (heatpump) {
        client.subscribe(heatpump.topic)
            console.log("Subscribed to topic: " + heatpump.topic)
            
            client.subscribe(heatpump.status_topic)
            console.log("Subscribed to topic: " + heatpump.status_topic)
    })
})

client.on('message', function (topic, message) {
  console.log(topic.toString() + " - " + message.toString())
 
    heatpumps.forEach(function (heatpump) {
        if (topic == heatpump.topic) {
            new_state = JSON.parse(message)
            heatpump.power = new_state.power
            heatpump.mode = new_state.mode
            heatpump.target_temp = cToF(new_state.temperature)
        }
        
        if (topic == heatpump.status_topic) {
            status = JSON.parse(message)
            heatpump.room_temp = cToF(status.roomTemperature)
         }
    }) 
})

function send_update_message(heatpump) {
    message = '{"power":"' + heatpump.power + '","mode":"' + heatpump.mode + '", "temperature":' + fToC(heatpump.target_temp) + '}'
    console.log("message: " + message)
    client.publish(heatpump.set_topic, message)
}

// API

// Return an array of the heatpump IDs
function get_heatpump_ids() {
	api_result = []

	heatpumps.forEach(function (heatpump) {
		api_result.push(heatpump.id)
	})

	return api_result
}

// Get the state of a specific heatpump
function get_heatpump_state(heatpump_id) {
	heatpump = heatpump_with_id(heatpump_id)
	return {
		id : heatpump.id,
		name: heatpump.name,
		room_temp : heatpump.room_temp,
		power : heatpump.power,
		mode : heatpump.mode,
		target_temp : heatpump.target_temp
	}
}

// Return an array with all of the heatpump states
function get_heatpump_states() {
	api_result = []
	
	heatpumps.forEach(function (heatpump) {
		api_result.push(get_heatpump_state(heatpump.id))
	})
	
	return api_result
}

// Update the state of a specific heatpump
function update_heatpump(heatpump_id, new_state) {
	heatpump = heatpump_with_id(heatpump_id);

	console.log("Updating state for heatpump with id: " + heatpump_id)
	console.log("Old state:" + util.inspect(heatpump));

	// Validate the parameters in the request and update accordingly
	for (var key in new_state) {
	  console.log(key + " -> " + new_state[key]);
	  switch (key) {

		// Set the power state - allowable options "ON" and "OFF"
		case 'power':
		  new_power_state = new_state['power']
		  if (['ON', 'OFF'].includes(new_power_state)) {
			heatpump.power = new_power_state
		  } else {
			console.log("Unsupported power state (" + new_power_state + ") in PUT request")
		  }
		  break;

		// Set the mode - allowable options "AUTO", "HEAT", "COOL"
		case 'mode':
		  new_mode = new_state['mode']
		  if (['AUTO', 'HEAT', 'COOL'].includes(new_mode)) {
		  	heatpump.mode = new_mode
		  } else {
		    console.log("Unsupported mode (" + new_mode + ") in PUT request")
		  }
		  break;

		// Set the target_temp - any value between 61 F (16 C) and 88 F (31 C)
		case 'target_temp':
		  new_target_temp = new_state['target_temp']
		  if (new_target_temp >= 61 && new_target_temp <= 88) {
			  heatpump.target_temp = new_target_temp
		  } else {
		  	console.log("Unsupported target temperature (" + new_target_temp + ") in PUT request");
		  }
		  break;
		  
		default:
		  console.log("Unsupported key (" + key + ") in PUT request")
	  }
	}

	console.log("New state:" + util.inspect(heatpump))
	
	// Send message to change the state on the heatpump
	send_update_message(heatpump)
}

// Export the API functions
module.exports.get_heatpump_ids = get_heatpump_ids 
module.exports.get_heatpump_state = get_heatpump_state
module.exports.get_heatpump_states = get_heatpump_states
module.exports.update_heatpump = update_heatpump
