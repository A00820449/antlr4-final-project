import { ParserRuleContext } from "antlr4";
import GrammarListener from "./lib/GrammarListener.js";
import Stack from "./stack.js";
import semanticCube from "./semantic_cube.js";
import { ParserError } from "./error_listener.js";

/**
 * @typedef {(string|null)[]} Quadruple
 */

/**
 * @typedef {{
 *      type: ("number" | "boolean" | "void" | null),
 *      params: (ParamsList | null)
 * }} FunInfo
 */

/**
 * @typedef {{
*      type: ("number" | "boolean"),
*      dim_1: number | null,
*      dim_2: number | null,
*      address: string
* }} VarInfo
*/

/**
 * @typedef {("number" | "boolean")[]} ParamsList
*/

/**
 * @typedef {{type: ("number" | "boolean", address: string)}} OperandInfo
 */

const operatorDictionary = {
    "+": "ADD",
    "-": "SUB",
    "*": "MUL",
    "/": "DIV",
    "%": "MOD",
    "==": "EQ",
    "!=": "NE",
    ">": "GT",
    ">=": "GE",
    "<": "LT",
    "<=": "LE",
    "|": "OR",
    "&": "AND"
}

const unaryDictionary = {
    "-": "NEG",
    "!": "NOT"
}

export default class Listener extends GrammarListener {
    /**
     * @type {Quadruple[]}
     */
    quadruples

    /**
     * @type {{[key: string]: FunInfo}}
     */
    funTable

    /**
     * @type {number}
     */
    globalVarNum

    /**
     * @type {number}
     */
    localVarNum

    /**
     * @type {number}
     */
    tempVarNum

    /**
     * @type {{
     *  type: ("number" | "boolean" | null), 
     *  dim_1: number|null, 
     *  dim_2: number|null
     * }}
     */
    currVarType

    /**
     * @type {("number" | "boolean" | "void")}
     */
    currFunType

    /**
     * @type {string}
     */
    currScope
    
    /**
     * @type {ParamsList|null}
     */
    currParamsList

    /**
     * @type {{[key: string]: VarInfo}}
     */
    globalVarTable

    /**
     * @type {{[key: string]: VarInfo}}
     */
    localVarTable

    /**
     * @type {string | null}
     */
    progName

    /**
     * @type {Stack<OperandInfo>}
     */
    operandStack

    /**
     * @type {Stack<string>}
     */
    operatorStack
    
    /**
     * @type {Stack<string>}
     */
    tempVarQueue
    
    /**
     * @type {number}
     */
    constNum

    /**
     * @type {{[key: string]: (number|boolean)}}
     */
    cosntTable

    /**
     * @type {{[key: string]: (string|undefined)}}
     */
    constNumTracker

    /**
     * 
     * @param {Quadruple[]?} q
     */
    constructor(q) {
        super()
        this.quadruples = q || []
        this.funTable = {}
        this.currVarType = {type: null, dim_1: null, dim_2: null}
        this.currScope = "$global"
        this.globalVarTable = {}
        this.localVarTable = {}
        this.currParamsList = []
        this.currFunType = "void"
        this.progName = null
        this.globalVarNum = 0
        this.localVarNum = 0
        this.tempVarNum = 0
        this.operatorStack = new Stack()
        this.operandStack = new Stack()
        this.tempVarQueue = new Stack()

        this.constNum = 0
        this.constNumTracker = {}
        this.cosntTable = {"$c_f": false, "$c_t": true}
    }

    getQuadruples() {
        return this.quadruples
    }

    getConstTable() {
        return this.cosntTable
    }

    exitProgram_name(ctx) {
        this.progName = ctx.getText()
    }

    /**VARS START */

    enterVar_decl(ctx) {
        this.currVarType.dim_1 = null
        this.currVarType.dim_2 = null
    }

    exitVar_basic_type(ctx) {
        this.currVarType.type = ctx.getText()
    }

