// var DEBUG = DEBUG || true;
//-----------------------------------------------------------------------------------------------
/*
var FSM = require('./build/fsm.min.js'), fsm = new FSM(require('./test/fixtures/data.js'), function(){console.log('fsm ready')}), m = fsm.factory('saved', function(m){console.log('m ready', this === m)}), o = fsm.factory('saved', function(m){console.log('o ready')});

fsm.current()+': '+ fsm.reason + ' | ' + m.current() + ': '+m.reason +' | '+ o.current()+': '+o.reason
*/


/**
 * @license
 * The MIT License (MIT)
 *
 * Copyright (c) Joel F Guillod <joel.guillod@gmail.com> (www.imed.ch)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// TESTING in node =>
/* ===================
var FSM = require('./state-machine-jfg.js'), fsm = new FSM(require('./demo/fsm-definition.js'), console.log), fsm.trigger('panic', 'TROIS', 333);
fsm.on(/.+/, function(event, args){console.log('ANY event (*)', event, 'args=', Array.prototype.slice.call(arguments,1));return true});
====================== */

/* TO DO ??
- asynchronous fsm.trigger callbacks with promises => NO! 
- History management (maybe with undo-redo; cf. history pattern et ex de draw2d; év. https://github.com/AlexanderBrevig/CommandManager.js/blob/master/CommandManager.js)
*/


/* CF COMMENTAIRES JFG A LA FIN (OU CI-DESSUS?)

  Javascript State Machine Library - https://github.com/jakesgordon/javascript-state-machine

  Copyright (c) 2012, 2013 Jake Gordon and contributors
  Released under the MIT license - https://github.com/jakesgordon/javascript-state-machine/blob/master/LICENSE

*/


