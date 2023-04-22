import GrammarLexer from "./lib/GrammarLexer.js"
import GrammarParser from "./lib/GrammarParser.js"
import { InputStream, CommonTokenStream, ParseTreeWalker } from "antlr4"
import fs from "node:fs"
import Listener, { SemanticError } from "./listener.js"
import ParserErrorListener, { ParserError } from "./error_listener.js"

const filename = process.argv[2] || "input.txt"

let input
try {
    input = fs.readFileSync(filename)?.toString()
}
catch (e) {
    if (e instanceof Error) {
        console.error(e.message)
    }
    else {
        console.error(e)
    }
    process.exit(1)
}

/* VERFIFYING SYNTAX */
const chars = new InputStream(input||"")
const lexer = new GrammarLexer(chars)
const tokens = new CommonTokenStream(lexer)
const parser = new GrammarParser(tokens)

parser.buildParseTrees = true
parser.removeErrorListeners();
parser.addErrorListener(new ParserErrorListener());

let tree
try {
    tree = parser.start()
}
catch(e) {
    if (e instanceof ParserError) {
        console.error(`line ${e.line}:${e.posInLine} ${e.message}`)
    }
    else {
        console.error(e)
    }
    process.exit(1)
}

/* VERIFYING SEMANTICS */

const walker = new ParseTreeWalker()
const listener = new Listener()

try {
    walker.walk(listener, tree)
    console.log(listener.getQuadruples(), listener.getConstTable())
}
catch(e) {
    if (e instanceof SemanticError || e instanceof ParserError) {
        console.error(`line ${e.line}:${e.posInLine} ${e.message}`)
    }
    else {
        console.error(e)
    }
    process.exit(1)
}