    exitVar_type_dim_1_num(ctx) {
        const num = Math.trunc(parseFloat(ctx.getText()))
        if (num <= 0) {
            throw new SemanicError("vector dimension must be positive", ctx)
        }
        this.currVarType.dim_1 = num
    }

    exitVar_type_dim_2_num(ctx) {
        const num = Math.trunc(parseFloat(ctx.getText()))
        if (num <= 0) {
            throw new SemanicError("vector dimension must be positive", ctx)
        }
        this.currVarType.dim_2 = num
    }

    exitVar_id(ctx) {
        const id = ctx.getText()
        if (this.currScope === "$global") {
            if  (this.globalVarTable[id]) {
                throw new SemanicError(`duplicate ID '${id}'`, ctx)
            }
            this.globalVarTable[id] = {type: this.currVarType.type, dim_1: this.currVarType.dim_1, dim_2: this.currVarType.dim_2, address: `$g_${this.globalVarNum++}`}
        }
        else {
            if (this.localVarTable[id]) {
                throw new SemanicError(`duplicate ID '${id}'`, ctx)
            }
            this.localVarTable[id] = {type: this.currVarType.type, dim_1: this.currVarType.dim_1, dim_2: this.currVarType.dim_2, address: `$l_${this.localVarNum++}`}

        }
    }
    
    exitFunctions() {
        this.currScope = "$global"
    }

    /**VARS END */

    /** FUN STARTS */

    enterFunction_decl() {
        this.currParamsList = []
        this.localVarTable = {}
        this.currFunType = "void"
        this.localVarNum = 0
    }
    exitFunction_decl() {
        console.log("LOCAL VARS", this.localVarTable)
    }

    exitFun_type(ctx) {
        this.currFunType = ctx.getText()
    }

    exitFun_id(ctx) {
        const id = ctx.getText()
        if (this.funTable[id]) {
            throw new SemanicError(`Duplicate ID '${id}'`, ctx)
        }
        this.funTable[id] = {type: this.currFunType, params: null}
        this.currScope = id
    }

    exitParam_type(ctx) {
        this.currVarType = {type: ctx.getText(), dim_1: null, dim_2: null}
    }
    exitParam_id(ctx) {
        const id = ctx.getText()
        if (this.localVarTable[id]) {
            throw new SemanicError(`Duplicate ID '${id}'`, ctx)
        }

        this.localVarTable[id] = {...(this.currVarType), address: `$l_${this.localVarNum++}`}
        this.currParamsList?.push(this.currVarType.type || "number")
    }
    exitParams_done() {
        this.funTable[this.currScope].params = this.currParamsList.slice()
    }

    /** FUN ENDS */

    exitEnd(ctx) {
        console.log("PROGRAM:", this.progName, "GLOBAL FUNS:", this.funTable, "GLOBAL VARS:", this.globalVarTable)
        console.log(this.operandStack)
        console.log("DONE")
    }

    /** EXPRESSIONS **/

    exitLiteral_num(ctx) {
        const numStr = ctx.getText()
        const existing = this.constNumTracker[numStr]
        if (existing) {
            return this.operandStack.push({address: existing, type: "number"})
        }
        const numVal = parseFloat(numStr)
        const address = `$c_${this.constNum++}`
        this.constNumTracker[numStr] = address
        this.cosntTable[address] = numVal
        this.operandStack.push({address: address, type: "number"})
    }
    
    exitLiteral_bool(ctx) {
        if (ctx.getText() === "true") {
            return this.operandStack.push({address: "$c_t", type: "boolean"})
        }
        this.operandStack.push({address: "$c_f", type: "boolean"})
    }

    exitConjunction(ctx) {
        this.handleExpQuadrupe(["AND"], ctx)
    }

    exitRelation(ctx) {
        this.handleExpQuadrupe(["OR"])
    }

    exitAddition(ctx) {
        this.handleExpQuadrupe(["EQ", "NE", "GT", "GE", "LT", "LE"], ctx)
    }

    exitTerm(ctx) {
        this.handleExpQuadrupe(["ADD", "SUB"], ctx)
    }

