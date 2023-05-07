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
 *      params: (ParamsList | null),
 *      start: number
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
    constTable

    /**
     * @type {{[key: string]: (string|undefined)}}
     */
    constNumTracker

    /**
     * @type {{[key: string]: (string|undefined)}}
     */
    constStrTracker

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

    /**
     * @type {Stack<number>}
     */
    jumpStack
    
    /**
     * @type {boolean}
     */
    inError

    /**
     * @type {FunInfo|null}
     */
    currFunCallInfo

    /**
     * @type {number}
     */
    currFunCallParamNum

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

        this.constNum = 2
        this.constNumTracker = {"0": "$c_0"}
        this.constStrTracker = {"\n": "$c_1"}
        this.constTable = {"$c_f": false, "$c_t": true, "$c_0": 0, "$c_1": "\n"}

        this.currAccessVarInfo = null
        this.currAccessDim1 = null
        this.currAccessDim2 = null
        this.inError = false

        this.jumpStack = new Stack()

        this.currFunCallInfo = null
        this.currFunCallParamNum = 0
    }

    getQuadruples() {
        return this.quadruples
    }

    getConstTable() {
        return this.constTable
    }

    exitProgram_name(ctx) {
        this.progName = ctx.getText()
    }

    exitGlobal_vars() {
        this.jumpStack.push(this.quadruples.length)
        this.quadruples.push(generateQuadruple("GOTO", null, null, null))
    }

    exitProgram() {
        this.quadruples.push(generateQuadruple("END", null, null, "$c_0"))
        console.log( {FUN: this.funTable, VARS: this.globalVarTable})
        console.log("OPERANDS", this.operandStack)
    }

    enterMain() {
        this.currScope = "$global"

        const gotoIndex = this.jumpStack.pop()

        this.fillGoto(gotoIndex, this.quadruples.length)
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

    exitNon_dim_access(ctx) {
        if (this.currAccessVarInfo.dim_1) {
            this.inError = true
            throw new SemanticError("missing vector dimension(s)", ctx)
        }

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
            throw new SemanticError(`variable not defined '${id}'`, ctx)
        }
        this.currAccessVarInfo = {...varInfo}
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
        let returnVal = null
        if (this.currFunType === "boolean") {
            returnVal = "$c_f"
            this.quadruples.push(generateQuadruple("ASS", returnVal, null, "$r"))
        }
        else if (this.currFunType === "number") {
            returnVal = "$c_0"
            this.quadruples.push(generateQuadruple("ASS", returnVal, null, "$r"))
        }
        this.quadruples.push(generateQuadruple("RTRN", null, null, returnVal))
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
        this.funTable[id] = {type: this.currFunType, params: null, start: this.quadruples.length}
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

        const address = `$l_${this.localVarNum}`
        const argAddr = `$a_${this.localVarNum}`
        this.localVarNum++
        this.localVarTable[id] = {...(this.currVarType), address: address}
        this.currParamsList?.push(this.currVarType.type || "number")
        this.quadruples.push(generateQuadruple("ASS", argAddr, null, address))
    }
    exitParams_done() {
        this.funTable[this.currScope].params = this.currParamsList.slice()
    }

    /** FUN ENDS */

    exitEnd(ctx) {
        console.log("DONE")
    }

    /** EXPRESSIONS **/

    exitLiteral_num(ctx) {
        const numStr = ctx.getText()
        const address = this.getConst(numStr)
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
        //if (this.inError) {return}

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

    exitPrint_str(ctx) {
        const addr = this.getConstStr(ctx.getText())

        const q = generateQuadruple("PRNT", addr)
        this.quadruples.push(q)
    }

    exitPrint_exp(ctx) {
        const op = this.operandStack.pop()
        
        const q = generateQuadruple("PRNT", op.address)
        this.quadruples.push(q)
        this.releaseTemp(op.address)
    }

    exitPrint_stmt() {
        const q = generateQuadruple("PRNT", "$c_1")
        this.quadruples.push(q)
    }

    exitRead_stmt(ctx) {
        const var_ = this.operandStack.pop()
        if (var_.type !== "number") {
            this.inError = true
            throw new SemanticError("only numeric variables can be read", ctx)
        }
        const q = generateQuadruple("READ", var_.address, null, null)
        this.quadruples.push(q)
        this.releaseTemp(var_.address)
    }    

    exitIf_exp(ctx) {
        const op = this.operandStack.pop();
        
        if (!op || op?.type !== "boolean") {
            this.inError = true
            throw new SemanticError("if expression must be boolean", ctx)
        }

        this.jumpStack.push(this.quadruples.length)

        this.quadruples.push(generateQuadruple("GOTF", op.address, null, null))
        this.releaseTemp(op.address)
    }

    enterElse_block() {
        const gotoQuadIndex = this.jumpStack.pop()

        this.jumpStack.push(this.quadruples.length)
        this.quadruples.push(generateQuadruple("GOTO", null, null, null))

        this.fillGoto(gotoQuadIndex, this.quadruples.length)
    }

    exitIf_else_stmt(ctx) {
        const gotoQuadIndex = this.jumpStack.pop()

        this.fillGoto(gotoQuadIndex, this.quadruples.length)
    }

    enterWhile_stmt() {
        this.jumpStack.push(this.quadruples.length)
    }

    exitWhile_exp(ctx) {
        this.jumpStack.push(this.quadruples.length)

        const op = this.operandStack.pop()

        if (!op || op?.type !== "boolean") {
            this.inError = true
            throw new SemanticError("while expression must be boolean", ctx)
        }

        this.quadruples.push(generateQuadruple("GOTF", op.address, null, null))
        this.releaseTemp(op.address)
    }

    exitWhile_stmt() {
        const gotoIndex = this.jumpStack.pop()
        const expIndex = this.jumpStack.pop()

        this.quadruples.push(generateQuadruple("GOTO", null, null, null))

        this.fillGoto(this.quadruples.length - 1, expIndex)

        this.fillGoto(gotoIndex, this.quadruples.length)
    }

    enterFor_exp(ctx) {
        this.jumpStack.push(this.quadruples.length)
    }

    exitFor_exp(ctx) {
        const exp_i = this.jumpStack.pop()
        
        const op = this.operandStack.pop()
        if (!op || op?.type !== "boolean") {
            this.inError = true
            throw new SemanticError("for expression must be boolean", ctx)
        }
        
        this.jumpStack.push(this.quadruples.length)
        this.quadruples.push(generateQuadruple("GOTF", op.address, null, null))
        this.releaseTemp(op.address)

        this.jumpStack.push(this.quadruples.length)
        this.quadruples.push(generateQuadruple("GOTO", null, null, null))

        this.jumpStack.push(exp_i)
        this.jumpStack.push(this.quadruples.length)
    }

    enterFor_block(ctx) {
        const ass_i = this.jumpStack.pop()
        const exp_i = this.jumpStack.pop()
        this.quadruples.push(generateQuadruple("GOTO", null, null, null))
        this.fillGoto(this.quadruples.length - 1, exp_i)

        const true_goto_i = this.jumpStack.pop()
        this.fillGoto(true_goto_i, this.quadruples.length)

        this.jumpStack.push(ass_i)
    }

    exitFor_block(ctx) {
        const ass_i = this.jumpStack.pop()
        const false_goto_i = this.jumpStack.pop()

        this.quadruples.push(generateQuadruple("GOTO", null, null, null))
        this.fillGoto(this.quadruples.length - 1, ass_i)

        this.fillGoto(false_goto_i, this.quadruples.length)
    }

    exitReturn_void(ctx) {
        if (this.currScope === "$global") {
            return this.quadruples.push(generateQuadruple("END", null, null, "$c_0"))
        }
        let returnVal = null
        if (this.currFunType === "boolean") {
            returnVal = "$c_f"
            this.quadruples.push(generateQuadruple("ASS", returnVal, null, "$r"))
        }
        else if (this.currFunType === "number") {
            returnVal = "$c_0"
            this.quadruples.push(generateQuadruple("ASS", returnVal, null, "$r"))
        }
        this.quadruples.push(generateQuadruple("RTRN", null, null, returnVal))
    }

    exitReturn_exp(ctx) {
        const op = this.operandStack.pop()
        this.releaseTemp(op.address)

        if (this.currScope === "$global") {
            return this.quadruples.push(generateQuadruple("END", null, null, op.address))
        }
        
        if (this.currFunType !== op.type) {
            throw new SemanticError("return type mismatch", ctx)
        }

        this.quadruples.push(generateQuadruple("ASS", op.address, null, "$r"))
        return this.quadruples.push(generateQuadruple("RTRN", null, null, op.address))
    }

    exitFun_call_stmt() {
        if (this.currFunCallInfo.type === "void") {return}

        this.operandStack.pop()
    }

    /* STATEMENTS END */

    /* FUN CALLS */

    /**
     * @param {ParserRuleContext} ctx 
     */
    exitFun_id_exp(ctx) {
        const id = ctx.getText()
        const funInfo = this.funTable[id]

        if (!funInfo) {
            this.inError = true
            throw new SemanticError("undeclared function", ctx)
        }

        if (funInfo.type === "void") {
            this.inError = true
            throw new SemanticError("void functions cannot be used in expressions", ctx)
        }

        this.currFunCallInfo = funInfo

        this.currFunCallParamNum = 0
    }
    
    exitFun_id_stmt(ctx) {
        const id = ctx.getText()
        const funInfo = this.funTable[id]

        if (!funInfo) {
            this.inError = true
            throw new SemanticError("undeclared function", ctx)
        }

        this.currFunCallInfo = funInfo

        this.currFunCallParamNum = 0
    }

    enterArg_exp(ctx) {
        this.operatorStack.push("")
    }

    exitArg_exp(ctx) {
        this.operatorStack.pop()
        const currCallParams = this.currFunCallInfo.params || []

        if (this.currFunCallParamNum + 1 > currCallParams.length) {
            this.inError = true
            throw new SemanticError("too many arguments", ctx)
        }
        
        const argOp = this.operandStack.pop()
        const paramType = currCallParams[this.currFunCallParamNum]

        if (argOp.type !== paramType) {
            this.inError = true
            throw new SemanticError("type mismatch", ctx)
        }
        
        this.quadruples.push(generateQuadruple("ASS", argOp.address, null, `$a_${this.currFunCallParamNum++}`))

        this.releaseTemp(argOp.address)
    }

    exitArgs(ctx) {
        const currCallParams = this.currFunCallInfo.params || []

        if (this.currFunCallParamNum < currCallParams.length) {
            this.inError = true
            throw new SemanticError("not enough arguments", ctx)
        }

        this.quadruples.push(generateQuadruple("CALL", null, null, null))
        this.fillGoto(this.quadruples.length - 1, this.currFunCallInfo.start)

        if (this.currFunCallInfo.type === "void") { return }

        const temp = this.getTemp()
        this.quadruples.push(generateQuadruple("ASS", "$r", null, temp))

        this.operandStack.push({address: temp, type: this.currAccessVarInfo.type})
    }

    /* FUN CALLS END*/

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
        return this.tempVarQueue.pop() || "$t_"
    }

    /**
     * @param {number} index 
     * @param {number} target 
     */
    fillGoto(index, target) {
        this.quadruples[index][3] = `${target}`
    }

    /**
     * @param {string} token 
     */
    getConst(token) {
        const val = parseFloat(token)
        const existing = this.constNumTracker[val.toString()];
        if (existing) {
            return existing
        }
        const addr = `$c_${this.constNum++}`
        this.constNumTracker[val.toString()] = addr
        this.constTable[addr] = val
        return addr
    }

    getConstStr(token) {
        const str = JSON.parse(token)
        const existing = this.constStrTracker[str]
        if (existing) {
            return existing
        }
        const addr = `$c_${this.constNum++}`

        this.constStrTracker[str] = addr
        this.constTable[addr] = str
        return addr
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