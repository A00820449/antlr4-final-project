import GrammarListener from "./lib/GrammarListener.js";

/**
 * @typedef {(string|null)[]} Quadruple
 */

export default class Listener extends GrammarListener {
    /**
     * @type {Quadruple[]}
     */
    quadruples
    
    /**
     * 
     * @param {Quadruple[]} q
     */
    constructor(q) {
        super()
        this.quadruples = q
    }
    exitEnd(ctx) {
        console.log("DONE")
    }

    exitExpression(ctx) {
        
    }
}

/** 
 * @param {string} a 
 * @param {string} b 
 * @param {string} c 
 * @param {string} d 
 * @returns {Quadruple}
 */
function generateQuadruple(a, b, c, d) {
    return [a || null, b || null, c || null, d || null]
}