var should = this.hasOwnProperty('chai') ? chai.should() : require('chai').should(); //actually call the function
var expect = this.hasOwnProperty('chai') ? chai.expect : require('chai').expect; //actually call the function
var data = require('./fixtures/data.js');

// var FSM = require("../src/fsm.js");
var FSM = require("../build/fsm-debug.min.js");
// var FSM = require("../build/fsm.min.js");


describe('FSM', function() {

	var fsm, paramInCb, thisInCb, lockKey, listener;
	var OPTIONS = ['option-1', {
		name: 'option-2'
	}];

	describe('#create', function() {
		it('should load a machine', function() {
			fsm = new FSM(data, function(p) {
				paramInCb = p;
				thisInCb = this;
			});
			fsm.should.be.an.instanceof(FSM);
			// fsm.debug = true;
		});
		it('should call the instanciation callback with instance as parameter', function() {
			fsm.should.equal(paramInCb);
		});

		it('should call the instanciation callback on "this" machine', function() {
			fsm.should.equal(thisInCb);
		});
		it('should have correct meta data', function() {
			Object.getOwnPropertyNames(data._).map(function(key) {
				fsm._private[key].should.equal(data._[key]);
			})
			fsm._private.version.should.equal(data._.version);
			fsm._private.initial.should.equal(data._.initial);
		});

		it('should have a correct status', function() {
			var st = fsm.status();
			st.namespace.should.equal(fsm._private.namespace);
			st.version.should.equal(fsm._private.version);
			st.pending.should.equal(false);
			st.state.should.equal(fsm._current);
		});

		it('should have correct initial current state', function() {
			fsm._private.initial.should.equal(fsm._current);
			fsm.is(fsm.current()).should.be.true;
		});

		it('should have current state "dirty"', function() {
			fsm._private.initial.should.equal(fsm._current);
			fsm.is("dirty").should.be.true;
		});
	});

	describe('#availEvents', function() {
		it('should return the set of available events', function() {
			var events = fsm.availEvents();
			events.should.include('save');
			events.length.should.equal(1);
		});

		it('should return the set of available events filtered by guards', function() {
			// we're still in "dirty" state => guard will return false if args is false
			var testGuards = true,
				events = fsm.availEvents(testGuards, false);
			events.length.should.equal(0);
		})
	});

	describe('#availActions', function() {

		it('should return the set all available actions', function() {
			var actions = fsm.availActions().sort();
			actions.length.should.equal(3);
			actions.should.deep.equal(['edit', 'redo', 'undo']);
		});

	});

	describe('#trigger', function() {
		it('should not allow a "success" transition and give the correct reason', function() {
			var res = fsm.trigger("success");
			res.should.be.false;
			fsm.reason.should.equal("Cannot trigger 'success' : undefined transition in current state 'dirty'");
		});

		it('should still be in "dirty" state', function() {
			fsm.current().should.equal('dirty');
		});

		it('should trigger a transition with "save"', function() {
			fsm.trigger('save').should.be.true;
		})

		it('to be in a "saving state"', function() {
			fsm.current().should.equal('saving');
		})

		it('and have "success" and "failure" as available events', function() {
			var events = fsm.availEvents().sort();
			events.length.should.equal(2);
			events.should.deep.equal(['failure', 'success']);
		});

		it('should return to "dirty" on "failure" event', function() {
			fsm.trigger('failure').should.be.true;
			fsm.current().should.equal('dirty');
		});

	});

	describe('#can', function() {
		it('should return true for "save" transition', function() {
			fsm.can('save').should.be.true;
		});

		it('should be false for "failure" transition', function() {
			fsm.can('failure').should.be.false;
			fsm.can('edit').should.be.false;
			fsm.can('success').should.be.false;
		});

	})
	describe('#lock and #unlock', function() {
		// EXAMPLE OF NORMAL SAVING PROCESS:
		// Please! Note the "fsm.actions.save" which is happening as an asynchrounous action in the "saving" state.
		// Because it is asynchronous, we get a lock on the machine, so no other handler can invoque a trigger during this action.
		// Remember that transition cannot be asynchronous, only actions inside states can.
		it('should transition with "save" with success from "dirty -> saving -> saved"', function(done) {
			var myLockKey = fsm.lock();
			var res = fsm.trigger('save', myLockKey);
			res.should.be.true;
			fsm.current().should.equal('saving');
			// simulate an Ajax success (or failure)
			fsm.actions.save(function(err, data) {
				expect(err).to.be.null;
				if (err) {
					// fsm.trigger(myLockKey, 'failure').should.be.true;
					// fsm.current().should.equal('dirty');
				} else {
					data.should.equal('some data');
					fsm.trigger('success', myLockKey).should.be.true;
					fsm.current().should.equal('saved');
				}
				fsm.unlock(myLockKey);
				done();
			}, true /* i.e. simulate a succeess */ );


		})
		it('on lock : forbid triggering by returning false and a reason', function() {
			lockKey = fsm.lock();
			fsm.isLocked().should.be.true;
			expect(fsm.trigger('edit')).to.be.false;
			fsm.reason.should.equal('Trigger is forbidden by a lock');
		});
		it('can unlock', function() {
			fsm.unlock(lockKey);
			fsm.isLocked().should.be.false;
		});
		it('to allow trigger the "edit" event', function() {
			fsm.trigger('edit').should.be.true;
		});

		it('can lock transitions triggered by "save" from "dirty" to "saving" to "dirty"', function(done) {
			lockKey = fsm.lock();
			fsm.current().should.equal('dirty');
			var res = fsm.trigger('save', lockKey);
			res.should.be.true;
			fsm.current().should.equal('saving');
			// simulate an Ajax failure in a saving state action
			fsm.actions.save(function(err, data) {
				err.should.not.to.be.null;
				if (err) {
					fsm.trigger('failure', lockKey).should.be.true;
					fsm.current().should.equal('dirty');
					fsm.unlock(lockKey);
				}
				done();
			}, false /* i.e. simulate a failure */ );
		});

	});

	describe('#on, #un and #listener(eventObject, args...)', function() {
		it('should be guarded from leaving the "dirty" state', function() {
			fsm.trigger("save", false).should.be.false;
			fsm.reason.should.equal('guard cancelled the transition');
		});

		it('should register a listener and pass arguments on trigger', function() {
			listener = function(eventObj, flag, one, two, three) {
				expect(eventObj.options).to.be.undefined;
				eventObj.step.should.equal('exit');
				eventObj.state.should.equal('dirty');
				expect(eventObj.event).to.be.undefined; // no event in exit listener !
				one.should.equal(1);
				two.should.equal(2);
				three.should.equal(3);
				flag.should.be.true;
			};
			fsm.on(/^exit/, listener).should.be.true;
			fsm.trigger("save", true, 1, 2, 3);//.should.be.true;
			expect(fsm.reason).to.be.null;
			fsm.current().should.equal('saving');
		});

		it('should unregister a listener', function() {
			fsm.un(/^exit/, listener).should.be.true;
			fsm.trigger("failure").should.be.true;
			expect(fsm.reason).to.be.null;
			fsm.current().should.equal('dirty');
		})

		it('should pass the listeners the options given in registering another listener', function() {
			listener = function(eventObj, flag, one, two, three) {
				expect(eventObj.options).not.to.be.undefined;
				OPTIONS.length.should.equal(eventObj.options.length);
				eventObj.options.forEach(function(item, idx) {
					item.should.equal(OPTIONS[idx]);
				});
				['exit', 'entry'].indexOf(eventObj.step) !== -1 ? expect(eventObj.event).to.be.undefined : eventObj.event.should.equal('save');
				flag.should.be.true;
				one.should.equal(1);
				two.should.equal(2);
				three.should.equal(3);
			};
			fsm.on(/.*/, listener, OPTIONS[0], OPTIONS[1]);
			fsm.trigger("save", true, 1, 2, 3).should.be.true;
			expect(fsm.reason).to.be.null;
			fsm.current().should.equal('saving');
		});
		it('should unregister the other listener', function() {
			fsm.un(/.*/, listener).should.be.true;
			fsm.trigger("failure").should.be.true;
			fsm.current().should.equal('dirty');
		});

		it('should pass the listener steps in correct sequence (before>guard>exit>do>entry>after)', function() {
			var steps = [];
			listener = function(eventObj, flag, one, two, three) {
				steps.push(eventObj.step);
			};
			fsm.on(/.*/, listener, OPTIONS[0], OPTIONS[1]).should.be.true;
			fsm.trigger("save", true, 1, 2, 3).should.be.true;
			['before', 'guard', 'exit', 'do', 'entry', 'after'].every(function(item) {
				return item === steps.shift();
			}).should.be.true;
			fsm.current().should.equal('saving');
		});
		it('should unregister the other listener', function() {
			fsm.un(/.*/, listener).should.be.true;
			fsm.trigger("failure").should.be.true;
			expect(fsm.reason).to.be.null;
			fsm.current().should.equal('dirty');
		});

		it('should pass the listener steps in correct sequence (before>guard>dont>after)', function() {
			var steps = [];
			listener = function(eventObj, flag, one, two, three) {
				steps.push(eventObj.step);
			};
			fsm.on(/.*/, listener, OPTIONS[0], OPTIONS[1]).should.be.true;
			fsm.trigger("save", false, 1, 2, 3).should.be.false;
			['before', 'guard', 'dont', 'after'].every(function(item) {
				return item === steps.shift();
			}).should.be.true;
			fsm.current().should.equal('dirty');
		});
		it('should unregister the other listener', function() {
			fsm.un(/.*/, listener).should.be.true;
			fsm.trigger("save").should.be.true;
			expect(fsm.reason).to.be.null;
			fsm.current().should.equal('saving');
		});

		it('listeners to all full machine event identifiers should be called', function() {
			var count = 0,
				FULLS = ['before-success-saving-saved', 'guard-success-saving-saved', 'exit-saving', 'do-success-saving-saved', 'entry-saved', 'after-success-saving-saved'];
			listener = FULLS.map(function(id, idx) {
				var l = function(eventObj) {
					count++;
				};
				fsm.on(id, l).should.be.true;
				return l;
			});
			fsm.trigger("success").should.be.true;
			count.should.equal(FULLS.length); // check if each listener have been called
			listener.forEach(function(l, idx) {
				fsm.un(FULLS[idx], l).should.be.true
			});
			fsm.current().should.equal('saved');
		})

		it('should pass the listener steps in correct sequence (before>guard>exit>dont>after)', function() {
			var steps = [];
			listener = function(eventObj, flag, one, two, three) {
				steps.push(eventObj.step);
			};
			fsm.on(/.*/, listener, OPTIONS[0], OPTIONS[1]);
			fsm.trigger("edit", false).should.be.false;
			fsm.reason.should.equal("exit cancelled the transition");
			['before', 'guard', 'exit', 'dont', 'after'].every(function(item) {
				return item === steps.shift();
			}).should.be.true;
			fsm.current().should.equal('saved');
		});
		it('should unregister the other listener', function() {
			fsm.un(/.*/, listener).should.be.true;
			fsm.trigger("edit").should.be.true;
			expect(fsm.reason).to.be.null;
			fsm.current().should.equal('dirty');
		});

		it('should pass a complete and correct eventObject', function() {
			listener = function(eventObj) {
				expect(eventObj).to.have.ownProperty('step');
				var expectedProps = ['exit', 'entry'].indexOf(eventObj.step) !== -1 ? ['state', 'options'] : ['event', 'from', 'to', 'options'];
				expectedProps.forEach(function(prop) {
					expect(eventObj).to.have.ownProperty(prop);
				});
			};
			fsm.on(/.*/, listener, OPTIONS[0], OPTIONS[1]).should.be.true;
			fsm.trigger("save").should.be.true;
			fsm.current().should.equal('saving');
		});
		it('should unregister the other listener', function() {
			fsm.un(/.*/, listener).should.be.true;
		});

		it('should pass the listener steps in correct sequence (before>after)', function() {
			var steps = [];
			listener = function(eventObj, flag, one, two, three) {
				steps.push(eventObj.step);
			};
			fsm.on(/.*/, listener, OPTIONS[0], OPTIONS[1]);
			fsm.trigger("success", false).should.be.false;
			fsm.reason.should.equal("before cancelled the transition");
			['before', 'after'].every(function(item) {
				return item === steps.shift();
			}).should.be.true;
			fsm.current().should.equal('saving');
		});
		it('should unregister the other listener', function() {
			fsm.un(/.*/, listener).should.be.true;
			fsm.trigger("success").should.be.true;
			expect(fsm.reason).to.be.null;
			fsm.current().should.equal('saved');
		});

	});

	describe('#factory', function() {
		var machine, finite, other;

		it('should return distinct machines based on original one', function() {
			var mb, ob;
			machine = fsm.factory('saved', function(m) {
				mb = this === m
			}),
			finite = machine.factory('dirty', function(m) {
				ob = this === m
			});
			other = machine.factory('saving', function(m) {
				ob = this === m
			});
			fsm.current().should.equal('saved');
			finite.current().should.equal('dirty');
			machine.current().should.equal('saved');
			other.current().should.equal('saving');
			mb.should.be.true;
			ob.should.be.true
			machine.should.not.equal(other);
			machine.should.not.equal(fsm);
			machine.should.not.equal(finite);
			other.should.not.equal(fsm);
			other.should.not.equal(finite);
			fsm.should.not.equal(finite);
		});

		it('should create machines working independently', function() {
			other.e.success().should.be.true;
			fsm.trigger('edit').should.be.true;
			fsm.current().should.equal('dirty');
			machine.current().should.equal('saved');
			other.current().should.equal('saved');

			fsm.trigger('save').should.be.true;
			fsm.current().should.equal('saving');
			machine.current().should.equal('saved');
			other.current().should.equal('saved');

			machine.t('edit').should.be.true;
			fsm.current().should.equal('saving');
			machine.current().should.equal('dirty');
			other.current().should.equal('saved');

			machine.t('edit').should.be.false;
			machine.reason.should.equal("Cannot trigger 'edit' : undefined transition in current state 'dirty'");
			fsm.current().should.equal('saving');
			machine.current().should.equal('dirty');
			other.current().should.equal('saved');
		});

		it('should create machines each with their own history', function() {
			// _lifeCycle is cloned by history(), so we use _lifeCycle here:
			fsm._lifeCycle.should.not.equal(machine._lifeCycle);
			fsm._lifeCycle.should.not.equal(other._lifeCycle);
			finite._lifeCycle.should.not.equal(machine._lifeCycle);
		});

		it('should create machines which know the original one (i.e. not made by FSM#factory)', function() {
			fsm.original().should.equal(fsm);
			other.original().should.equal(fsm);
			machine.original().should.equal(fsm);
			finite.original().should.equal(fsm);
		});

		it('should throw an error when initial state is unknown', function() {
			expect(function() {
				fsm.factory('unknown state')
			}).to.
			throw (/^unknown state /);
		});

		it('should create machines with their own independent registered listeners', function() {
			var fsmCount = 0, machineCount = 0;
			listener = [
				function(eventObj) {
					fsmCount++;
					this.should.equal(fsm);
				},
				function(eventObj) {
					machineCount++;
					this.should.equal(machine);
				}
			];
			fsm.on(/.+/, listener[0]).should.be.true;
			machine.on(/.+/, listener[1]).should.be.true;
			fsm.trigger('success').should.be.true;
			machine.trigger('save').should.be.true;
			fsmCount.should.equal(6);
			machineCount.should.equal(6);
			fsm.current().should.equal('saved');
			machine.current().should.equal('saving');
			fsm.un(/.+/, listener[0]).should.be.true;
			machine.un(/.+/, listener[1]).should.be.true;
		});
		
		it('should have their own independent `debug` values', function(){
			fsm.debug = true;
			console.log('fsm.debug', fsm.debug);
			machine.debug = false;
			console.log('machine.debug', machine.debug);
			var d = fsm.debug;
			d.should.be.true; 
			machine.debug.should.be.false;
			fsm.debug = false;
			other.debug = true;
			other.debug.should.be.true;
			fsm.debug.should.be.false;
			machine.debug.should.be.false;
		})
	});
});
