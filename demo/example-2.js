var Demo = (function() {
	var data = {
		"_": {
			"version": "1.0.0",
			"namespace": "ch.imed.test.1.0.0",
			"initial": "dirty"
		},
		"dirty": {
			"actions": {}
		},
		"saving": {
			"actions": {}
		},
		"saved": {
			"actions": {}
		},
		"save": {
			"from": "dirty",
			"to": "saving"
		},
		"success": {
			"from": "saving",
			"to": "saved"
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

	return {
		fsm: new FSM(data, function(fsm) {
			console.log('Machine ready (my callback after instanciation)', fsm, this);
			var el = document.querySelector('#do-debug');
			el.checked = fsm._debug;
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
