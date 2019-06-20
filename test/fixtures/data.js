// IMPORTANT!
// Values are used by the test.js file, so be carefull to synchronize both files if updating data!!!

module.exports = {
	"_": {
		"version": "1.0.0",
		"namespace": "ch.imed.test.1.0.0",
		"initial": "dirty",
		"debug": false
	},
	// ----- STATES :
	"dirty": {
		"actions": {
			"edit": function() {},
			"undo": function() {},
			"redo": function() {}
		}
	},
	"saving": {
		"actions": {
			save: function(cb, doSuccess) {
				// simulate an asynchronous Ajax request : cb(err, data) will be called with an error depending on doSuccess (just for simulation)
				setTimeout(function(err, data) {
					cb(doSuccess ? null : 'some error', doSuccess ? 'some data' : null);
				}, 300);
			},
			me: function(me) {
				return me || this;
			}
		}
	},
	"saved": {
		"exit": function(eventObj, flag) {
			return flag !== false; /* calling fsm.trigger("edit", false) will cancel the transition */
		},
		"actions": {}
	},

	// ----- TRANSITIONS :
	"save": {
		"from": "dirty",
		"to": "saving",
		"guard": function(eventObj, flag) {
			return flag !== false;
		}
	},
	"success": {
		"from": "saving",
		"to": "saved",
		"before": function(e, flag) {
			return flag !== false; /* calling fsm.trigger("success", false) will cancel the transition */
		}
	},
	"failure": {
		"from": "saving",
		"to": "dirty"
	},
	"edit": {
		"from": "saved",
		"to": "dirty"
	}
};
