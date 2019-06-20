var Demo = (function() {
	var data = {
		_: {
			debug: true,
			version: '0.1',
			initial: 'green',
			namespace: 'ch.imed.fsm.example.1',
		},

		// STATES:
		red: {
			exit: function(eventObj, args) {
				console.log('📤EXIT- clear-exit-red-to-green', arguments);
				return true;
			}, // i.e. 
			entry: function() {
				console.log('📥ENTRY-', arguments);
				return new Date();
				// throw new Error('erreur voulue à entry state red')
			},
			actions: {
				swap: function(a, b) {
					console.log('in "red" state : the "swap" action!');
					return [b, a];
				},
				alert: function(msg) {
					msg = msg || 'Hello!';
					if (window && window.alert) window.alert(msg);
					else console.log("ALERTE :", msg);
				}
			}
		},

		// EVENTS:
		// start: {from: 'none',   to: 'green'  },
		warn: {
			from: 'green',
			to: 'yellow'
		},
		panic: [{
			from: 'green',
			to: 'red',
			before: function(event, args) {
				console.log('>>>>>>>>>>>> BEFORE "panic" (%s) from "%s" to "%s"', event.event, event.from, event.to);
				return true;
			},
			options: "some options defined in 'panic' from 'green' to 'red'"
		}, {
			from: 'yellow',
			to: 'red',
			options: "some options defined in 'panic' from 'yellow' to 'red'"
		}, {
			from: 'red',
			/* to: 'red', */
			// only allow this transition if checkbox is checked
			guard: function(eventObj, args) {
				console.log('🚷 GUARD-red', arguments);
				return document.getElementById('allow-panic-on-red-state').checked;
			},
			options: {
				ts: new Date(),
				copyright: "Joël F",
				inside: "internal transition 'panic' from 'red'"
			}
		}],
		'calm': {
			from: 'red',
			to: 'yellow'
		},
		'clear': [{
			from: 'red',
			to: 'green',
			'do': [
				function(eventObj, args) {
					console.log('♻️DO- 1. clear-do de red à green', arguments);
					return true;
				},
				function(eventObj, args) {
					console.log('♻️DO- 2. clear-do de red à green', arguments);
				}
			]
		}, {
			from: 'yellow',
			to: 'green',
			// only allow this transition if checkbox is checked
			guard: function(eventObj, args) {
				console.log('🚷GUARD-', arguments);
				return document.getElementById('allow-clear-on-yellow-state').checked;
			}
		}, ],
		'internal (green)': {
			from: 'green',
			// to: undefined since it is an internal transition
			'do': function() {
				// just a long computation
				var future = new Date(Date.now() + 2000); // 2000ms in the future
				do {} while (Date.now() < future);
				return true;
			}
		},

	};

	return {
		fsm: new FSM(data, function(fsm) {
			console.log('Machine ready (my callback after instanciation)', fsm, this);
			var el = document.querySelector('#do-debug');
			el.checked = fsm.debug;
			// <g id="<current>-state">
			el = document.querySelector('#svg-diagram #' + fsm.current() + '-state');
			if (el) {
				el.setAttribute("opacity", 1);
			}
		}),

		/**
		 * Create one button to trigger a named event,
		 */
		controlCreate: function() {
			function removeClass(el) {
				el.classList ? el.classList.remove('stopped') : (el.className = el.className.replace(/(?:^|\s)stopped(?!\S)/g, ''));
			}

			function addClass(el) {
				el.classList ? el.classList.add('stopped') : (el.className += ' stopped');
			}
			var c = document.getElementById('controls'),
				btnEls = Array.prototype.slice.call(c.querySelectorAll('button')), // Button[]
				btn,
				statusIconEl = document.getElementById('status-icon'),
				actionsEl = document.getElementById('actions');

			actionsEl.addEventListener('change', function(e) {
				var action = e.target /* actionsEl */ .selectedOptions[0].text,
					fn = Demo.fsm.actions[action];
				if (typeof fn === 'function') fn();
			});

			// remove all buttons inside controls
			btnEls.forEach(function(b) {
				c.removeChild(b);
			});
			btnEls = [];

			function disableAllButtons() {
				btnEls.forEach(function(b) {
					b.disabled = true;
				});
			}
			// add a button for each possible event of fsm:
			Object.getOwnPropertyNames(Demo.fsm.e).forEach(function(event) {
				// '<button id="start" onclick="Demo.fsm.e.start();Demo.guiUpdate();">start</button>'
				btn = document.createElement('button');
				btn.id = event;
				btn.innerText = event;
				btn.addEventListener('click', function() {
					setTimeout(addClass(statusIconEl), 10);
					disableAllButtons();
					Demo.fsm.e[this.id](new Date().toLocaleTimeString().split(' ')[0]);
					removeClass(statusIconEl);
					// Demo.guiUpdate();
				});
				c.appendChild(btn);
				btnEls.push(btn);
			});

		},

		/**
		 * Update the enable/disable attribute of each named event button.
		 */
		controlUpdate: function() {
			console.log('🚩controlUpdate()');
			var events = Demo.fsm.availEvents(),
				btns = Array.prototype.slice.call(document.querySelectorAll('#controls button'));
			btns.forEach(function(b) {
				b.disabled = (events.indexOf(b.id) == -1);
			});
			document.getElementById('state-name').textContent = Demo.fsm.current();
			var sel = document.getElementById('actions');
			while (sel.length > 0) {
				sel.remove(0);
			}
			var actions = Demo.fsm.availActions();
			option(0, 'Actions (' + actions.length + ')', true);
			sel.selectedIndex = 0;
			actions.forEach(function(nom, idx) {
				option(idx, nom, false);
			});

			function option(idx, nom, disabled) {
				var opt = document.createElement("option");
				opt.value = idx;
				opt.text = nom;
				opt.disabled = disabled;
				sel.add(opt);
			}

		},

		log: (function() {
			var count = 0,
				demo = document.getElementById('demo'),
				output = document.getElementById('output'),
				histori = document.getElementById('history');

			// 	      	  start = document.getElementById('start'),
			// 		      panic  = document.getElementById('panic'),
			// 		      warn   = document.getElementById('warn'),
			// 		      calm   = document.getElementById('calm'),
			// 		      clear  = document.getElementById('clear');

			return function(msg, separate) {
				// Get a reference to the first child
				var theFirstChild = histori.firstChild;
				if (separate) {
					count++;
					// Create a new element
					var newElement = document.createElement("div");
					// Insert the new element before the first child
					theFirstChild = histori.insertBefore(newElement, theFirstChild);
				}
				var data = count + ": " + msg + "\n" + (separate ? "\n" : "");
				var p = document.createElement("p");
				output.value = data + output.value;
				p.innerHTML = data;
				theFirstChild.appendChild(p);
				demo.className = Demo.fsm.current();
				// panic.disabled = Demo.fsm.cannot('panic');
				// warn.disabled  = Demo.fsm.cannot('warn');
				// calm.disabled  = Demo.fsm.cannot('calm');
				// clear.disabled = Demo.fsm.cannot('clear');
			};
		})()
	};
})();

