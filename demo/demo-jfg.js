var Demo = (function(){
	
	return { 
		fsm: new FSM(data(3)),
		
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
					Demo.fsm.e[this.id]();
					Demo.guiUpdate();
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
				output = document.getElementById('output');
		  	// 	      	  start = document.getElementById('start'),
		  	// 		      panic  = document.getElementById('panic'),
		  	// 		      warn   = document.getElementById('warn'),
		  	// 		      calm   = document.getElementById('calm'),
		  	// 		      clear  = document.getElementById('clear');
		
			return function(msg, separate) {
			    count = count + (separate ? 1 : 0);
			    output.value = count + ": " + msg + "\n" + (separate ? "\n" : "") + output.value;
				demo.className = Demo.fsm.current;
				// panic.disabled = Demo.fsm.cannot('panic');
			    // warn.disabled  = Demo.fsm.cannot('warn');
			    // calm.disabled  = Demo.fsm.cannot('calm');
			    // clear.disabled = Demo.fsm.cannot('clear');
			};
		})()
	}
})();


window.addEventListener('load', function(){
	Demo.fsm.on(/before.*/, function(type, event, f, t, a){
		Demo.log('⚡ '+ event+' ⚡ from '+f+ ' with args('+Array.prototype.slice.call(arguments,4)+')', true);
		 return true;
 	});
	Demo.fsm.on(/after.*/, function(type, event){
		console.log('XXX-AFTER', type, arguments);
		Demo.controlUpdate();
		return true;
	});
	Demo.fsm.on(/.*/, function(type, event, from, to){
		console.log('XXX-ANY', type, arguments);
		if(type == 'entry') Demo.log(type + ' ⸬ ⟶ ' + event);
		else if(type == 'exit') Demo.log(type + ' ⸬ ' + event + ' ⟶');
		else Demo.log(type + ' ⸬ ' + event + ' from ' + from + ' to ' + to);
		return true;
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
			initial: 'green',
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
				guard: function(ty, e, f, t, p){console.log('🚷 %s start-guard', arguments); return true;},
				'do': function(ty, e, f, t, p){console.log('start-do', arguments);},
				from: 'red',
				to: 'green'
			},
			stop: [{
				from: 'red',
				// to: is not define because this is an internal transition
				guard: function(ty, e, f, t, p){return p === true}
			},{
				from: 'yellow',
				to: 'red',
				'do': [
					function(ty, e, f, t, p){console.log('1. stop-do de yellow à red', arguments);return true},
					function(ty, e, f, t, p){console.log('2. stop-do de yellow à red', arguments);}	
				]
			},{
				from: 'green',
				to: 'red',
				guard: function(ty, e, f, t, p){
					console.log('🚷 guard stop from green to red');
					return ( p || confirm("Vraiment quitter le GREEN? (guard)"))}
		
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
		
	default:
		return {
			debug: true,
			version: '0.1',
			initial: 'green',
			namespace: 'ch.imed.fsm.demo-test2',
			
		    start: {from: 'none',   to: 'green'  },
		    warn: {from: 'green',  to: 'yellow' },
		    panic: [
				{from: 'green',  to: 'red' },
		    	{from: 'yellow', to: 'red' }
			],
		    'calm': { from: 'red',    to: 'yellow' },
		    'clear': [
				{ from: 'red',    to: 'green'  },
			    { from: 'yellow', to: 'green'  },
		    ],
			
		}
	}
};