/**
 * test/test-alfred.js - alfred
 * some unit tests for alfred.
 * 
 * Licensed under GPLv3.
 * Copyright (C) 2015 Karim Alibhai.
 */

var should = require ( 'should' ),
	mocha = require ( 'mocha' ),
	alfred;
	
// use a new instance of alfred each time
beforeEach(function () {
	alfred = require('../')();
});
	
// simple hello world test
describe('test simple hello world command', () => {
	describe('use a function', () => {
		it('should produce output in the stream', (done) => {
			// define our command
			alfred.add('hello, *.', () => {
				return 'hello, world.';
			});
	
			// prepare to test output
			alfred.on('data', (chunk) => {
				chunk.should.equal('hello, world.');
				done();
			});
	
			// write some input
			alfred.write('hello, alfred.');
		});
	});
	
	
	describe('use a generator', () => {
		it('should produce output in the stream', (done) => {
			// define our command
			alfred.add('hello, *.', function* () {
				(yield 'is this a test?').should.equal('yes, this is a test.');
				return 'hello, world.';
			});
	
			// prepare to test output
			alfred.once('data', (chunk) => {
				chunk.should.equal('is this a test?');
				alfred.once('data', (chunk) => {
					chunk.should.equal('hello, world.');
					done();
				}).write('yes, this is a test.');
			});
	
			// write some input
			alfred.write('hello, alfred.');
		});
	});
});

// test variables
describe('test out variables', function () {
	describe('simple eol variable', function () {
		it('should grab the rest of the string', function (done) {
			alfred.add('hello, $who.', function (input, data) {
				data.should.be.eql({
					who: 'alfred'
				});
				
				this.say('hello, master.');
			});
			
			alfred.on('data', function (chunk) {
				chunk.should.equal('hello, master.');
				done();
			});
			
			alfred.write('hello, alfred.');
		});
	});
});