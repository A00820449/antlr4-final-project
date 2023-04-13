import GrammarLexer from "./lib/GrammarLexer.js"
import GrammarParser from "./lib/GrammarParser.js"
import antlr4 from "antlr4"
import fs from "node:fs"
import Listener, { SemanicError } from "./listener.js"
import ParserErrorListener, { ParserError } from "./error_listener.js"

const filename = process.argv[2] || "input.txt"

const input = fs.readFileSync(filename).toString()

const chars = new antlr4.InputStream(input)
const lexer = new GrammarLexer(chars)
const tokens = new antlr4.CommonTokenStream(lexer)
const parser = new GrammarParser(tokens)

parser.buildParseTrees = true
//parser._errHandler = new antlr4.error.BailErrorStrategy() /* Aborts parsing when an error is encountered */
parser.removeErrorListeners();
parser.addErrorListener(new ParserErrorListener());

const listener = new Listener()
parser.addParseListener(listener)

try {
    parser.start()
    console.log(listener.getQuadruples())
}
catch(e) {
    if (e instanceof SemanicError || e instanceof ParserError) {
        console.error(`line ${e.line}:${e.posInLine} ${e.message}`)
    }
    else {
        console.error(e)
    }
}