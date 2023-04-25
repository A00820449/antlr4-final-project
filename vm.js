import { readFileSync } from "node:fs"
import { inputSchema } from "./schema.js"
import Stack from "./stack.js"

const inputFilename = process.argv[2] || 'index.obj'

let fileBuffer
try {
    fileBuffer = readFileSync(inputFilename)
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

let input
try {
    input = inputSchema.parse(JSON.parse(fileBuffer.toString()))
}
catch (e) {
    console.error("Invalid input file.")
    process.exit(1)
}


/**
 * @typedef {Record<string, (boolean|number|string)>} Memory
 */


let pointer = 0

/**
 * @type {Stack<Memory>}
 */
const memStack = new Stack()

/**
 * @type {Memory}
 */
const globalMemory = {}

Object.assign(globalMemory, input.constTable)

/**
 * @param {string} addr
 */
function getMemory(addr) {
    if (addr.charAt(0) !== "$") {
        return parseInt(addr)
    }

    if (addr.charAt(1) === "$") {
        /* POINTERS */
    }


    if (addr.charAt(1) === "l") {
        return memStack.peek()?.[addr]
    }

    return globalMemory[addr]
}

/**
 * @param {string} addr 
 */
function getMemorySafe(addr) {
    const output = getMemory(addr)
    if (output == undefined) {
        throw new Error("uninitialized memory")
    }
    return output
}

/**
 * @param {string} addr 
 * @param {(string|number|boolean)} val
 */
function writeMemory(addr, val) {
    if (addr.charAt(0) === "$") {
        if (addr.charAt(1) === "l") {
            const mem = memStack.peek()
            return mem[addr] = val
        }
        return globalMemory[addr] = val
    }
    throw new Error("memory fault")
}

/**
 * @param {string} addr 
 * @param {any} val
 */
function writeMemorySafe(addr, val) {
    if (typeof val !== "boolean" && typeof val !== "string" && typeof val !== "number") {
        throw new Error("memory fault")
    }

    const output = writeMemory(addr, val)
    if (output == undefined) {
        throw new Error("memory fault")
    }
    return output
}

/**
 * @typedef {(q: import("./schema.js").Quadruple) => any} InstructionFunction
 */

/**
 * @type {Record<string, InstructionFunction>}
 */
const instructions = {
    "ADD": function (q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = op_1 + op_2
        writeMemorySafe(q[3], result)
        
    },
    "SUB": function (q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = op_1 - op_2
        writeMemorySafe(q[3], result)
    },
    "MUL": function (q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = op_1 * op_2
        writeMemorySafe(q[3], result)
    },
    "DIV": function (q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = op_1 / op_2
        writeMemorySafe(q[3], result)
    },
    "MOD": function (q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = op_1 % op_2
        writeMemorySafe(q[3], result)
    },
    "EQ": function (q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = op_1 === op_2
        writeMemorySafe(q[3], result)
    },
    "NE": function (q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = op_1 !== op_2
        writeMemorySafe(q[3], result)
    },
    "GT": function (q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = op_1 > op_2
        writeMemorySafe(q[3], result)
    },
    "GE": function (q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = op_1 >= op_2
        writeMemorySafe(q[3], result)
    },
    "LT": function (q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = op_1 < op_2
        writeMemorySafe(q[3], result)
    },
    "LE": function (q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = op_1 <= op_2
        writeMemorySafe(q[3], result)
    },
    "AND": function (q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = op_1 && op_2
        writeMemorySafe(q[3], result)
    },
    "OR": function (q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = op_1 || op_2
        writeMemorySafe(q[3], result)
    },
    "GOTO": function (q) {
        pointer = getMemorySafe(q[3]) - 1
    }
}

console.log(input)
const quadruples = input.quadruples


for (pointer = 0; pointer < quadruples.length; pointer++) {
    console.log(quadruples[pointer][0])
}