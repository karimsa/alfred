/**
 * lib/similar.js - alfred2
 * PorterStemmer-based matching algorithm.
 * 
 * Licensed under GPL-3.0.
 * Copyright (C) 2015 Karim Alibhai.
 **/

'use strict';

var natural = require('natural');

module.exports = function (stra, strb) {
    if (typeof stra === 'string') {
        stra = natural.PorterStemmer.tokenizeAndStem(stra);
    }

    if (typeof strb === 'string') {
        strb = natural.PorterStemmer.tokenizeAndStem(strb);
    }

    var x, y, intersection = 0;

    for (x = 0; x < stra.length; x += 1) {
        for (y = 0; y < strb.length; y += 1) {
            if (stra[x] === strb[y]) {
                intersection += 1;
            }
        }
    }

    return (intersection / (stra.length + strb.length - intersection)) >= 0.5;
};
