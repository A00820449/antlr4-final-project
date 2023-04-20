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
     * @type {{[key: string]: (FunInfo|undefined)}}
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
     * @type {{[key: string]: (VarInfo | undefined)}}
     */
    globalVarTable

    /**
     * @type {{[key: string]: (VarInfo | undefined)}}
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
     * @type {{[key: string]: (number|boolean|undefined)}}
     */
    cosntTable

    /**
     * @type {{[key: string]: (string|undefined)}}
     */
    constNumTracker

    /**
     * @type {(VarInfo|null)}
     */
    currAccessVarInfo
    
    /**
     * @type {OperandInfo|null}
     */
    currAccessDim1

    /**
     * @type {OperandInfo|null}
     */
    currAccessDim2

    inError

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

        this.currAccessVarInfo = null
        this.currAccessDim1 = null
        this.currAccessDim2 = null
        this.inError = false
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
            this.inError = true
            throw new SemanticError("vector dimension must be positive", ctx)
        }
        this.currVarType.dim_1 = num
    }

    exitVar_type_dim_2_num(ctx) {
        const num = Math.trunc(parseFloat(ctx.getText()))
        if (num <= 0) {
            this.inError = true
            throw new SemanticError("vector dimension must be positive", ctx)
        }
        this.currVarType.dim_2 = num
    }

    exitVar_id(ctx) {
        const id = ctx.getText()
        if (this.currScope === "$global") {
            if  (this.globalVarTable[id]) {
                this.inError = true
                throw new SemanticError(`duplicate ID '${id}'`, ctx)
            }
            this.globalVarTable[id] = {type: this.currVarType.type, dim_1: this.currVarType.dim_1, dim_2: this.currVarType.dim_2, address: `$g_${this.globalVarNum++}`}
        }
        else {
            if (this.localVarTable[id]) {
                this.inError = true
                throw new SemanticError(`duplicate ID '${id}'`, ctx)
            }
            this.localVarTable[id] = {type: this.currVarType.type, dim_1: this.currVarType.dim_1, dim_2: this.currVarType.dim_2, address: `$l_${this.localVarNum++}`}

        }
    }

    enterVar_access() {
        this.currAccessVarInfo = null
        this.currAccessDim1 = null
        this.currAccessDim2 = null
    }

    exitVar_access(ctx) {
        /*let varDims = 0
        let accessDims = 0

        if (this.currAccessDim1 !== null) {
            accessDims++
        }
        if (this.currAccessDim2 !== null) {
            accessDims++
        }

        if (this.currAccessVarInfo.dim_1 !== null) {
            varDims++
        }
        if (this.currAccessVarInfo.dim_2 !== null) {
            varDims++
        }

        if (varDims > accessDims) {
            this.inError = true
            throw new SemanticError("missing vector dimension(s)", ctx)
        }
        if (varDims < accessDims) {
            this.inError = true
            throw new SemanticError("too many vector dimensions", ctx)
        }*/

        this.operandStack.push({address: this.currAccessVarInfo.address, type: this.currAccessVarInfo.type})

    }

    exitId_access(ctx) {
        /**
         * @type {string}
         */
        const id = ctx.getText()

        const globalVarAcccess = this.globalVarTable[id]
        const localVarAccess = this.localVarTable[id]

        let varInfo
        if (this.currScope === "$global") {
            varInfo = globalVarAcccess
        }
        else {
            if (localVarAccess) {
                varInfo = localVarAccess
            }
            else {
                varInfo = globalVarAcccess
            }
        }

        if (!varInfo) {
            this.inError = true
            throw new SemanticError("variable not defined", ctx)
        }
        this.currAccessVarInfo = {...varInfo}
    }
    exitDim_access_1(ctx) {
        return
        if (this.currAccessVarInfo.dim_1 == null) {
            this.inError = true
            throw new SemanticError("too many vector dimensions", ctx)
        }
        this.currAccessDim1 = this.operandStack.pop() || null
        const q = generateQuadruple("RANG", this.currAccessDim1.address, "0", `${this.currAccessVarInfo.dim_1}`)
        this.quadruples.push(q)
    }
    exitDim_access_2(ctx) {
        return
        if (this.currAccessVarInfo.dim_2 == null) {
            this.inError = true
            throw new SemanticError("too many vector dimensions", ctx)
        }
        this.currAccessDim2 = this.operandStack.pop() || null
        const q = generateQuadruple("RANG", this.currAccessDim2.address, "0", `${this.currAccessVarInfo.dim_2}`)
        this.quadruples.push(q)
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
            this.inError = true
            throw new SemanticError(`duplicate ID '${id}'`, ctx)
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
            this.inError = true
            throw new SemanticError(`duplicate ID '${id}'`, ctx)
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
        this.handleExpQuadrupe(["OR"], ctx)
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

    /* STATEMENTS START */

    exitAssignment(ctx) {
        if (this.inError) {return}

        const opRight = this.operandStack.pop()
        const opLeft = this.operandStack.pop()

        if (opRight?.type !== opLeft?.type) {
            this.inError = true
            throw new SemanticError("type mismatch", ctx)
        }
        const q = generateQuadruple("ASS", opRight?.address, null, opLeft?.address)
        this.quadruples.push(q)

        this.releaseTemp(opLeft.address)
        this.releaseTemp(opRight.address)
    }

    /* STATEMENTS END */

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
            this.inError = true
            throw new ParserError("malformed expression", ctx.start.line, ctx.start.column)
        }

        const resultType = semanticCube[operator]?.[leftOp.type]?.[rightOp.type]

        if (!resultType) {
            this.inError = true
            throw new SemanticError("type mismatch", ctx)
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
            this.inError = true
            throw new ParserError("malformed expression", ctx.start.line, ctx.start.column)
        }

        const resultType = semanticCube[operator]?.[operand.type]

        if (!resultType) {
            this.inError = true
            throw new SemanticError("type mismatch", ctx)
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

export class SemanticError extends Error {

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