var pending = function(to, n) {
	console.log("🚩PENDING STATE: " + to + " in ..." + n);
};


window.addEventListener('load', function() {
	Demo.fsm.on(/^before.*/, function(event, args) {
		// console.log('⚡ BEFORE-', event.event +' ⚡ from '+event.from+ ' with args('+Array.prototype.slice.call(arguments)+')', true);
		Demo.log('⚡ ' + event.event + ' ⚡ from ' + event.from + ' with args(' + Array.prototype.slice.call(arguments) + ')', true);
		return true;
	});
	Demo.fsm.on(/^after.*/, function(event, args) {
		console.log('🚩AFTER-', arguments);
		Demo.controlUpdate();
		return true;
	});
	Demo.fsm.on(/.*/, function(event, args) {
		console.log('🚩ANY event (*) <%s> args=%o', event.step, arguments);
		if (event.step == 'entry') Demo.log(event.step + ' ⸬ ⟶ ' + event.event);
		else if (event.step == 'exit') Demo.log(event.step + ' ⸬ ' + event.event + ' ⟶');
		else Demo.log(event.step + ' ⸬ ' + event.event + (event.to !== undefined ? ' from ' + event.from + ' to ' + event.to : ''));
		return true;
	});

	// Update SVG diagram visual effects:
	var svg = document.getElementById('svg-diagram');
	var blinker = function(el, final, initial) {
		var count = 1;
		setInterval(function() {
			if (count-- <= 0) return;
			el.setAttribute("opacity", initial);
			setTimeout(function() {
				el.setAttribute("opacity", final);
			}, 250);
		}, 400);
	};

	function getTransitionElement(event, state) {
		var el;
		try {
			el = svg.querySelector('#' + event + '-event-from-' + state + '-state');
		} catch (e) {}
		return el;
	}

	function getStateElement(state) {
		var el;
		try {
			el = svg.querySelector('#' + state + '-state');
		} catch (e) {}
		return el;
	}
	Demo.fsm.on(/before.*/, function(event, arg1) {
		// before-<event>-<from>-<to>
		// <g id="panic-event-from-red-state">...</g>
		console.log('🚩', arguments);
		var el = getTransitionElement(event.event, event.from);
		if (el) {
			el.setAttribute("opacity", "1"); // blinker(el, 0.5, 1);
			el.setAttribute("stroke", "blue");
			el.setAttribute("stroke-width", "2");
			el.setAttribute("stroke-dasharray", "5, 5");
		}
		return true;
	});

	Demo.fsm.on(/after.*/, function(event, arg1) {
		var el = getTransitionElement(event.event, event.from);
		if (el) {
			blinker(el, 0.5, 1);
			setTimeout(function() {
				el.setAttribute("stroke-width", "1");
				el.setAttribute("stroke", "gray");
				el.removeAttribute("stroke-dasharray");
			}, 2000);
		}
		return true;
	});
	Demo.fsm.on(/exit.*/, function(event, arg1) {
		// <g id="green-state">
		// console.log('!!!!! exit()', arguments);
		var el = getStateElement(event.state);
		if (el) {
			blinker(el, 0.5, 1);
		}
		return true;
	}, "option dans machine listener avec regexp 'exit.*'", new Date());
	Demo.fsm.on(/entry.*/, function(event, arg1) {
		// <g id="green-state">
		// console.log('!!!!! entry()', arguments);
		var el = getStateElement(event.state);
		if (el) {
			blinker(el, 1, 0.5);
		}
		return true;
	});

	// Event button controler:
	Demo.controlCreate();
	Demo.controlUpdate();
	console.log('Available events:', Demo.fsm.availEvents());

	e = Demo.fsm.e;
	console.log('To trigger a transition, use Demo.fsm.e[event](params...)', Demo.fsm.availEvents());

	var el = document.getElementById('do-debug');
	if (el) {
		el.addEventListener('click', function(e) {
			Demo.fsm.debug = el.checked;
		});
	}
});
