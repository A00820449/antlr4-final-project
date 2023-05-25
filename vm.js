import { readFileSync } from "node:fs"
import { inputSchema } from "./schema.js"
import Stack from "./stack.js"
import { getInputFuntion } from "./input.js"

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

let fileInput
try {
    fileInput = inputSchema.parse(JSON.parse(fileBuffer.toString()))
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
 * @type {Stack<number>}
 */
const pointerStack = new Stack()

/**
 * @type {Memory}
 */
const globalMemory = {}

Object.assign(globalMemory, fileInput.constTable)

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
function isLocalPointer(addr) {
    return addr.charAt(1) === "l" && addr.charAt(2) === "$"
}

/**
 * @param {string} addr 
 */
function getLocalMemory(addr) {
    const mem = memStack.peek()
    if (!mem) {
        throw new Error("stack error")
    }

    if (isLocalPointer(addr)) {
        return getLocalMemoryFromPointer(addr)
    }

    return mem[addr]
}

/**
 * @param {string} pointer 
 */
function getLocalMemoryFromPointer(pointer) {
    const mem = memStack.peek()
    if (!mem) {
        throw new Error("stack error")
    }

    const addr = mem[pointer]
    if (typeof addr !== "string" || (typeof addr === "string" && !isAddress(addr))) {
        throw new Error("invalid address")
    }

    if (isLocal(addr)) {
        return mem[addr]
    }

    return globalMemory[addr]
}


/**
 * @param {string} pointer 
 */
function getMemoryFromPointer(pointer) {
    const addr = globalMemory[pointer]
    if (typeof addr !== "string" || (typeof addr === "string" && !isAddress(addr))) {
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

    if (isLocalPointer(addr)) {
        const pointed = mem[addr]
        if (typeof pointed !== "string" || !isAddress(pointed)) {
            throw new Error("invalid pointed address")
        }
        if (isLocal(pointed)) {
            return mem[pointed] = val
        }
        return globalMemory[pointed] = val
    }
    return mem[addr] = val
}

/**
 * @param {string} addr 
 * @param {(string|number|boolean)} val
 */
function writeMemory(addr, val) {
    if (!isAddress(addr)) {
        throw new Error("memory fault")
    }

    if (isLocal(addr)) {
        return writeLocalMemory(addr, val)
    }

    if (isPointer(addr)) {
        const pointed = globalMemory[addr]
        if (typeof pointed !== "string" || !isAddress(pointed)) {
            throw new Error("invalid pointed address")
        }
        if (isLocal(pointed)) {
            return writeLocalMemory(pointed, val)
        }
        return globalMemory[pointed] = val
    }

    return globalMemory[addr] = val
}

const input = await getInputFuntion(process.stdin, process.stdout)

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

let exitCode = 0

/**
 * @typedef {(q: import("./schema.js").Quadruple) => any | (q: import("./schema.js").Quadruple) => Promise<any>} InstructionFunction
 */

/**
 * @type {Record<string, InstructionFunction | undefined>}
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

        if (op_2 === 0) {
            throw new Error("cannot divide by zero")
        }

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
    "READ": async function (q) {
        const user_input = await input();
        const val = parseFloat(user_input)
        if (isNaN(val)) {
            throw new Error("invalid user input")
        }
        writeMemorySafe(q[1], val)
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
    "CALL": function (q) {
        const goto = getMemorySafe(q[3])

        memStack.push({})
        pointerStack.push(pointer)

        pointer = goto - 1;

    },
    "RTRN": function (q) {
        const returnPointer = pointerStack.pop() || 0
        memStack.pop()

        pointer = returnPointer
    }
    ,
    "END": function (q) {
        const op_1 = getMemorySafe(q[3])
        exitCode = 0
        if (typeof op_1 === "boolean") {
            exitCode = op_1 ? 1 : 0
        }
        else if (typeof op_1 === "string") {
            exitCode = Math.trunc(parseFloat(op_1))
            if (isNaN(exitCode)) {
                exitCode = 1
            }
        }
        else {
            exitCode = op_1
        }
        pointer = quadruples.length
    },
    "ADDP": function(q) {
        const op_1 = q[1] || ""
        const op_2 = getMemorySafe(q[2])

        if (typeof op_2 !== "number") {
            throw new Error("ADDP: can only add a number")
        }

        const match = op_1.match(/^(\$[a-zA-Z$]*)_([0-9]+)$/)
        
        if (!match) {
            throw new Error("ADDP: invalid address")
        }

        const prefix = match[1]
        const num = parseInt(match[2])

        const result = `${prefix}_${num + op_2}`

        const pointerAddr = q[3]

        if (typeof pointerAddr !== "string" || !isAddress(pointerAddr) || (!isPointer(pointerAddr) && !isLocalPointer(pointerAddr))){
            throw new Error("ADDP: target has to be a pointer")
        }

        if (isLocal(pointerAddr)) {
            const mem = memStack.peek()

            if (!mem) {
                throw new Error("stack error")
            }

            mem[pointerAddr] = result
        }
        else {
            globalMemory[pointerAddr] = result
        }
    },
    "RANG": function(q) {
        const op = getMemorySafe(q[1])
        const lower = getMemorySafe(q[2])
        const upper = getMemorySafe(q[3])

        if (op < lower || op >= upper) {
            throw new Error("index out of bounds")
        }
    },
    "TRUN": function(q) {
        const op_1 = getMemorySafe(q[1])

        const result = Math.trunc(op_1)
        writeMemorySafe(q[3], result)
    },
    "ROUN": function(q) {
        const op_1 = getMemorySafe(q[1])

        const result = Math.round(op_1)
        writeMemorySafe(q[3], result)
    },
    "FLOO": function(q) {
        const op_1 = getMemorySafe(q[1])

        const result = Math.floor(op_1)
        writeMemorySafe(q[3], result)
    },
    "CEIL": function(q) {
        const op_1 = getMemorySafe(q[1])

        const result = Math.ceil(op_1)
        writeMemorySafe(q[3], result)
    },
    "ISIN": function(q) {
        const op_1 = getMemorySafe(q[1])

        const result = Number.isInteger(op_1)
        writeMemorySafe(q[3], result)
    },
    "POW": function(q) {
        const op_1 = getMemorySafe(q[1])
        const op_2 = getMemorySafe(q[2])

        const result = Math.pow(op_1, op_2)
        writeMemorySafe(q[3], result)
    },
    "SIN": function(q) {
        const op_1 = getMemorySafe(q[1])

        const result = Math.sin(op_1)
        writeMemorySafe(q[3], result)
    },
    "COS": function(q) {
        const op_1 = getMemorySafe(q[1])

        const result = Math.cos(op_1)
        writeMemorySafe(q[3], result)
    },
    "TAN": function(q) {
        const op_1 = getMemorySafe(q[1])

        const result = Math.tan(op_1)
        writeMemorySafe(q[3], result)
    },
    "ASIN": function(q) {
        const op_1 = getMemorySafe(q[1])

        const result = Math.asin(op_1)

        if (isNaN(result)) {
            throw Error("invalid asin input")
        }

        writeMemorySafe(q[3], result)
    },
    "ACOS": function(q) {
        const op_1 = getMemorySafe(q[1])

        const result = Math.acos(op_1)

        if (isNaN(result)) {
            throw Error("invalid acos input")
        }

        writeMemorySafe(q[3], result)
    },
    "ATAN": function(q) {
        const op_1 = getMemorySafe(q[1])

        const result = Math.atan(op_1)

        if (isNaN(result)) {
            throw Error("invalid atan input")
        }

        writeMemorySafe(q[3], result)
    },
}

//console.log(input)
const quadruples = fileInput.quadruples

for (pointer = 0; pointer < quadruples.length; pointer++) {
    const q = quadruples[pointer]
    //console.log(quadruples[pointer][0])
    try {
        const instruction = instructions[q[0]||"."]
        if (!instruction) {
            throw new Error("invalid instruction")
        }
        await instruction(q)
    }
    catch(e){
        if (e instanceof Error) {
            console.log(e.message)
        }
        else {
            console.log(e)
        }
        console.log(globalMemory)
        process.exit(1)
    }
}
//console.log(globalMemory)
process.exit(exitCode)