import { ErrorListener } from "antlr4";

export default class ParserErrorListener extends ErrorListener {
    syntaxError(recognizer, offendingSymbol, line, column, msg, err) {
        throw new ParserError(msg, line, column)
    }
}

export class ParserError extends Error {

    line
    posInLine

    /**
     * @param {string} message 
     * @param {number} line 
     * @param {number} posInLine 
     */
    constructor(message, line, posInLine) {
        super(message)
        this.line = line
        this.posInLine = posInLine
    }
}