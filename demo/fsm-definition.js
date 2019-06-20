module.exports = {
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
    	{from: 'yellow', to: 'red' },
		{
			from: 'none', to :'red',
			'do': function(eventObj, args){console.log('➰ =======> direct panic !', arguments);return true}
		}
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
				function(eventObj, args){console.log('➰ 2. clear-do de red à green', arguments);return true}	
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