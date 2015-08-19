/**
 * lib/similar.js - athena
 * PorterStemmer-based matching algorithm.
 *
 * Licensed under GPLv3.
 * Copyright (C) 2015 Online Health Database.
 **/

"use strict";

var natural = require('natural');

module.exports = function (stra, strb, getRatio) {
    if (typeof stra === 'string') {
        stra = natural.PorterStemmer.tokenizeAndStem(stra);
    }

    if (typeof strb === 'string') {
        strb = natural.PorterStemmer.tokenizeAndStem(strb);
    }

    //console.log('%j vs. %j', stra, strb);

    var x, y, matches = 0;

    for (x = 0; x < stra.length; x += 1) {
        for (y = 0; y < strb.length; y += 1) {
            if (stra[x] === strb[y]) {
                matches += 1;
            }
        }
    }

    var ln = Math.min(stra.length, strb.length),
        ratio = matches / ln;

    //if (ln === 2 && ratio === 0.5) ratio -= 0.25;
    if (ln === 1) ratio = +(stra === strb);

    return getRatio === true ? ratio : (ratio >= 0.5);
};
