/**
 * index.js - alfred
 * a natural language interfacing tool.
 *
 * Licensed under GPLv3.
 * Copyright (C) 2015 Karim Alibhai.
 **/

'use strict';

var es = require('event-stream'),
    natural = require('natural'),
    flatten = require('underscore').flatten,
    similar = require('./lib/similar'),

    /**
     * THE HELPERS.
     */
    wrap = function (fn, ctx) {
        return function () {
            return fn.apply(ctx, arguments) || ctx;
        };
    },
    stemmer = {
        stem: natural.PorterStemmer.stem.bind(natural.PorterStemmer),
        tokenize: natural.PorterStemmer.tokenizeAndStem.bind(natural.PorterStemmer),
        clean: function (str, filter) {
            // filter isn't required, just allow
            // everything if none is given
            filter = filter || function () {
                return true;
            };

            // tokenize and stem the way we like to do it
            return str
                // clean up any punctuation
                .replace(/[\.,]+/g, '')

            // split by a space rather than the
            // traditional aggressive '\W'
            .split(/\s+/g)

            // individually stem every word
            .map(function (word, index) {
                var original = word;

                // if filter allows it, then
                // stemmify
                if (filter(word)) {
                    word = stemmer.stem(word);
                }

                // create object to maintain original
                return {
                    original: original,

                    toString: function () {
                        return word;
                    },

                    valueOf: function () {
                        return word;
                    }
                };
            })

            // filter all stopwords
            .filter(function (word) {
                return natural.stopwords.indexOf(String(word)) === -1 && natural.stopwords.indexOf(word.original) === -1;
            });
        }
    },

    /**
     * THE TRANSFORMS.
     * Built-in transforms to parse out things like
     * variables and apply filters.
     */
    transforms = [
        function (data, next) {
            // create a template with pennyworth
            this.pennyworth.template(data.raw)(data.input).then(function (res) {
                // swap data out with processed data
                data.data = res;

                // continue with data
                next(null, data);
            }, next);
        }
    ],

    /**
     * THE COMMANDS.
     * Built-in helper commands.
     **/
    commands = {},

    /**
     * THE PROTOTYPE.
     */
    alfred = {
        /**
         * adds a new command handler.
         * @param {String} prompt - a single string as a pennyworth template.
         * @param {Function|Generator} handler - a function or ES6 generator to handle the command.
         **/
        add: function (prompt, handler) {
            // we don't want an array
            if (prompt instanceof Array) {
                return console.warn('DEPRECATED: use a pennyworth string.');
            }

            // get the type of the handler that will be used
            // for these prompts, and create the respective command
            // object
            var n = this._commands.push({
                // let pennyworth process it, and use the flattened
                // prompts as the alfred prompts
                prompts: this.pennyworth.flatten(
                    this.pennyworth.parse(this.pennyworth.lex(prompt)).map(function (array) {
                        return flatten(array);
                    })
                ),

                raw: prompt,
                handler: handler,
                htype: handler.constructor.name === 'GeneratorFunction' ? 'generator' : 'function',

                // create a new classifier for to identify strictly
                // between the different prompts
                classifier: new natural.BayesClassifier()
            }) - 1;

            // create a list of used stems
            var stemlist = [];
            for (var aPrompt of this._commands[n].prompts) {
                stemlist = stemlist.concat(stemmer.clean(aPrompt));

                // prepare both the inner classifier as well as
                // alfred's general classifier to be prepared for
                // both steps of command execution
                this._commands[n].classifier.addDocument(aPrompt, aPrompt);
            }

            // add cleaned stem list
            this._commands[n].stems = stemlist.map(function (word) {
                return String(word);
            }).filter(function (elm, index, self) {
                return self.indexOf(elm) === index;
            });

            // re-train the alfred classifier and the command's
            // inner classifier
            this._commands[n].classifier.train();
        },

        /**
         * add a transform to the input processing stream
         * @params {Function} transform - a map-stream function to apply.
         */
        use: function (transform) {
            this._tpipe = this._tpipe.pipe(es.map(transform.bind(this)));
        },

        /**
         * pass a string down alfred as output
         * @params {String} output - the output to produce
         */
        say: function (output) {
            this.write('\0' + String(output));
        }
    };

/**
 * THE MODULE.
 * we expose the entire api to be generated per
 * function call to allow for multiple instances of
 * alfred that have no inner relation.
 */
