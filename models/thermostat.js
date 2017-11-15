var mqtt = require('mqtt')

// Initialize the heatpumps

heatpumps = []

function addHeatPump (name, id) {
	heatpumps.push({
		name: name, 
		id: id,
		get topic() { return "hp/" + id },
		get status_topic() { return "hp/" + id + "/status" },
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

// Helpers

function cToF (tempC) {
	return tempC * (9/5) + 32
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
		 	heatpump.target_temp = Math.round(cToF(new_state.temperature))
	 	}
	 	
	 	if (topic == heatpump.status_topic) {
	 		status = JSON.parse(message)
	 		heatpump.room_temp = Math.round(cToF(status.roomTemperature))
	 	 }
	}) 
})

module.exports.heatpumps = heatpumps;