    exitFactor(ctx) {
        this.handleExpQuadrupe(["MUL", "DIV", "MOD"], ctx)
    }

    exitNegation(ctx) {
        this.handleUnaryQuadruple(["NEG", "NOT"], ctx)
    }

    exitConjuction_op(ctx) {
        this.operatorStack.push(operatorDictionary[ctx.getText()])
    }

    exitRelation_op(ctx) {
        this.operatorStack.push(operatorDictionary[ctx.getText()])
    }

    exitAddition_op(ctx) {
        this.operatorStack.push(operatorDictionary[ctx.getText()])
    }

    exitTerm_op(ctx) {
        this.operatorStack.push(operatorDictionary[ctx.getText()])
    }

    exitFactor_op(ctx) {
        this.operatorStack.push(operatorDictionary[ctx.getText()])
    }

    exitNegation_op(ctx) {
        this.operatorStack.push(unaryDictionary[ctx.getText()])
    }

    enterParen_exp(ctx) {
        this.operatorStack.push("")
    }

    exitParen_exp(ctx) {
        this.operatorStack.pop()
    }

    /**
     * @param {string} addr 
     */
    releaseTemp(addr) {
        if (addr.charAt(1) !== "t") {return}

        this.tempVarQueue.push(addr)
    }
    getTemp() {
        if (this.tempVarQueue.isEmpty()) {
            return `$t_${this.tempVarNum++}`
        }
        return this.tempVarQueue.pop()
    }

    /**
     * @param {string[]} opArr 
     * @param {ParserRuleContext} ctx
     */
    handleExpQuadrupe(opArr, ctx) {
        if (!opArr.includes(this.operatorStack.peek())) {
            return
        }

        const rightOp = this.operandStack.pop()
        const leftOp = this.operandStack.pop()
        const operator = this.operatorStack.pop()

        if (!rightOp || !leftOp || !operator) {
            throw new ParserError("malformed expression", ctx.start.line, ctx.start.column)
        }

        const resultType = semanticCube[operator]?.[leftOp.type]?.[rightOp.type]

        if (!resultType) {
            throw new SemanicError("type mismatch", ctx)
        }

        const tempAddr = this.getTemp()
        const quad = generateQuadruple(operator, leftOp.address, rightOp.address, tempAddr)
        
        this.quadruples.push(quad)

        this.operandStack.push({address: tempAddr, type: resultType})

        this.releaseTemp(rightOp.address)
        this.releaseTemp(leftOp.address)

    }

    /**
     * 
     * @param {string[]} opArr 
     * @param {ParserRuleContext} ctx 
     */
    handleUnaryQuadruple(opArr, ctx) {
        if (!opArr.includes(this.operatorStack.peek())) {
            return
        }

        const operand = this.operandStack.pop()
        const operator = this.operatorStack.pop()

        if (!operand || !operator) {
            throw new ParserError("malformed expression", ctx.start.line, ctx.start.column)
        }

        const resultType = semanticCube[operator]?.[operand.type]

        if (!resultType) {
            console.log(operand, operator)
            throw new SemanicError("type mismatch", ctx)
        }

        const tempAddr = this.getTemp()
        const quad = generateQuadruple(operator, operand.address, null, tempAddr)
        
        this.quadruples.push(quad)

        this.operandStack.push({address: tempAddr, type: resultType})

        this.releaseTemp(operand.address)
    }
}

/** 
 * @param {string} a 
 * @param {string} b 
 * @param {string} c 
 * @param {string} d 
 * @returns {Quadruple}
 */
export function generateQuadruple(a, b, c, d) {
    return [a || null, b || null, c || null, d || null]
}

export class SemanicError extends Error {

    /**
     * @type {number}
     */
    line

    /**
     * @type {number}
     */
    posInLine

    /**
     * 
     * @param {string} message 
     * @param {ParserRuleContext} ctx
     */
    constructor(message, ctx) {
        super(message)
        this.line = ctx.start.line
        this.posInLine = ctx.start.column
    }
}