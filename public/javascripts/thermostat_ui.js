$(document).ready(function() {
	
	// Hide the mode and target selectors - those will pop-up when needed
  $(".mode_select").hide()
  $(".target_select").hide()
  
  // Set a recurring timeout to refresh the data every 10 seconds 
  setTimeout(function() {
    refresh_loop();
  }, 10000);
  
  
  // Click the power icon to toggle HeatPump power on/off
  $(".hp_power").click(toggle_power);
  
  // Click the mode icon to show the mode selector
  $(".hp_mode").click(invoke_mode_selector);
  
  // Click a button in the mode selector to select a new mode
  $(".mode_button").click(set_new_mode_from_selector);
 
  // Set up the target selection slider
 	set_up_target_sliders()

  // Click the target temp to show the target selector
  $(".hp_target_temp").click(invoke_target_selector);

  // Click the "ok" button in the target selector to submit the new target temp
  $(".hp_new_target_temp").click(function () {
	  heatpump_id = $(this).closest(".heatpump").attr("id")
	  finalize_new_target_selection(heatpump_id) 
	});
}); 

// Invoked by a timeout, then sets another for a recurring refresh loop
function refresh_loop() {
	reload_data()
	
	setTimeout(function() {
		refresh_loop();
	}, 10000);
}

// Gets updated data for all heatpumps, then updates their UIs          
function reload_data() {
	$.getJSON("/api/heatpumps")
	.done(function( heatpumps) {
		$.each(heatpumps, function(index, heatpump) {
			update_heatpump_ui(heatpump)
		});
	})
	.fail(function() {
		console.log( "Error calling /api/heatpumps..." );
	})
}

// Reload the data for a single heatpump
function reload_heatpump(heatpump_id) {
	$.getJSON("/api/heatpumps/" + heatpump_id)
	.done(function( heatpump) {
		console.log(heatpump)
		update_heatpump_ui(heatpump)
	})
	.fail(function() {
		console.log( "Error calling /api/heatpumps..." );
	})
}

// Update the UI for a single heat-pump
// Everything is set with HTML5 data variables and displayed with CSS content generators
function update_heatpump_ui(heatpump) {
	console.log("updating UI for heatpump: " + heatpump.name)
	heatpump_id = heatpump.id
	$("#" + heatpump_id).attr("data-power", heatpump.power)
	$("#" + heatpump_id).attr("data-mode", heatpump.mode)
	$("#" + heatpump_id + " .hp_room_temp").attr("data-room-temp", heatpump.room_temp)
	$("#" + heatpump_id + " .hp_target_temp").attr("data-target-temp", heatpump.target_temp)
}

// Update the settings for a heatpump using an API call
// Data is a json object with  the properties to update - e.g., {"power":"ON}
function put_data_for_heatpump(data, heatpump_id) {
	// First PUT the new state via the API, then reload
	$.ajax({
			url: "/api/heatpumps/" + heatpump_id,
			method: 'PUT',
			data: data,
			success: function(result) {
				
				// Then reload the data for that heatpump
				console.log("Successful PUT")
				reload_heatpump(heatpump_id)
			}
	});
}      

// ***************** POWER ***************** //

// Toggle the power on/off - can be invoked by any dom element within the ".heatpump" div
function toggle_power() {
	heatpump_div = $(this).closest(".heatpump")
	heatpump_id = heatpump_div.attr("id")
	current_power = heatpump_div.attr("data-power")
	console.log ("current power: " + current_power)
	new_power = (current_power == "ON") ? "OFF" : "ON"
	console.log ("new power: " + new_power)

	put_data_for_heatpump({"power": new_power}, heatpump_id)
}

// ***************** MODE ***************** //

function invoke_mode_selector() {
	heatpump_id = $(this).closest(".heatpump").attr("id")
	$(this).hide(); // Hide the mode button that invoked the selector
	$("#" + heatpump_id + " .mode_select").fadeIn()
}

// Set the mode -- invoked from buttons on the mode selector pop-up
// "id" of div invoking this function needs to be the new mode
function set_new_mode_from_selector() {
	heatpump_div = $(this).closest(".heatpump")
	heatpump_id = heatpump_div.attr("id")
	
	// Get the current and new modes
	current_mode = heatpump_div.attr("data-mode")
	new_mode = $(this).attr("id")
	
	// Update if the mode has changed
	if (new_mode != current_mode) {
		put_data_for_heatpump({"mode": new_mode}, heatpump_id)
	}
	
	// Hide the mode selector and show the mode button again
	$(this).closest(".mode_select").hide()
	$("#" + heatpump_id + " .hp_mode").fadeIn()
}

