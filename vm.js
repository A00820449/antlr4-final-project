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
function isLocal(addr) {
    return addr.charAt(1) === 'l'
}

/**
 * @param {string} addr 
 */
function isAddress(addr) {
    return addr.charAt(0) === '$'
}

/**
 * @param {string} addr 
 */
function isPointer(addr) {
    return addr.charAt(1) === "$"
}

/**
 * @param {string} addr 
 */
function getLocalMemory(addr) {
    const mem = memStack.peek()
    if (!mem) {
        throw new Error("stack error")
    }
    return mem[addr]
}

/**
 * @param {string} pointer 
 */
function getMemoryFromPointer(pointer) {
    const addr = globalMemory[pointer]
    if (typeof addr !== "string" || (typeof addr === "string" && isAddress(addr))) {
        throw new Error("invalid address")
    }
    if (isLocal(addr)) {
        return getLocalMemory(addr)
    }
    return globalMemory[addr]
}

/**
 * @param {string} addr
 */
function getMemory(addr) {
    if (!isAddress(addr)) {
        const num = parseInt(addr)
        if (isNaN(num)) {
            throw new Error("invalid address")
        }
        return num
    }

    if (isPointer(addr)) {
        return getMemoryFromPointer(addr)
    }

    if (isLocal(addr)) {
        return getLocalMemory(addr)
    }

    return globalMemory[addr]
}

/**
 * @param {string} addr 
 */
function getMemorySafe(addr) {
    const output = getMemory(addr)
    if (output === undefined || output === null) {
        throw new Error("uninitialized memory")
    }
    return output
}

/**
 * @param {string} addr 
 * @param {(string|number|boolean)} val
 */
function writeLocalMemory(addr, val) {
    const mem = memStack.peek()
    if (!mem) {
        throw new Error("stack error")
    }
    return mem[addr] = val
}

/**
 * @param {string} pointer 
 * @param {(string|number|boolean)} val
 */
function writeMemoryFromPointer(pointer, val) {
    const addr =  globalMemory[pointer]
    if (typeof addr !== "string" || (typeof addr === "string" && isAddress(addr))) {
        throw new Error("invalid address")
    }
    if (isLocal(addr)) {
        return writeLocalMemory(addr, val)
    }
    return globalMemory[addr] = val
}

/**
 * @param {string} addr 
 * @param {(string|number|boolean)} val
 */
function writeMemory(addr, val) {
    if (!isAddress(addr)) {
        throw new Error("memory fault")
    }

    if (isPointer(addr)) {
        return writeMemoryFromPointer(addr, val)
    }

    if (isLocal(addr)) {
        return writeLocalMemory(addr, val)
    }

    return globalMemory[addr] = val
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
    if (output === undefined || output === null) {
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
    "NOT": function (q) {
        const op_1 = getMemorySafe(q[1])

        const result = !op_1
        writeMemorySafe(q[3], result)
    },
    "NEG": function (q) {
        const op_1 = getMemorySafe(q[1])

        const result = -op_1
        writeMemorySafe(q[3], result)
    },
    "ASS": function (q) {
        const op_1 = getMemorySafe(q[1])
        writeMemorySafe(q[3], op_1)
    },
    "PRNT": function (q) {
        const op_1 = getMemorySafe(q[1])
        process.stdout.write(`${op_1}`)
    },
    "GOTO": function (q) {
        pointer = getMemorySafe(q[3]) - 1
    },
    "GOTF": function (q) {
        const goto = getMemorySafe(q[3])
        const bool = getMemorySafe(q[1])
        if (!bool) {
            pointer = goto - 1
        }
    },
    "GOTT": function (q) {
        const goto = getMemorySafe(q[3])
        const bool = getMemorySafe(q[1])
        if (bool) {
            pointer = goto - 1
        }
    },
    "END": function (q) {
        const op_1 = getMemorySafe(q[3])
        let output = 0
        if (typeof op_1 === "boolean") {
            output = op_1 ? 0 : 1
        }
        else if (typeof op_1 === "string") {
            output = Math.trunc(parseFloat(op_1))
            if (isNaN(output)) {
                output = 1
            }
        }
        else {
            output = op_1
        }
        process.exit(output)
    }
}

//console.log(input)
const quadruples = input.quadruples


for (pointer = 0; pointer < quadruples.length; pointer++) {
    const q = quadruples[pointer]
    //console.log(quadruples[pointer][0])
    try {
        const instruction = instructions[q[0]||"."]
        if (!instruction) {
            throw new Error("invalid instruction")
        }
        instruction(q)
    }
    catch(e){
        if (e instanceof Error) {
            console.log(e)
        }
        else {
            console.log(e)
        }
        process.exit(1)
    }
}