(function(definition) {
	"use strict";

	// This file will function properly as a <script> tag, or a module
	// using CommonJS and NodeJS or RequireJS module formats.  In
	// Common/Node/RequireJS, the module exports the Q API and when
	// executed as a simple <script>, it creates a Q global instead.

	// Montage Require
	if (typeof bootstrap === "function") {
		bootstrap("jsfsm", definition);

		// CommonJS
	} else if (typeof exports === "object" && typeof module === "object") {
		module.exports = definition();

		// RequireJS
	} else if (typeof define === "function" && define.amd) {
		define(definition);

		// SES (Secure EcmaScript)
	} else if (typeof ses !== "undefined") {
		if (!ses.ok()) {
			return;
		} else {
			ses.makeQ = definition;
		}

		// <script>
	} else if (typeof self !== "undefined") {
		self.FSM = definition();

	} else {
		throw ("This environment was not anticipated by imed-javascript-finite-state-machine. Please file a bug.");
	}

})(function( /* fsm */ ) {

	"use strict";

	//---------------------------------------------------------------------------

	var ENGINE = "JFG's FSM engine v 0.8.1 Tue Feb 16 2016 13:02:36 GMT+0100 (CET)";

	//---------------------------------------------------------------------------

	var METAPROPERTYNAME = '_';

	/**
	 * This callback is called after completed FSM instanciation.
	 * @callback FSM~onCreated
	 * @param {FSM} fsm - The FSM instance. Note that the `this` inside the function is also the FSM instance.
	 */
	/**
	 * Instanciate a finite state machine.
	 * @class FSM
	 * @param {Object} config - The data definition machine.
	 * @param {Object} [config._]  All properties of _ are copied to `this._private` but usually you will have the following metadata:
	 * @param {string} [config._.version] - Your version of this machine.
	 * @param {string} [config._.namespace] - Your namespace of the definition.
	 * @param {string} [config._.initial="none"] - The initial state name of the machine. This set the current state of this machine on instanciation.
	 * @param {boolean} config._.justListen=true - Set it to `false` if you need that listeners registred with {@link FSM#on} should behave like configuration handlers (before, guard, exit, do, dont, entry, after). See explanation on rules and `justListen` in Home doc or README file.
	 * @param {boolean} [config._.debug=false] - Display verbose messages in console if `true`.
	 * @param {Object} config."state" - The property name is the name of a state (a string identifier). It is any other configs property containing one or both of `entry` or `exit` properties.
	 * @param {FSM~listener|Array} [config."state".entry] - The entry `function(eventObj, arg...)` or array of.
	 * @param {FSM~listener|Array} [config."state".exit] - The exit `function(eventObj, arg...)` or array of.
	 * @param {Object} [config."state".actions] - An object containing the actions for this state (e.b. actions:{ flip: function(a, b){...} }).
	 * @param {Array|Object} config."event" - The property name is the name of an event (a string identifier) of a trigger event (its name). It is any other configs properties whose value is either an array of Transitions Object or a single Transition Object. Transition Object can contain the following set of properties :
	 * @param {string} config."event".from - The mandatory source state name (string), i.e. the one which was exited on successfully completed transition.
	 * @param {string} [config."event".to]  The target state name, i.e. the one which was entered and became the new current state on successfully completed transition. Omit this property (i.e. `undefined`) to define an **internal transition**.
	 * @param {FSM~listener|Array} config."event".before - A [array of] `function(eventObj, arg...)` to be executed before the transition. If one does not return true the transition is cancelled.
	 * @param {FSM~listener|Array} config."event".after - A [array of] `function(eventObj, arg...)` executed at the end of the trigger (even if guard failed or error occurred).
	 * @param {FSM~listener|Array} config."event".guard - A [array of] `function(eventObj, arg...)` if one does not return true, the transition does not occur.
	 * @param {FSM~listener|Array} config."event".do - A [array of] `function(eventObj, arg...)` executed after guard succeed.
	 * @param {FSM~listener|Array} config."event".dont - A [array of] `function(eventObj, arg...)` executed after a guard does not return true.
	 * @param {Object} [config."event".options] - An optional object to pass in `eventObj.options` when calling {@link FSM~listener} of each before, after, guard, do and dont of this transition. This options is not passed to the machine events listeners.
	 * @param {FSM~onCreated} [callback] - An optional function to be called when machine is ready.
	 * @throws "Unknown initial state name".
	 * @example
	 * var config = {
	 *     _: {
	 *         debug: true,
	 *         version: '0.1',
	 *         initial: 'none',
	 *         namespace: 'ch.imed.fsm.demo-test2'
	 *     },
	 * 
	 *     // STATES:
	 *     red: {
	 *         exit: function(eventObj, args) {
	 *             console.log('🚷 clear-exit-red-to-green', arguments);
	 *             return Math.round(new Date() / 1000) % 2;
	 *         },
	 *         actions: {
	 *             hello: function(msg) {
	 *                 alert("Hello from machine action!")
	 *             }
	 *         }
	 *     },
	 * 
	 *     // EVENTS:
	 *     start: {
	 *         from: 'none',
	 *         to: 'green'
	 *     },
	 *     warn: {
	 *         from: 'green',
	 *         to: 'yellow'
	 *     },
	 *     panic: [{
	 *         from: 'green',
	 *         to: 'red'
	 *     }, {
	 *         from: 'yellow',
	 *         to: 'red'
	 *     }, {
	 *         from: 'none',
	 *         to: 'red',
	 *         do: function(eventObj, args) {
	 *             console.log('➰ =======> direct panic !', arguments);
	 *             return true
	 *         }
	 *     }],
	 *     calm: {
	 *         guard: function(eventObj, args) {
	 *             console.log('🚷 start-guard', arguments);
	 *             return Math.round(new Date() / 1000) % 2 === 1;
	 *         },
	 *         from: 'red',
	 *         to: 'yellow'
	 *     },
	 *     clear: [{
	 *         from: 'red',
	 *         to: 'green',
	 *         do: [
	 *             function(eventObj, args) {
	 *                 console.log('➰ 1. clear-do de red à green', arguments);
	 *                 return true
	 *             },
	 *             function(eventObj, args) {
	 *                 console.log('➰ 2. clear-do de red à green', arguments);
	 *                 return true
	 *             }
	 *         ]
	 *     }, {
	 *         from: 'yellow',
	 *         to: 'green'
	 *     }],
	 *     'internal (green)': {
	 *         from: 'green',
	 *         // to: undefined => it is an internal transition
	 *     },
	 *     'external-on-self (green)': {
	 *         from: 'green',
	 *         to: 'green'
	 *     }
	 * };
	 * var fsm = new FSM(config, function(machine) {
	 *     console.log("The machine is ready on state", machine.current());
	 * });
	 */
	var create = function(cfg, callback) {
		var me = this;
		var transitions = this._transitions = {}; // the transition definition
		var states = this._states = {}; // the states definition
		var fromStates = this._fromStates = {}; // the from state: events compilation
		var meta = cfg[METAPROPERTYNAME];
		var _ = this._private = Object.assign({
			initial: 'none' // current state
		}, meta);

		if (DEBUG) {
			this.debug = !!_.debug;
		} else {
			this.debug = false;
		}
		_.justListen = _.justListen !== false; // default is true

		// event and state properties:
		this._listeners = [];
		// this._listeners = {};
		// this._listeners._regexp = [],
		this.e = {}; // direct event function(params)

		/**
		 * Return the original machine instanciated with the config. This allow to test if an instance was created with a factory or as an original:
		 * - `fsm.original() === fsm`					// => fsm is an original, i.e. made with new FSM()
		 * - `fsm.factory(state).original() === fsm`	// the factory made one has the `fsm`as origine.
		 * @function FSM#original
		 * @return {boolean} The original machine.
		 */
		this.original = function() {
			return me;
		};
		Object.freeze(this.original);

		var item,
			from;

		Object.getOwnPropertyNames(cfg).forEach(function(key) {
			item = cfg[key];
			if (key != METAPROPERTYNAME) {
				if (item.entry || item.exit || item.actions) {
					// STATE => this._states[key] = item;
					// ---------------------------------
					states[key] = item;
					if (item.exit && !(item.exit instanceof Array)) item.exit = [item.exit];
					if (item.entry && !(item.entry instanceof Array)) item.entry = [item.entry];
					if (!item.hasOwnProperty("actions")) item.actions = {};
				} else {
					// TRANSITION => this._transitions[key] = item;
					// ---------------------------------
					transitions[key] = (item instanceof Array) ? item : [item];
					if (!this.e[key]) {
						/**
						 * Alias for {@link FSM#trigger}.
						 * @function FSM#e[event]
						 * @returns {boolean}
						 * - `true` if the transition succeed.
						 * - `false` if the transition failed. Then the `fsm.reason` contains the error description.
						 */
						this.e[key] = buildEAlias(this, key);
					}
				}
			}
		}, this);
		// compile the fromStates = {from: {event: object, ...}, ... }
		Object.getOwnPropertyNames(transitions).forEach(function(key) {
			transitions[key].forEach(function(transition) {
				if (transition.before && !(transition.before instanceof Array)) transition.before = [transition.before];
				if (transition.after && !(transition.after instanceof Array)) transition.after = [transition.after];
				if (transition.do && !(transition.do instanceof Array)) transition.do = [transition.do];
				if (transition.guard && !(transition.guard instanceof Array)) transition.guard = [transition.guard];
				if (transition.dont && !(transition.dont instanceof Array)) transition.dont = [transition.dont];
				if (transition.from && !states[transition.from]) states[transition.from] = {};
				if (transition.to && !states[transition.to]) states[transition.to] = {};

				from = transition.from || 'none';
				if (!fromStates[from]) {
					fromStates[from] = {};
				}
				fromStates[from][key] = transition;
				Object.freeze(transition); // i.e. this._transitions[key]
				Object.freeze(fromStates[from][key]); // i.e. this._fromStates[from][key]
				Object.freeze(states[transition.from]); // i.e. this._states[transition.from]
				Object.freeze(states[transition.to]); // i.e. this._states[transition.to]
			});
		}, this);
		Object.freeze(transitions); // i.e. this._transitions
		Object.freeze(states); // i.e. this._states
		Object.freeze(fromStates); // i.e. this._fromStates
		Object.freeze(_); // i.e. this._private
		Object.freeze(this.e);
		this._pendingTransition = false;
		this._lockKey = null;
		this._lifeCycle = [];
		setCurrent(this, _.initial);
		//<debug>
		if (DEBUG) {
			this.logger('Ⓜ️ MACHINE INSTANCIATED', this);
		}
		//</debug>
		if (typeof callback === "function") callback.call(this, this);
	}; // <-- end create

	Object.defineProperty(create.prototype, 'actions', {
		get: function() {
			return this._actions;
		}
	}); // expose the actions handlers for the entered state
	

	/**
	 * Factory function based on this machine configuration.
	 * This allows you to instanciate an original machine with a config and then instanciate any number of machines sharing the same config but each with their own lifecycle (history).  
	 * Registered listeners ({@link FSM#on}) are not shared but owned by the machine which registred them. Only configuration listeners are shared and unmutable.
	 * @example
	 * var fsm = new FSM(config); // original one
	 * var anotherMachine = fsm.factory('start', function(machine){ console.log('machine ready');}); // another machine based on same config as its original
	 * console.log(anotherMachine.orignal() === fsm); // => true
	 * @function FSM#factory
	 * @param {string} [initState=config._.initial] - The initial state to set to the new machine instance. Default to original configuration value.
	 * @param {FSM~onCreated} [callback] - An optional function to be called when machine is ready.
	 * @throws "Unknown initial state name".
	 */
	create.prototype.factory = function(initState, callback) {
		var me = this,
			events = Object.getOwnPropertyNames(me.e),
			superInitState = me._private.initial;

		function F(initState, callback) {
			if (arguments.length === 1 && typeof initState === 'function') {
				cb = initState;
				initState = null;
			}
			// create the owned instance members
			this._debug = false;
			this._pendingTransition = false;
			this._listeners = []; // each machine has its own registered listeners!
			this._lockKey = null;
			this._lifeCycle = [];
			this._initial = '';
			this.reason = null;
			setCurrent(this, initState || superInitState);
			this.e = {};
			events.forEach(function(event) {
				this.e[event] = buildEAlias(this, event);
			}, this); // FSM#e[event] => create own instance of e
			Object.freeze(this.e);
			if (typeof callback === "function") callback.call(this, this);
		}
		F.prototype = me;
		return new F(initState, callback);
	};

	function buildEAlias(me, event) {
		return function(params) {
			var i = 0,
				len = arguments.length,
				args = new Array(len);
			for (; i < len; ++i) {
				args[i] = arguments[i];
			}
			// var args = Array.prototype.slice.call(arguments);
			return me.trigger.apply(me, [event].concat(args));
		};
	}


	/**
	 * Reset the machine to the initial state as give in initial configs. You need the lock key if machine is locked.
	 * This set the current state to the initial state but do NOT call any listeners. It is up to you to deal with that after calling `resetMachine()`.
	 * The History is not cleared.
	 * @function FSM#resetMachine
	 * @param {Object} lockKey The lock key if machine is locked.
	 * @throws "Reseting machine is forbidden by a lock"
	 * @throws "Reseting machine is forbidden during a transition"
	 */
	create.prototype.resetMachine = function(lockKey) {
		if (this.isLocked() && !this.testLock(lockKey)) {
			throw ("Reseting machine is forbidden by a lock");
		}
		if (this._pendingTransition) {
			throw ("Reseting machine is forbidden during a transition");
		}
		setCurrent(this, this._private.initial);
	};

	/**
	 * Returns the version of FSM Function
	 * @function FSM#engineVersion
	 * @returns {string} The version of FSM Function.
	 */
	create.prototype.engineVersion = function() {
		return ENGINE;
	};

	/**
	 * Returns the version of this machine.
	 * @function FSM#version
	 * @returns {string} The version of machine as defined in configs instanciation.
	 */
	create.prototype.version = function() {
		return this._private.version || 'unknown';
	};

	// !!!!!!!!!!!! NOT REALLY SECURE BUT IMPLEMENTED YET !!!!!!!!!!!!!!!
	/**
	 * Lock FSM#trigger.
	 * See topic "Security : Locking Transitions".
	 * @function FSM#lock
	 * @param {Object} [key] The lock key.
	 * @returns {Object} `key` or a new lock key needed to {@link FSM#unlock unlock} {@link FSM#trigger}.
	 * @throws "Machine is already locked"
	 * @see {@link FSM#unlock unlock} {@link FSM#testLock testLock} {@link FSM#isLocked isLocked}
	 */
	create.prototype.lock = function() {
		if (this.isLocked()) throw ("Machine is already locked");
		return (this._lockKey = arguments[0] || {}); // the lock is simply the first argument (if not falsy) or a new Object.
	};
	/**
	 * Unlock FSM#trigger.
	 * @function FSM#unlock
	 * @param {Object} key The lock key.
	 * @returns {boolean} `true` if unlocking succeed, false otherwise.
	 * @see {@link FSM#lock lock} {@link FSM#testLock testLock} {@link FSM#isLocked isLocked}
	 */
	create.prototype.unlock = function(key) {
		if (this._lockKey && key === this._lockKey) this._lockKey = null;
		return (this._lockKey === null);
	};
	/**
	 * Test if a key matched the current lock key.
	 * @function FSM#testLock
	 * @param {Object} key The lock key.
	 * @returns {boolean} `true` if key matches the current lock key.
	 * @see {@link FSM#lock lock} {@link FSM#unlock unlock} {@link FSM#isLocked isLocked}
	 */
	create.prototype.testLock = function(key) {
		return key === this._lockKey;
	};
	/**
	 * Test if FSM#trigger is locked.
	 * @function FSM#isLocked
	 * @returns {boolean} `true` if FSM#trigger is locked.
	 * @see {@link FSM#lock lock} {@link FSM#unlock unlock} {@link FSM#testLock testLock}
	 */
	create.prototype.isLocked = function() {
		return (this._lockKey !== null);
	};
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!	

	/**
	 * The status of this machine.
	 * @typedef {Object} FSM~Status
	 * @property {string} engine - The engine version.
	 * @property {string} [namespace] - The namespace of this machine.
	 * @property {boolean} pending - If this machine transition is pending.
	 * @property {string} state - The current state of this machine.
	 * @property {string} version - The configs version.
	 */

	/**
	 * Get the status of this machine.
	 * @function FSM#status
	 * @returns {FSM~Status} The current status of this machine.
	 */
	create.prototype.status = function() {
		var res = {
			engine: this.engineVersion(),
			version: this.version(),
			state: this._current,
			pending: this._pendingTransition
		};
		if (this._private.namespace) res.namespace = this._private.namespace;
		return res;
	};

	/**
	 * Get the current state of this machine.
	 * @function FSM#current
	 * @returns {string} The current state of this machine.
	 */
	create.prototype.current = function() {
		return this._current;
	};

	/**
	 * Update the History of transitions.
	 * @private
	 * @function FSM#_addHistory
	 */
	create.prototype._addHistory = function(to, event) {
		var transition = {
			date: new Date(),
			to: to
		};
		if (this._current) transition.from = this._current;
		if (event) transition.event = event;
		Object.freeze(transition);
		this._lifeCycle.push(transition);
	};

	/**
	 * @function FSM#history
	 * @returns {Array} An array of the transition history of this machine.
	 */
	create.prototype.history = function() {
		return this._lifeCycle.concat(); // clone the array
	};

	/*
	 * You should not slice on arguments because it prevents optimizations in JavaScript engines (V8 for example).
	 * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
	function doesntLeakArguments() {
		DO_NOT_CALL_BUT_COPY_THE_LINE_INSIDE_FUNCTION();
		//convert arguments to args Array starting from index i:
		var i = 0,
			len = arguments.length,
			args = new Array(len);
		for (; i < len; ++i) {
			args[i] = arguments[i];
		}
		// var args = Array.prototype.slice.call(arguments, i);
		return args;
	}
	 */

	/*
	 * @private
	 * @function FSM#doAddListener
	 * @param {string|RegExp} eventPattern - The full event string emitted by FSM or a RegExp. Example: "guard-save-dirty-saving", /.✻/, /exit-.+/
	 * @param {Function} fn - The listener function.
	 * @param {Object} scope - The this scope for invoquing the listener.
	 * @param {Object} options - Will be passed to the listener function.
	 */

	function doAddListener(me, eventPattern, scope, fn, options) {
		var obs = {
			fn: fn,
			scope: scope
		};
		if (options.length > 0) {
			obs.options = options;
			//<debug>
			if (DEBUG) {
				me.logger('Add a listener for "%s" with options', eventPattern, options, arguments);
			}
			//</debug>
		}
		return me._listeners.length + 1 === me._listeners.push({
			pattern: eventPattern,
			observer: obs
		});
	}

	/*
	 * @private
	 * @param {string|RegExp} eventPattern - The full event string emitted by FSM or a RegExp.
	 * @param {Function} fn - The listener function.
	 * @param {Object} scope - The this scope for invoquing the listener.
	 * @param {Object} options - Will be passed to the listener function.
	 */

	function doRemoveListener(me, eventPattern, scope, fn) {
		var len = me._listeners.length;
		me._listeners = me._listeners.filter(function(item) {
			var cb = item.observer.fn,
				that = item.observer.scope;
			return (item.pattern != eventPattern.toString() || scope !== that || fn !== cb);
		});
		return len > me._listeners.length;
		// var target = me._listeners,
		// 	name = eventPattern;
		//
		// if(eventPattern instanceof RegExp){
		// 	name = '_regexp';
		// }
		// if (target[name]){ // garder le statement "target[eventPattern]" !
		// 	target[name] = target[name].filter(function(el, idx, arr){
		// 		 return (el.fn !== fn || el.scope !== scope);
		// 	});
		// }
	}

	/**
	 * The only place where to update the current state of a machine.
	 * It update the available actions.
	 * @private
	 * @throws "unknown state 'name'".
	 */

	function setCurrent(fsm, state, event) {
		// fsm._actions = {};
		fsm._addHistory(state, event);
		fsm._current = state;

		/**
		 * The set of functions available for the current state of this machine.
		 * This set has been defined in the config of {@link FSM new FSM(config)} as the `actions` value of a state definition.
		 * @member {Object} FSM#actions
		 * @property {Function} "name" - Each named property has a function – an action – as its value.
		 * @example
		 * fsm.send(args);
		 * // fsm.availActions().includes('send') should be true
		 * // i.e. 'send' is in fsm.availActions()
		 * @see {@link FSM#availActions} which returns a list of function names.
		 */
		if (!(fsm._states.hasOwnProperty(state))) throw 'unknown state "' + state + "'";
		fsm._actions = Object.assign({}, fsm._states[state].actions);
	}

	/**
	 * Machine and Configs Listeners are either the ones defined in the {@link FSM} `configs` parameter or registred with {@link FSM#on}.
	 * @callback FSM~listener
	 * @param {Object} eventObj - The event object.
	 * @param {string} eventObj.event - The trigger event name. Note that exit/entry listeners do not get this property.
	 * @param {string} eventObj.step - A string among { "before" | "guard" | "dont" | "do" | "after" } for transitions, or { "exit" | "entry" } for exit/entry states.
	 * @param {string} eventObj.from - The source state name of the transition.
	 * @param {string} eventObj.to - The target state name of the external transition. This property does not exist for an internal transition or exit/entry state.
	 * @param {string} eventObj.state - Either the exit state name (`step === "exit"`) or the entry state name (`step === "entry"`).
	 * @param {Object} eventObj.options - An Array containing the options parameters as given on registering the machine listener either:
	 * - with {@link FSM#on fsm.on(eventPattern, [scope,] listener, options...)} or
	 * - in the {@link FSM configs} definition of this transition (i.e. `configs."event"[{from, ... , options}]` or `configs."event".options`).
	 * @param {any} [args…] - The arguments were passed by the {@link FSM#trigger fsm.trigger(triggerEvent, args…)}.
	 * @return {boolean} either of :
	 * - `true` then continue to next listener.
	 * - `falsy` then the remaining listeners of the transition step (before, guard, do, dont, exit, enter or after) are skipped.
	 * - `falsy` when the step is either of "before", "guard" or "exit", then the transition is aborted.
	 * @see {@link home documentation}.
	 * @see {@link index}.
	 */
	/**
	 * Add an event listener to this machine.
	 * @function FSM#on
	 * @param {string|RegExp} eventPattern - The event emitted by FSM : either the full identifier or a RegExp.
	 * @param {Object} [scope=this] - The scope for invoquing the listener (this). Default to this machine.
	 * @param {FSM~listener} listener - The listener function(eventObj [, params…]).
	 * @param {Object} options… - Rest of the arguments to pass as options in the eventObj of listeners.
	 * @see {@link FSM#un}
	 */
	create.prototype.on = function(eventPattern, scope, cb /* , options... */ ) {
		var i = 3,
			fn = cb;

		if (typeof scope === "function") {
			fn = scope;
			scope = this;
			i = 2;
		}
		//convert arguments to options Array starting from index i:
		var len = arguments.length,
			options = [];
		for (; i < len; ++i) {
			options.push(arguments[i]);
		}
		// options = Array.prototype.slice.call(arguments, i);
		// var len = arguments.length, options = new Array(len);for(; i < len; ++i){options[i] = arguments[i];}
		return doAddListener(this, eventPattern, scope, fn, options);
	};

	/**
	 * Remove an event listener from this machine.
	 * @function FSM#un
	 * @param {string} eventPattern - The event as added with {@link FSM#on}.
	 * @param {Object} [scope=this] - The scope for invoquing the listener (this) as added with {@link FSM#on}.
	 * @param {FSM~listener} listener - The listener function(eventObj [, params]) which was added with {@link FSM#on}.
	 * @see {@link FSM#on}
	 */
	create.prototype.un = function(eventPattern, scope, cb) {
		var fn = cb;
		if (typeof scope === "function") {
			fn = scope;
			scope = this;
		}
		return doRemoveListener(this, eventPattern, scope, fn);
	};

	/**
	 * @function FSM#availActions
	 * @return {Array} - The array of actions identifiers available for the current state. You can call an action with `fsm.actions[action_identifier]`.
	 * @see {@link FSM#actions} which returns an array of action (function) names.
	 */
	create.prototype.availActions = function() {
		return Object.getOwnPropertyNames(this.actions);
		// return Object.getOwnPropertyNames(this._states[this._current].actions);
	};


	/**
	 * @function FSM#availEvents
	 * @param {boolean} [testGuard] - If `true` the guards for each available event if also tested.
	 * @param {Object} [args…] - Optional parameters as in {@link FSM#trigger}. If `testGuard !== true` these args are ignored.
	 * @return {Array} - An array of event names available for the current state.
	 */
	create.prototype.availEvents = function(testGuard /* , args... */ ) {
		var availTransitions = this._fromStates[this._current],
			me = this;
		var i = 1,
			len = arguments.length,
			args = (len > i ? new Array(len - i) : []);
		for (; i < len; ++i) {
			args[i - 1] = arguments[i];
		}

		return Object.getOwnPropertyNames(availTransitions).filter(function(event) {
			return testGuard === true ? _guards(me, event, availTransitions[event], args) : true;
		});
	};

	/**
	 * @function FSM#can
	 * @param {string} event - Event name to test availability for the current state.
	 * @param {boolean} [testGuard] - If `testGuard === true` then filter the result by the guard listeners of the available transitions.
	 * @param {Object} [args…] - Optional parameters as in {@link FSM#trigger}. If `testGuard !== true` these args are ignored.
	 * @return {boolean} - `true` if transition is allowed in current state.
	 */
	create.prototype.can = function(event, testGuard /* , args... */ ) {
		if (arguments.length === 0) return false;
		var i = 2,
			len = arguments.length,
			args = (len > i ? new Array(len - i) : []);
		for (; i < len; ++i) {
			args[i - 2] = arguments[i];
		}
		// var transition = this._transitions[event]; // transition
		return testGuard === true ? _guards(this, event, this._fromStates[this._current][event], args) : this._fromStates[this._current].hasOwnProperty(event);
	};

	/**
	 * Test the guard for an event in the current state.
	 * @private
	 * @param {FSM} me This machine.
	 * @param {string} event - An event name.
	 * @param {Object} transition - The transition to test.
	 * @param {Array} args - An optional array of the argument that would be passed to {@link FSM#trigger}. Note that parameters are already packed into an array.
	 */

	function _guards(me, event, transition, args) {
		var guards = transition.guard;
		//<debug>
		if (DEBUG) {
			me.logger('❓ GUARD in availEvents | event “%s” | transition', event, transition);
		}
		//</debug>
		var evtObj = {
				step: 'guard',
				event: event,
				from: transition.from,
				to: transition.to,
				options: transition.options
			},
			res = guards ? guards.every(
				function(f) {
					return f ? f.apply(me, [evtObj].concat(args)) : true;
				}
			) : true;
		// guard-<event>-<from>-<to> : on a testé les guard listeners de la transition identifiée.
		return res;
	}


	/**
	 * Test the current state.
	 * @function FSM#is
	 * @param {string} state - The state name to test.
	 * @returns {boolean}
	 * - `true` if the current state of this machine is state.
	 * - `false` otherwise.
	 */
	create.prototype.is = function(state) {
		return this._current === state;
	};

	/**
	 * Machine event.
	 * @private
	 * @function _fsmListeners
	 * @fires <className>#[event:]<entry-...>
	 *
	 * TBD – cache the set of matching listeners for a event fullname on first pass.
	 */
	create.prototype._fsmListeners = function(eventObj, args) {
		var me = this,
			justListen = this._private.justListen,
			res,
			event = eventObj.event,
			to = eventObj.to,
			from = eventObj.from,
			state = eventObj.state,
			fullname = eventObj.step + (state ? '-' + state : (event ? '-' + event : '') + (from ? '-' + from : '') + (to ? '-' + to : '')),
			listeners = me._listeners, // all listeners
			eventTemplate = Object.assign({}, eventObj);
		// //  make a clone of the eventObj and make it frozen
		// Object.getOwnPropertyNames(eventObj).forEach(function(key){
		// 	eventTemplate[key] = eventObj[key];
		// });
		// Object.freeze(eventTemplate); // so, listeners will not be able to modify it

		//<debug>
		if (DEBUG) {
			me.loggroup('❓ _fsmListeners ' + fullname + " (" + listeners.length + " possible listeners)");
			me.logger('with arguments template', eventTemplate, args);
		}
		//</debug>

		// Now call each listeners:
		try {
			res = listeners.every(function(listener) {
				// returning false canceled the subsequent listeners call:
				var pattern = listener.pattern,
					observer = listener.observer,
					fn = observer.fn,
					scope = observer.scope,
					options = observer.options,
					eventObject = Object.freeze(Object.assign(options ? {
						options: options
					} : {}, eventTemplate)),
					result = true,
					allArgs;

				if (pattern instanceof RegExp ? pattern.test(fullname) : pattern === fullname) {
					allArgs = [eventObject].concat(args);
					//<debug>
					if (DEBUG) {
						me.logger('💥 %cExecuting listener : %s with arguments', "color:red;font-style:italic", fn.toString(), allArgs);
					}
					//</debug>
					result = fn.apply(scope, allArgs);
				}
				return result || justListen;
			});
		} finally {
			//<debug>
			if (DEBUG) {
				me.logger('_fsmListeners "%s" returns : %c%s', fullname, res, "color:" + (res ? 'green' : 'red') + ";font-weight:bold");
				me.loggroup();
			}
			//</debug>
		}

		return res;
	};

	/**
	 * This is for development to help go out of a _pendingTransition. After calling this method the machine may be in an unexpected state.
	 * @function FSM#recoverPendingTransition
	 */
	create.prototype.recoverPendingTransition = function() {
		this._pendingTransition = false;
	};

	/**
	 * Query if this machine is currently in transition.
	 * @function FSM#isInTransition
	 * @returns {boolean} - `true` if the machine is running a transition yet.
	 */
	create.prototype.isInTransition = function() {
		return this._pendingTransition;
	};

	/*
	 *
	 * The templates of plain name of events are:
	 * -----------------------------------------
	 * (Note: replace below "event", "from" and "to" with the item name)
	 * - `before-"event"-"from"-"to"` : une transition est demandée mais n'a été ni validée, ni débutée.
	 * - `guard-"event"-"from"-"to"` : on teste les guard listeners de la transition identifiée.
	 * - `dont-"event"-"from"-"to"` : un guard a empêché la transition (dont-* sont exécutés).
	 * - `exit-"state"` : les exit state listeners sont exécutés.
	 * - `do-"event"-"from"-"to"`  : les do listeners sont exécutés (current state is ).
	 * - `entry-"state"` : les entry state listeners sont exécutés.
	 * - `after-"event"-"from"-"to"`  : la transition est terminée.
	 */
	/**
	 * @function FSM#trigger
	 * @param {string} event - The event for the trasnsition.
	 * @param {Object} [lockKey] - The lock key if the machine is locked. If the machine is locked then the second argument must be the lock.
	 * @param {any} [args…] - Any number of additional parameters that will be passed to callbacks.
	 * @returns {boolean}
	 * - `true` if the transition succeed.
	 * - `false` if the transition failed. Then the `fsm.reason` contains the error description.
	 * @fires listener: before-"event"-"from"-"to" for instance a transition from a source state "save" to a target state "saving" the event identifier is "before-save-dirty-saving".
	 * @fires listener: guard-"event"-"from"-"to" for instance: "guard-save-dirty-saving".
	 * @fires listener: dont-"event"-"from"-"to" for instance: "dont-save-dirty-saving".
	 * @fires listener: exit-"state" for instance: "exit-dirty".
	 * @fires listener: do-"event"-"from"-"to" for instance: "do-save-dirty-saving".
	 * @fires listener: entry-"state" for instance: "entry-saving".
	 * @fires listener: after-"event"-"from"-"to" for instance: "after-save-dirty-saving".
	 * @description Trigger an available event to execute a transition in the current state. You can execute either of:
	 *
	 *	fsm.trigger(event, [lockKey,] args...)
	 *	fsm.t(event, [lockKey,] args...)
	 *	fsm.e.<event>([lockKey,] args...)
	 *
	 * #### Steps Sequences on a Transition
	 * A trigger event initiates a state transition which executes the following actions in the following sequence (and wrapped between **before** and **after**):
	 *
	 * 1. Evaluate the **guard** condition associated with the transition and perform the following steps only if the guard evaluates to `true`.
	 * 2. **Exit** the source state (the current one).
	 * 3. Execute (or `do`) the **actions** associated with the transition.
	 * 4. **Enter** the target state of the transition.
	 *
	 * Each transition is a sequence of steps and at each step our machine will fire (emit) an event that listeners can catch.
	 * In our machine there are actually 5 possible sequences of steps for an event depending on context:
	 *
	 * (1) **before -> after** :
	 * > if a *before listener* does not return `true` or throws an error, the transition is canceled. It behaves like a guard but without executing `dont` listeners.
	 *
	 * (2) **before -> guard -> dont -> after** :
	 * > if a *guard listener*  does not return `true` or throws an error, the transition is canceled and `dont` listeners are executed.
	 *
	 * (3) **before -> guard -> exit -> after** :
	 * > if a *exit state listener* returns `false` or throws an error, the transition is canceled.
	 *
	 * (4) **before -> guard -> exit -> do -> entry -> after** :
	 * > the full external transition.
	 *
	 * (5) **before -> guard -> do -> after** :
	 * > the full internal transition.
	 *
	 * In our implementation `before` and `after` listeners are executed when defined at the beginning and the end of the sequence steps.
	 *
	 * **IMPORTANT** Do not confuse Trigger Events with Machine Events (see detailled home description):
	 * - **Trigger events** are the events defined in the machine configuration (see {@link FSM}).
	 * - **Machine events** are events emitted (fired) by the machine during a transition and that can be listen to when registered with {@link FSM#on}.
	 *
	 * The signature of both kind of events is the same: see {@link FSM~listener}.
	 * @see {@link FSM#listener}
	 * @public
	 */
	create.prototype.trigger = function(event /* [, lockKey] [, args...] */ ) {
		var i = 1;
		if (this.isLocked()) {
			if (this.testLock(arguments[1])) i = 2; // first argument was the lock key!
			else {
				this.reason = "Trigger is forbidden by a lock";
				return false;
			}
		}
		/**
		 * flag set to `true` for the whole duration of a transition.
		 * @member {boolean} FSM#_pendingTransition
		 * @private
		 */
		if (this._pendingTransition) {
			this.reason = "Cannot trigger '" + /*event = */ arguments[i] + "' : previous transition is not completed";
			return false;
		}
		this._pendingTransition = true;
		var len = arguments.length,
			args = [];
		for (; i < len; ++i) {
			args.push(arguments[i]);
		}
		var result = _trigger(this, event, args /* Array.prototype.slice.call(arguments,n) */ );
		this._pendingTransition = false;
		return result;
	};

	/**
	 * @private
	 * @function FSM#_trigger
	 */
	function _trigger(me, event, args) {
		var from = me._current, // from/current state
			transition = me._fromStates[from][event], // transition
			result = true,
			justListen = me._private.justListen;

		args = args || [];
		me.reason = null; // will get the reason of a failure for the transition


		if (!transition) {
			me.reason = "Cannot trigger '" + event + "' : undefined transition in current state '" + from + "'";
			return false;
		}

		var to = transition.to, // to state
			options = transition.options,
			eventTransitionObj = {
				event: event,
				from: from
			},
			eventExitStateObj = {
				state: from
			},
			eventEntryStateObj = {
				state: to
			};

		if (to) eventTransitionObj.to = to;
		// if(transition.options) { // JFG TBD : pas d'options à la transition
		// 	eventTransitionObj.options = transition.options;
		// 	eventStateObj.options = transition.options;
		// }

		function generic(prefix, eventObj, fns) {
			//<debug>
			if (DEBUG) {
				me.loggroup('❓❓ Listeners "' + prefix + '"');
				me.loggroup('❓ in configs (' + (fns ? fns.length : 0) + ' functions)');
			}
			//</debug>
			eventObj.step = prefix;
			var eventObject = {},
				res, allArgs;
			if (options) eventObject.options = options;
			try {
				eventObject = Object.freeze(Object.assign(eventObject, eventObj));
				allArgs = [eventObject].concat(args);
				res = (fns ? fns.every(
					function(f) {
						//<debug>
						if (DEBUG) {
							me.logger('💥 %cExecuting FSM %s : %s with arguments', "color:red;font-style:italic", prefix, f.toString(), allArgs);
						}
						//</debug>
						return f ? f.apply(me, allArgs) : true;
					}
				) : true);
			} finally {
				//<debug>
				if (DEBUG) {
					me.loggroup();
				}
				//</debug>
				if (justListen) {
					me._fsmListeners(eventObj, args);
				} else {
					res = res && me._fsmListeners(eventObj, args); // _fsmListeners only called if res === true
				}
				//<debug>
				if (DEBUG) {
					me.loggroup();
					me.logger('Listeners "%s" returns : %c%s', prefix, "color:" + (res ? 'green' : 'red') + ";font-weight:bold", res);
				}
				//</debug>
			}
			return res;
		}
		// BEFORE --------------------

		function before() {
			//  before-<event>-<from>-<to> : une transition est demandée mais n'a été ni validée, ni débutée.
			return generic('before', eventTransitionObj, transition.before);
		}

		// GUARD TRANSITION --------------------

		function guards() {
			return generic('guard', eventTransitionObj, transition.guard);
			// guard-<event>-<from>-<to> : on a testé les guard listeners de la transition identifiée.
		}

		// EXIT STATE --------------------

		function exit() {
			return generic('exit', eventExitStateObj, me._states[from].exit);
			// exit-<state> : les exit state listeners sont exécutés.
		}

		// DONT TRANSITION ACTION --------------------

		function dont() {
			return generic('dont', eventTransitionObj, transition.dont);
			// dont-<event>-<from>-<to> : un guard a empêché la transition (dont exécutés).
		}

		// DO TRANSITION ACTION --------------------

		function dos() {
			return generic('do', eventTransitionObj, transition.do);
			// do-<event>-<from>-<to>  : les do listeners sont exécutés (current state is ).
		}

		// ENTRY STATE --------------------

		function entry() {
			return generic('entry', eventEntryStateObj, me._states[to].entry);
			// entry-<state> : les entry state listeners sont exécutés.
		}

		// AFTER --------------------

		function after() {
			// after-<event>-<from>-<to>  : la transition est terminée.
			return generic('after', eventTransitionObj, transition.after);
		}

		//<debug>
		if (DEBUG) {
			var timerLabel = 'Transition ' + event;
			me.loggroup('⚡ TRIGGER TRANSITION "' + event + '" : from "' + from + '" to "' + to + '"');
			me.logger('TRANSITION', transition);
			me.logger('ARGUMENTS', args);
			me.logTime(timerLabel);
		}
		//</debug>
		try {
			if (before() !== true) {
				throw ("before cancelled the transition");
				// me.reason = "before cancelled the transition";
				// return false;
			}

			if (guards() !== true) {
				dont();
				throw ("guard cancelled the transition");
				// me.reason = "guard cancelled the transition";
				// return false;
			}

			if (to) {
				if (exit() !== true) { // only exit if external transition
					dont();
					throw ("exit cancelled the transition");
					// me.reason = "exit cancelled the transition";
					// return false;
				}
				// here an external state is considered exited => remove the actions handlers exposed
				me._actions = {};
			}
			dos();
			if (to) {
				setCurrent(me, to, event);
				entry();
			}

		} catch (e) {
			// error-<event>-<from>-<to> : une erreur est survenue.
			//<debug>
			if (DEBUG) {
				me.logerror(e);
			}
			//<debug>
			me.reason = e;
			result = false;

		} finally {
			try {
				after();
			} catch (e) {
				//<debug>
				if (DEBUG) {
					me.logerror(e);
				}
				//<debug>
				me.reason = {
					error: e,
					step: 'after'
				};
				result = false;
			}

			//<debug>
			if (DEBUG) {
				me.loggroup();
				me.logTimeEnd(timerLabel);
				me.logger('🔵 The transition returns => %c%s (reason : %o)', "color:" + (result ? 'green' : 'red') + ";font-weight:bold", result, me.reason);
				me.logger('🔵 Current state is "%c%s%c". Available events : "%s".', "color:blue;font-weight:bold", me._current, "", me.availEvents().join('","'));
			}
			//</debug>
		}
		return result;
	}

	/**
	 * Alias for {@link FSM#trigger}.
	 * @function FSM#t
	 * @returns {boolean}
	 * - `true` if the transition succeed.
	 * - `false` if the transition failed. Then the `fsm.reason` contains the error description.
	 */
	create.prototype.t = create.prototype.trigger; // alias

	/**
	 * @member {boolean} FSM#debug
	 * @default false
	 * @description Setter and getter of the `debugging` property.  
	 * `fsm.debug` : get the debug value.  
	 * `fsm.debug = true|false` : will set the debug value. A value of `true` will log verbose messages in console.  
	 * This property is ineffective in the `build/fsm-debug.min.js` file.
	 */
	Object.defineProperty(create.prototype, "debug", {
		set: function(flag) {
			this._debug = this.logger ? !!(flag && console && console.log && console.time && console.timeEnd) : false; // test if source has debugging methods
		},
		get: function() {
			return this._debug;
		}
	});

	//<debug>
	if (DEBUG) {

		// ----------------------------------------------------------------
		/**
		 * Logging for debugging purpose.
		 * @private
		 * @function FSM#logger
		 */
		create.prototype.logger = function() {
			if (this._debug) {
				var i = 0,
					len = arguments.length,
					args = new Array(len);
				for (; i < len; ++i) {
					args[i] = arguments[i];
				}
				console.log.apply(console, args /*Array.prototype.slice.call(arguments)*/ );
			}
		};
		/**
		 * Logging for debugging purpose.
		 * @private
		 * @function FSM#logError
		 */
		create.prototype.logerror = function() {
			if (this._debug) {
				var i = 0,
					len = arguments.length,
					args = new Array(len);
				for (; i < len; ++i) {
					args[i] = arguments[i];
				}
				console[console.error ? 'error' : 'log'].apply(console, args /*Array.prototype.slice.call(arguments)*/ );
				console.trace();
			}
		};
		/**
		 * Logging for debugging purpose.
		 * @private
		 * @function FSM#loggroup
		 */
		create.prototype.loggroup = function() {
			if (this._debug) {
				if (arguments.length) {
					var i = 0,
						len = arguments.length,
						args = new Array(len);
					for (; i < len; ++i) {
						args[i] = arguments[i];
					}
					if (console.groupCollapsed) {
						console.groupCollapsed.apply(console, args /*Array.prototype.slice.call(arguments)*/ );
					} else if (console.group) {
						console.group.apply(console, args /*Array.prototype.slice.call(arguments)*/ );
					}
				} else {
					if (console.groupEnd) console.groupEnd();
				}
				// arguments.length ? (console.groupCollapsed ? groupCollapsed:(console.group ? group:log)):(console.groupEnd ? groupEnd:log).apply(console, Array.prototype.slice.call(arguments));
			}
		};
		/**
		 * Logging for debugging purpose.
		 * @private
		 * @function FSM#logTime
		 */
		create.prototype.logTime = function(label) {
			if (this._debug) {
				console.time(label);
			}
		};
		/**
		 * Logging for debugging purpose.
		 * @private
		 * @function FSM#logTimeEnd
		 */
		create.prototype.logTimeEnd = function(label) {
			if (this._debug) {
				console.timeEnd(label);
			}
		};
		// ----------------------------------------------------------------
	}
	//</debug>

	return create;
});
