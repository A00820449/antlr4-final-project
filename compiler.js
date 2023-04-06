import GrammarLexer from "./lib/GrammarLexer.js"
import GrammarParser from "./lib/GrammarParser.js"
import antlr4 from "antlr4"
import fs from "node:fs"
import Listener from "./listener.js"

const filename = process.argv[2] || "input.txt"

const input = fs.readFileSync(filename).toString()

const chars = new antlr4.InputStream(input)
const lexer = new GrammarLexer(chars)
const tokens = new antlr4.CommonTokenStream(lexer)
const parser = new GrammarParser(tokens)

parser.buildParseTrees = true
const quadruples = []

const listener = new Listener(quadruples)
parser.addParseListener(listener)

parser.start()