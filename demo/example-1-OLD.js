var Demo = (function(){
	var data = {
		debug: false,
		version: '0.1',
		initial: 'green',
		namespace: 'ch.imed.fsm.example.1',

		// STATES:
		red:{
			exit: function(ty, e, f, t, p){console.log('🚷 clear-exit-red-to-green', arguments); return true;}// i.e. 
			,entry: function(){throw new Error('erreur voulue à entry state red')}
		},

		// EVENTS:
	    // start: {from: 'none',   to: 'green'  },
	    warn: {from: 'green',  to: 'yellow'},
	    panic: [
			{from: 'green',  	to: 'red' },
	    	{from: 'yellow', 	to: 'red' },
			{from: 'red',		to: 'red',
				// only allow this external transition if checkbox is checked
				guard: function(ty, e, f, t, p){console.log('🚷 start-guard', arguments); return document.getElementById('allow-panic-on-red-state').checked}
			}
		],
	    'calm': { 
			from: 'red',
			to: 'yellow' 
		},
	    'clear': [
			{ 
				from: 'red',    
				to: 'green',
				'do': [
					function(ty, e, f, t, p){console.log('➰ 1. clear-do de red à green', arguments);return true},
					function(ty, e, f, t, p){console.log('➰ 2. clear-do de red à green', arguments);}	
				]
		  },
		    {
				from: 'yellow',
				to: 'green',
				// only allow this transition if checkbox is checked
				guard: function(ty, e, f, t, p){console.log('🚷 start-guard', arguments); return document.getElementById('allow-clear-on-yellow-state').checked}
			},
	    ],
		'internal (green)': {
			from: 'green',
			// to: undefined since it is an internal transition
		},

	};
	
	return { 
		fsm: new FSM(data, function(fsm){
			console.log('Machine ready', fsm);
			var el = document.getElementById('do-debug');
			el.checked = fsm.debug;
		}),
		
		/**
		 * Create one button to trigger a named event,
		 */
		controlCreate: function(){
			var c = document.getElementById('controls'),
				btn;
			// remove all buttons inside controls
			Array.prototype.slice.call(c.children).forEach(function(b){c.removeChild(b)});
			// add a button for each possible event of fsm:
			Object.getOwnPropertyNames(Demo.fsm.e).forEach(function(event){
				// '<button id="start" onclick="Demo.fsm.e.start();Demo.guiUpdate();">start</button>'
				btn = document.createElement('button');
				btn.id = event;
				btn.innerText = event;
				btn.addEventListener('click', function(){
					Demo.fsm.e[this.id](new Date().toLocaleTimeString().split(' ')[0]);
					// Demo.guiUpdate();
				});
				c.appendChild(btn)
			});
			
		},
		
		/**
		 * Update the enable/disable attribute of each named event button.
		 */
		controlUpdate: function(){
			console.log('controlUpdate()');
			var events = Demo.fsm.availEvents(),
				btns = Array.prototype.slice.call(document.querySelectorAll('#controls button'));
			btns.forEach(function(b){
				b.disabled = (events.indexOf(b.id) == -1);
			});
		},
		
		log: (function(){
			var  count  = 0,
				demo   = document.getElementById('demo'),
			    output = document.getElementById('output'),
			    histori = document.getElementById('history');
			
		  	// 	      	  start = document.getElementById('start'),
		  	// 		      panic  = document.getElementById('panic'),
		  	// 		      warn   = document.getElementById('warn'),
		  	// 		      calm   = document.getElementById('calm'),
		  	// 		      clear  = document.getElementById('clear');
		
			return function(msg, separate) {
				if(separate){
				    count++;
					// Get a reference to the first child
					var theFirstChild = histori.firstChild;
					// Create a new element
					var newElement = document.createElement("div");
					// Insert the new element before the first child
					theFirstChild = histori.insertBefore(newElement, theFirstChild);
				} else {
					theFirstChild = histori.firstChild;
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
	}
})();

var pending = function(to, n) { console.log("PENDING STATE: " + to + " in ..." + n); };


window.addEventListener('load', function(){
	Demo.fsm.on(/before.*/, function(type, event, f, t, a){
		Demo.log('⚡ '+ event+' ⚡ from '+f+ ' with args('+Array.prototype.slice.call(arguments,4)+')', true);
		 return true;
 	});
	Demo.fsm.on(/after.*/, function(type, event){
		console.log('AFTER event args =', arguments);
		Demo.controlUpdate();
		return true;
	});
	Demo.fsm.on(/.*/, function(type, event, from, to){
		console.log('ANY event (*) <%s> args=%o', type, arguments);
		if(type == 'entry') Demo.log(type + ' ⸬ ⟶ ' + event);
		else if(type == 'exit') Demo.log(type + ' ⸬ ' + event + ' ⟶');
		else Demo.log(type + ' ⸬ ' + event + ' from ' + from + ' to ' + to);
		return true;
	})

	// Update SVG diagram visual effects:
	var svg = document.getElementById('svg-diagram');
	var blinker = function(el, final, initial){
		var count = 3;
		setInterval(function() {
			if(count-- <= 0) return;
			el.setAttribute("opacity", initial);
	        setTimeout(function() {
				el.setAttribute("opacity", final);
	        }, 250);
		}, 400);
	}
	function getTransitionElement(event, state){
		var el;
		try{
			el = svg.querySelector('#' + event+ '-event-from-' + state + '-state');
		}catch(e){}
		return el;
	}
	function getStateElement(state){
		var el;
		try{
			el = svg.querySelector('#' + state + '-state');
		}catch(e){}
		return el;
	}
	Demo.fsm.on(/before.*/, function(type, event, from, to /*, arg1, ...*/){
		// before-<event>-<from>-<to>
		// <g id="panic-event-from-red-state">...</g>
		console.log('!!!', arguments);
		var el = getTransitionElement(event, from);
		if(el){
			el.setAttribute("opacity", "1"); // blinker(el, 0.5, 1);
			el.setAttribute("stroke", "blue");
		}
		return true;
	})
	Demo.fsm.on(/after.*/, function(type, event, from, to /*, arg1, ...*/){
		var el = getTransitionElement(event, from);
		if(el){
			blinker(el, 0.5, 1);
			setTimeout(function(){
				el.setAttribute("stroke", "gray");
			}, 2000);
		}
		return true;
	});
	Demo.fsm.on(/exit.*/, function(type, from /*, arg1, ...*/){
		// <g id="green-state">
		console.log('!!!!! entry()', arguments);
		var el = getStateElement(from);
		if(el){
			blinker(el, 0.5, 1);
		}
		return true;
	});
	Demo.fsm.on(/entry.*/, function(type, to /*, arg1, ...*/){
		// <g id="green-state">
		console.log('!!!!! entry()', arguments);
		var el = getStateElement(to);
		if(el){
			blinker(el, 1, 0.5);
		}
		return true;
	});
	
	// Event button controler:
	Demo.controlCreate();
	Demo.controlUpdate();
	console.log('Available events:', Demo.fsm.availEvents());
	
	e = Demo.fsm.e;
	console.log('Use e[event](params...)', Demo.fsm.availEvents());
	
	var el = document.getElementById('do-debug');
	if(el){
		el.addEventListener('click', function(e){
			Demo.fsm.debug = el.checked;
		});
	}
});