// ***************** TARGET TEMP ***************** //

var target_temp_timeout;

var target_sliders = document.getElementsByClassName('target_slider');

function set_up_target_sliders() {	
	for ( var i = 0; i < target_sliders.length; i++ ) {
		noUiSlider.create(target_sliders[i], {
			start: 70,
			range: {
				'min': 65,
				'max' : 75
			},
			format: wNumb({decimals: 0}),
			step: 1,
			pips: {
				mode: 'values',
				values: [65, 70, 75],
				density: 10
			}
		})
		target_sliders[i].noUiSlider.on('slide', update_target_selector_temp);
		target_sliders[i].noUiSlider.on('change', function () {
			target_slider = target_slider_for_noUiSlider(this)
			
			// get the heatpump_id corresponding to the slider that changed
			heatpump_div = target_slider.closest(".heatpump")
			heatpump_id = heatpump_div.id
			
			target_temp_timeout = setTimeout(finalize_new_target_selection, 1000, heatpump_id);
		});
	}
}

function invoke_target_selector() {
	console.log("Invoking target selector...")
	
	// Get the heatpump_id and current target temperature
	heatpump_id = $(this).closest(".heatpump").attr("id")
	target_temp_div = $("#" + heatpump_id + " .hp_target_temp")
	target_temp = target_temp_div.attr("data-target-temp")
	
	// Initialize the new_target_temp display with the current target
	new_target_temp_div = $("#" + heatpump_id + " .hp_new_target_temp")
	new_target_temp_div.attr("data-new-target-temp", target_temp)
	
	// Replace the target temp display (that shows the actual target)
	// with the new_target_temp displaye (that shows what will be set)
	target_temp_div.hide();
	new_target_temp_div.show();
	
	// Find the appropriate and initialize to the current target
	target_slider = $("#" + heatpump_id + " .target_slider")
	target_slider_dom = target_slider[0]
	target_slider_dom.noUiSlider.set(target_temp)
	
	// show the initialized target selector
	$("#" + heatpump_id + " .target_select").fadeIn()
}

// Find the slider that was actually updated.  This seems like a ridiculous way to do it,
// but I can't figure out any nicer way to get the DOM element that generated an event
function target_slider_for_noUiSlider(noUiSlider_to_find) {
	var i = 0
	while (target_sliders[i].noUiSlider != noUiSlider_to_find) {
		i++;
	}
	if (i < target_sliders.length) {
		return target_sliders[i]
	} else {
		console.log("error finding slider DOM element for noUiSlider object")
		return undefined
	}
}

function update_target_selector_temp() {
	// Clear any timeouts from previous drags
	clearTimeout(target_temp_timeout)

	target_slider = target_slider_for_noUiSlider(this)

	// get the heatpump_id corresponding to the slider that moved
	heatpump_div = target_slider.closest(".heatpump")
	heatpump_id = heatpump_div.id
	
	// Get the new target temp from the slider
	new_target_temp = target_slider.noUiSlider.get()
	
	// Update the display to show the new target temp
	new_target_temp_div = $("#" + heatpump_id + " .hp_new_target_temp")
	new_target_temp_div.attr("data-new-target-temp", new_target_temp)
}

function finalize_new_target_selection(heatpump_id) {
	// Clear any remaining timeouts from other interactions
	clearTimeout(target_temp_timeout)
	
	// get the divs for target temp and new target temp
	target_temp_div = $("#" + heatpump_id + " .hp_target_temp")
	new_target_temp_div = $("#" + heatpump_id + " .hp_new_target_temp")
	
	// get the new target temperature and update the data attribute for the target_temp_div
	old_target_temp = target_temp_div.attr("data-target-temp")
	new_target_temp = new_target_temp_div.attr("data-new-target-temp")
	
	if (new_target_temp != old_target_temp) {
		 target_temp_div.attr("data-target-temp", new_target_temp) // probably not strictly necessary
		 put_data_for_heatpump({"target_temp": new_target_temp}, heatpump_id)
	}
	
	// Replace the new target temp display (that shows what was selected)
	// with the newly updated target temp display (that shows the actual temperature in the model)
	new_target_temp_div.hide();
	target_temp_div.show();
	
	// hide the target temp selector
	$("#" + heatpump_id + " .target_select").fadeOut()
}