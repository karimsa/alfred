# alfred2 [![Build Status](https://travis-ci.org/karimsa/alfred.svg?branch=master)](https://travis-ci.org/karimsa/alfred)

a natural language interface for programs.

[![NPM](https://nodei.co/npm/alfred2.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/alfred2/)

## Why '2'?

alfred "1" was never actually made public but I used it in [Detective](https://github.com/vvbka/Detective) and a few
other private projects. Afterwards, there were a few features I desperately wanted to add in and since 'alfred' was
already a package on npm, I decided to go with 'alfred2'.

## Usage

This module will expose a function that will create a new alfred stream for usage. The purpose of having a stream is
to realize that alfred itself is simply a middleware between your inputs and your code. Due to this, you must first link
alfred to some output by piping it out and bring in some line of output (from a stream or whatever else you'd like to use).

For the purposes of this README, we will use stdin as alfred's input and stdout as alfred's output. This will create a sort
of REPL with alfred.

***For example:***

```javascript
// create a new alfred instance
const alfred = require ( 'alfred2' )();

// push stdin into alfred
process.stdin.pipe(alfred);

// push alfred into stdout
alfred.pipe(process.stdout);

// what gets written to alfred is the natural
// language input, and what alfred outputs is
// what alfred wants to say
```

### Registering a prompt with alfred

alfred uses [pennyworth](https://github.com/karimsa/pennyworth) as its prompt-handling library. Therefore, please see
the pennyworth docs regarding how to format prompts.

To register the prompt with an action, use `alfred.add()` with either a function or a generator. For instance, to create
a simple hello world prompt that replies with a hello, do:

```javascript
alfred.add('hi, there.', function* () {
    const age = parseInt(yield 'What is your age?' , 10);
});
```

## License

Licensed under GPL-3.0. See [LICENSE](LICENSE).