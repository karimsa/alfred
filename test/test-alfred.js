/**
 * test/test-alfred.js - alfred
 * some unit tests for alfred.
 *
 * Licensed under GPLv3.
 * Copyright (C) 2015 Karim Alibhai.
 */
/*globals beforeEach, describe, it*/

'use strict';

require('should');
require('mocha');

const createAlfred = require('../');
var alfred;

// use a new instance of alfred each time
beforeEach((done) => {
    alfred = createAlfred();

    alfred.on('default', function () {
        throw new Error('command not caught.');
    });

    done();
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
    describe('simple variable', function () {
        it('should grab the rest of the string', function (done) {
            alfred.add('hello, $who.', function (data) {
                data.should.be.eql({
                    who: 'alfred'
                });

                return 'hello, master.';
            });

            alfred.on('data', function (chunk) {
                chunk.should.equal('hello, master.');
                done();
            });

            alfred.write('hello, alfred.');
        });
    });
});

// test speed of large command corpus
describe('test large command corpus', function () {
    it('should take less than a second', function (done) {
        var randomstring = require('randomstring'),
            ctr = 100,
            noop = function () {
                return false;
            },
            tstart;

        // add test command
        alfred.add('hello', function () {
            (Date.now() - tstart).should.be.below(1000);
            done();
        });

        // add 100 random commands
        while (ctr) {
            ctr -= 1;
            alfred.add(randomstring.generate(), noop);
        }

        // start test
        tstart = Date.now();
        alfred.write('hello');
    });
});
