/**
 * lib/similar.js - alfred2
 * PorterStemmer-based matching algorithm.
 * 
 * Licensed under GPL-3.0.
 * Copyright (C) 2015 Karim Alibhai.
 **/

'use strict';

var natural = require('natural');

module.exports = function (stra, strb, getRatio) {
    if (typeof stra === 'string') {
        stra = natural.PorterStemmer.tokenizeAndStem(stra);
    }

    if (typeof strb === 'string') {
        strb = natural.PorterStemmer.tokenizeAndStem(strb);
    }

    var x, y, matches = 0, target = 0.5 * stra.length;

    for (x = 0; x < stra.length; x += 1) {
        for (y = 0; y < strb.length; y += 1) {
            if (stra[x] === strb[y]) {
                matches += 1;
                
                if (matches >= target) return getRatio ? (matches / stra.length) : true;
            }
        }
    }

    return false;
};
