import GrammarLexer from "./lib/GrammarLexer.js"
import GrammarParser from "./lib/GrammarParser.js"
import { InputStream, CommonTokenStream } from "antlr4"
import fs from "node:fs"
import Listener, { SemanticError } from "./listener.js"
import ParserErrorListener, { ParserError } from "./error_listener.js"

const filename = process.argv[2] || "input.txt"

const input = fs.readFileSync(filename).toString()

/* VERFIFYING SYNTAX */
const chars = new InputStream(input)
const lexer = new GrammarLexer(chars)
const tokens = new CommonTokenStream(lexer)
const parser = new GrammarParser(tokens)

parser.buildParseTrees = true
parser.removeErrorListeners();
parser.addErrorListener(new ParserErrorListener());

try {
    parser.start()
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
const semanticChars = new InputStream(input)
const semanticLexer = new GrammarLexer(semanticChars)
const semanticTokens = new CommonTokenStream(semanticLexer)
const listener = new Listener()
const semanticParser = new GrammarParser(semanticTokens)

semanticParser.removeErrorListeners()
semanticParser.buildParseTrees = true
semanticParser.addErrorListener(new ParserErrorListener());

semanticParser.addParseListener(listener)

try {
    semanticParser.start()
    console.log(listener.getQuadruples(), listener.getConstTable())
}
catch(e) {
    if (e instanceof SemanticError) {
        console.error(`line ${e.line}:${e.posInLine} ${e.message}`)
    }
    else {
        console.error(e)
    }
    process.exit(1)
}