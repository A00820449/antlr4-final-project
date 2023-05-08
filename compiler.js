import GrammarLexer from "./lib/GrammarLexer.js"
import GrammarParser from "./lib/GrammarParser.js"
import { InputStream, CommonTokenStream, ParseTreeWalker } from "antlr4"
import fs from "node:fs"
import Listener, { SemanticError } from "./listener.js"
import ParserErrorListener, { ParserError } from "./error_listener.js"
import { inputSchema } from "./schema.js"

const filename = process.argv[2] || "input.txt"

const outputfilename = process.argv[3] || "index.obj"

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

    const quadruples = listener.getQuadruples()
    const constTable = listener.getConstTable()

    quadruples.forEach((v, i) => console.log(i, v))
    console.log(constTable)

    const output = inputSchema.parse({quadruples, constTable})

    fs.writeFileSync(outputfilename, JSON.stringify(output, null, 4))
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