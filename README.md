# alfred v2

a natural language interface for programs.

## usage

```
// create a new alfred instance
var alfred = require ( 'alfred' )();

// use it like a stream
process.stdin.pipe(alfred);
alfred.pipe(process.stdout);

// what gets written to alfred is the natural
// language input, and what alfred outputs is
// what alfred wants to say
```

## license

GPLv3.