module.exports = function () {
    var stream = es.pause().pipe(es.map(function (data, next) {
        // pause the stream, because we only want to handle
        // one piece of information at a time.
        stream.pause();

        // replace next with a stream resumer as well
        // so we don't forget to resume the stream
        next = (function (then) {
            return function (err, dat) {
                then(err, dat);

                // only resume the stream if
                // the data was not dropped
                if (err || dat) {
                    stream.resume();
                }
            };
        }(next));

        // we only want strings as our data
        data = String(data);

        // ignore data packets that begin with a null byte
        // -> pass it off as output
        if (data[0] === '\0') {
            return next(null, data.substr(1));
        }

        // if input is needed, forward it to the event emitter
        // and drop inside the stream
        if (stream._needsinput) {
            // emit the data
            stream._input.write(data);

            // drop data
            return next();
        }

        if (!stream._needsinput) {
            // using one classifier with all the commands is too
            // slow because of the nature of logistic regression, so
            // we build a new one every time
            var classifier = new natural.LogisticRegressionClassifier(),
                cleanlist = stemmer.clean(data).map(function (word) {
                    return String(word);
                });

            // add only relevant commands
            for (var i = 0; i < stream._commands.length; i += 1) {
                for (let cmdprompt of stream._commands[i].prompts) {
                    if (similar(cmdprompt, data)) {
                        classifier.addDocument(cmdprompt, String(i));
                    }
                }
            }

            // replace classifier with polyfill if empty
            if (classifier.docs.length === 0) {
                classifier = {
                    train: function () {
                        return false;
                    },

                    getClassifications: function () {
                        return [];
                    }
                };
            }

            // train the classifier
            classifier.train();

            // identify the best command handler which will then
            // handle this data packet
            var classifications = classifier.getClassifications(data);

            // add an empty classification in case
            // no commands have been defined yet
            classifications.push({
                label: null,
                value: 0
            });

            classifications.push({
                label: null,
                value: 0
            });

            // grab the appropriate command object
            var command = stream._commands[parseInt(classifications[0].label, 10)];

            // we swap out the command for a default handler if
            // the confidence is low
            if ((classifications[0].value - classifications[1].value) <= 0 || !command) {
                command = {
                    raw: '$input',

                    classifier: {
                        classify: function () {
                            return null;
                        }
                    },

                    handler: function (data) {
                        stream.emit('default', data);
                    }
                };
            }

            // now within the command object, re-classify our input
            // via the inner classifier to get a more appropriate prompt
            // styler
            var prompt = command.classifier.classify(data);

            // pass an object containing relevant data through our
            // transform, and use its final output as our input
            stream._tpipe.once('data', function (transformed) {
                if (command.htype === 'generator') {
                    // grab the handler for the generator
                    var handler = command.handler.call(stream, transformed.data),

                        // fire off the handler to run until it yields a prompt
                        tmp = handler.next();

                    // continue onwards
                    stream._needsinput = true;
                    if (tmp.value) {
                        next(null, tmp.value);
                    } else {
                        next();
                    }

                    // iterate until we can't
                    var iterate = function () {
                        if (!tmp.done) {
                            // get input
                            stream._input.once('data', function (input) {
                                stream._input.pause();

                                // provide input on return
                                tmp = handler.next(input);

                                // use output for alfred
                                if (tmp.value) {
                                    stream.write('\0' + tmp.value);
                                }

                                // and again
                                iterate();
                            });

                            stream._input.resume();
                        } else {
                            stream._needsinput = false;
                        }
                    };

                    iterate();
                } else {
                    // simply execute the function
                    var output = command.handler.call(stream, transformed.data);

                    // use any output as alfred's output
                    if (output) {
                        next(null, output);
                    }

                    // otherwise drop the data
                    else {
                        next();
                    }
                }
            });

            stream._transform.write({
                prompt: prompt,
                raw: command.raw,
                input: data,
                data: {}
            });
        } else {
            // drop anything else
            next();
        }
    }));

    // copy all of alfred's methods onto the stream
    for (var key in alfred) {
        if (alfred.hasOwnProperty(key)) {
            stream[key] = wrap(alfred[key], stream);
        }
    }

    // some needed properties
    stream.pennyworth = require('pennyworth');
    stream._input = es.pause();
    stream._input.pause();
    stream._commands = [];
    stream._needsinput = false;
    stream._transform = es.pause();
    stream._tpipe = stream._transform;

    // built-in filters
    stream._filters = {
        'string': String,
        'float': parseFloat,
        'int': function (data) {
            return parseInt(data, 10);
        }
    };

    // apply all transforms in order
    for (var transform of transforms) {
        stream.use(transform);
    }

    // add all commands
    for (var command in commands) {
        if (commands.hasOwnProperty(command)) {
            stream.add(command, commands[command]);
        }
    }

    // return the final stream
    return stream;
};
