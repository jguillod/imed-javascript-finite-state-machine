var Demo = (function(){
	
	return { 
		fsm: new FSM(data("default")),
		
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
					Demo.fsm.e[this.id](Math.random());
					// Demo.guiUpdate();
				});
				c.appendChild(btn)
			});
			
		},
			
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
				demo.className = Demo.fsm.current;
				// panic.disabled = Demo.fsm.cannot('panic');
			    // warn.disabled  = Demo.fsm.cannot('warn');
			    // calm.disabled  = Demo.fsm.cannot('calm');
			    // clear.disabled = Demo.fsm.cannot('clear');
			};
		})()
	}
})();

var async = function(to) {
  pending(to, 3);
  setTimeout(function() {
    pending(to, 2);
    setTimeout(function() {
      pending(to, 1);
      setTimeout(function() {
        Demo.fsm.transition(); // trigger deferred state transition
      }, 1000);
    }, 1000);
  }, 1000);
};

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
	Demo.fsm.on(/xxxx=do-clear-.*/, function(type, event, from, to){
		try{
			async(to);
			return StateMachine.ASYNC;
			
		}catch(e){
			
		}
			
	})
	Demo.controlCreate();
	Demo.controlUpdate();
	console.log('Available events:', Demo.fsm.availEvents());
	
	e = Demo.fsm.e;
	console.log('Use e[event](params...)', Demo.fsm.availEvents());
});



function data(i){
	switch (i) {
	case 1 :
		return {
			debug: true,
			version: '0.1', // the version of this definition or any other string, e.g. date
			initial: 'start',
			namespace: 'ch.imed.fsm.demo-test1',
			error:  function(msg, event, from, to, args, errorCode){
				return 'ERROR ('+errorCode+ ') ' + msg +' : on "' + event  + '" from "'+ from + '" to "'+ to+'"';
			},
	
			"red" : {
				exit: function(type, event, from, to, params){
					console.log('🚦 red-exit', arguments);
					return (params || confirm("Vraiment quitter le RED?"));
				},

				entry: function(){console.log('entry in red', arguments);}
			},
			'start': {
				guard: function(eventObj, args){console.log('🚷 start-guard', arguments); return true;},
				'do': function(eventObj, args){console.log('➰ start-do', arguments);},
				from: 'red',
				to: 'green'
			},
			stop: [{
				from: 'red',
				// to: is not define because this is an internal transition
				guard: function(eventObj, args){return args === true}
			},{
				from: 'yellow',
				to: 'red',
				'do': [
					function(eventObj, args){console.log('➰ 1. stop-do de yellow à red', arguments);return true},
					function(eventObj, args){console.log('➰ 2. stop-do de yellow à red', arguments);}	
				]
			},{
				from: 'green',
				to: 'red',
				guard: function(eventObj, args){
					console.log('🚷 guard stop from green to red');
					return ( args || confirm("Vraiment quitter le GREEN? (guard)"))}
		
			}],
			pause: {
				from: 'green',
				to: 'yellow',
				guard: function(event, from, to, confirme, yes){
					console.log('🚦 guard green to yellow : param1 == "confirm" && param2 = "yes"', arguments);
					return (confirme == 'confirm' && yes == 'yes') ? (confirm("Vraiment quitter le RED?")) : true;
				},
			}
		}
		
	case 2 :
		return {
		   "hungry" : {
		     entry: [ ],
		     exit:  [ ]
		   },
 
		  "satisfied" : {
		     guard: [  ],
		     from: "state1",
		     to:   "state2",
		     'do': [  ],
		     dont: [  ] // cant_action_listeners when the transition is guarded
		   },
	
 
		  "rest" : {
		     guard: [  ],
		     from: ['hungry', 'satisfied', 'full', 'sick'],
		     to:   "hungry",
		     'do': [  ],
		     dont: [  ] // when the transition is guarded
		   },
	
		   "eat": [{
		     from: 'hungry',
		     to: 'satisfied'
		     // etc.
		   },
			{
				from: 'satisfied',
				to: 'full'
			},
			{
				from: 'full',
				to: 'sick'
			}],
 
		 	 error:  function(eventName, from, to, args, errorCode, errorMessage){
				 return 'event ' + eventName  + ' was naughty :- ' + errorMessage;
			 }
		}
				
	default: // ORIGINAL DEMO
		return {
			debug: true,
			version: '0.1',
			initial: 'none',
			namespace: 'ch.imed.fsm.demo-test2',
			
			// STATES:
			red:{
				exit: function(eventObj, args){console.log('🚷 clear-exit-red-to-green', arguments); return Math.round(new Date()/1000)%2;}
			},
			
			// EVENTS:
		    start: {from: 'none',   to: 'green'  },
		    warn: {from: 'green',  to: 'yellow' },
		    panic: [
				{from: 'green',  to: 'red' },
		    	{from: 'yellow', to: 'red' }
			],
		    'calm': { 
				guard: function(eventObj, args){console.log('🚷 start-guard', arguments); return Math.round(new Date()/1000)%2 === 1;},
				from: 'red',
				to: 'yellow' 
			},
		    'clear': [
				{ 
					from: 'red',    
					to: 'green',
					'do': [
						function(eventObj, args){console.log('➰ 1. clear-do de red à green', arguments);return true},
						function(eventObj, args){console.log('➰ 2. clear-do de red à green', arguments);}	
					]
			  },
			    { from: 'yellow', to: 'green'  },
		    ],
			'internal (green)': {
				from: 'green',
				// to: undefined since it is an internal transition
			},
			'external-on-self (green)': {
				from: 'green',
				to: 'green'
			}
			
		}
	}
};