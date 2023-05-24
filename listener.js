import { ParserRuleContext } from "antlr4";
import GrammarListener from "./lib/GrammarListener.js";
import Stack from "./stack.js";
import semanticCube from "./semantic_cube.js";
import Queue from "./queue.js";

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
*      dims: string[],
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
     * @type {number}
     */
    tempLocalVarNum

    /**
     * @type {{
     *  type: ("number" | "boolean" | null), 
     *  dims: string[]
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
     * @type {Queue<string>}
     */
    tempVarQueue
    
    /**
     * @type {Queue<string>}
     */
    localTempVarQueue
    


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
     * @type {Stack<{info: VarInfo, access_operands: OperandInfo[]>}
     */
    varAccessStack

    /**
     * @type {Stack<number>}
     */
    jumpStack
    
    /**
     * @type {boolean}
     */
    inError

    /**
     * @type {Stack<{info: FunInfo, currParam: number}>}
     */
    funCallStack
    
    /**
     * @type {boolean}
     */
    lastCallWasVoid

    /**
     * @type {Stack<number>}
     */
    breakStack

    /**
     * @type {number}
     */
    pointerNum

    /**
     * @type {number}
     */
    localPointerNum

    /**
     * @type {Queue<string>}
     */
    pointerQueue

    /**
     * @type {Queue<string>}
     */
    localPointerQueue

    /**
     * 
     * @param {Quadruple[]?} q
     */
    constructor(q) {
        super()
        this.quadruples = q || []
        this.funTable = {}
        this.currVarType = {type: null, dims: []}
        this.currScope = "$global"
        this.globalVarTable = {}
        this.localVarTable = {}
        this.currParamsList = []
        this.currFunType = "void"
        this.progName = null
        this.globalVarNum = 0
        this.localVarNum = 0
        this.tempVarNum = 0
        this.tempLocalVarNum = 0
        this.operatorStack = new Stack()
        this.operandStack = new Stack()
        this.tempVarQueue = new Queue()
        this.localTempVarQueue = new Queue()

        this.constNum = 1
        this.constNumTracker = {"0": "$c_0"}
        this.constStrTracker = {"\n": "$c_n"}
        this.constTable = {"$c_f": false, "$c_t": true, "$c_n": "\n", "$c_0": 0}
        
        this.varAccessStack = new Stack();
        
        this.inError = false

        this.jumpStack = new Stack()

        this.funCallStack = new Stack()
        this.lastCallWasVoid = false

        this.breakStack = new Stack()

        this.pointerNum = 0
        this.localPointerNum = 0
        this.pointerQueue = new Queue()
        this.localPointerQueue = new Queue()
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
        console.log("FUN:", this.funTable, "VARS:", this.globalVarTable)
        console.log("OPERANDS", this.operandStack)
    }

    enterMain() {
        this.currScope = "$global"

        const gotoIndex = this.jumpStack.pop()

        this.fillGoto(gotoIndex, this.quadruples.length)
    }

    /**VARS START */

    enterVar_decl(ctx) {
        this.currVarType.dims = []
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
        
        this.currVarType.dims.push(this.getConst(num))
    }

    exitVar_type_dim_2_num(ctx) {
        const num = Math.trunc(parseFloat(ctx.getText()))
        if (num <= 0) {
            this.inError = true
            throw new SemanticError("vector dimension must be positive", ctx)
        }
        this.currVarType.dims.push(this.getConst(num))
    }

    exitVar_id(ctx) {
        const id = ctx.getText()
        if (this.currScope === "$global") {
            if  (this.globalVarTable[id]) {
                this.inError = true
                throw new SemanticError(`duplicate ID '${id}'`, ctx)
            }
            this.globalVarTable[id] = {type: this.currVarType.type, dims: this.currVarType.dims.slice(), address: `$g_${this.globalVarNum++}`}
        }
        else {
            if (this.localVarTable[id]) {
                this.inError = true
                throw new SemanticError(`duplicate ID '${id}'`, ctx)
            }
            this.localVarTable[id] =  {type: this.currVarType.type, dims: this.currVarType.dims.slice(), address: `$l_${this.localVarNum++}`}

        }
    }

    exitNon_dim_access(ctx) {
        const varinfo = this.varAccessStack.pop()
        if (!varinfo  || varinfo.info.dims.length > 0) {
            this.inError = true
            throw new SemanticError("missing vector dimension(s)", ctx)
        }

        this.operandStack.push({address: varinfo.info.address, type: varinfo.info.type})

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

        this.varAccessStack.push({info: varInfo, access_operands: []})
    }

    /**VARS END */

    /** FUN STARTS */

    enterFunction_decl() {
        this.currParamsList = []
        this.localVarTable = {}
        this.currFunType = "void"
        this.localVarNum = 0

        this.tempLocalVarNum = 0
        this.localTempVarQueue = new Queue()
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
        this.quadruples.push(generateQuadruple("RTRN", null, null, null))
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
        this.currVarType = {type: ctx.getText(), dims: []}
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
        const num = parseFloat(ctx.getText())
        const address = this.getConst(num)
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
        const q = generateQuadruple("PRNT", "$c_n")
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
        this.breakStack.push(-1)
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

        this.resolveBreaks(this.quadruples.length)
    }

    enterFor_stmt(ctx) {
        this.breakStack.push(-2)
    }

    exitFor_stmt(ctx) {
        this.resolveBreaks(this.quadruples.length)
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

    exitBreak_stmt(ctx) {
        if (this.breakStack.isEmpty()) {
            throw new SemanticError("cannot use break statement outside a for-loop or a while-loop", ctx)
        }

        this.breakStack.push(this.quadruples.length)
        this.quadruples.push(generateQuadruple("GOTO", null, null, null))
    }

    exitReturn_void(ctx) {
        if (this.currScope === "$global") {
            return this.quadruples.push(generateQuadruple("END", null, null, "$c_0"))
        }

        if (this.currFunType === "boolean") {
            this.quadruples.push(generateQuadruple("ASS", "$c_f", null, "$r"))
        }
        else if (this.currFunType === "number") {
            this.quadruples.push(generateQuadruple("ASS", "$c_0", null, "$r"))
        }
        this.quadruples.push(generateQuadruple("RTRN", null, null, null))
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
        return this.quadruples.push(generateQuadruple("RTRN", null, null, null))
    }

    exitFun_call_stmt() {

        if (this.lastCallWasVoid) {return}

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

        this.funCallStack.push({info: funInfo, currParam: 0})
    }
    
    exitFun_id_stmt(ctx) {
        const id = ctx.getText()
        const funInfo = this.funTable[id]

        if (!funInfo) {
            this.inError = true
            throw new SemanticError("undeclared function", ctx)
        }

        this.funCallStack.push({info: funInfo, currParam: 0})
    }

    enterArg_exp(ctx) {
        this.operatorStack.push("")
    }

    exitArg_exp(ctx) {
        this.operatorStack.pop()
        
        const currCall = this.funCallStack.peek()
        const params = currCall.info.params || []

        if (currCall.currParam + 1 > params.length) {
            this.inError = true
            throw new SemanticError("too many arguments", ctx)
        }
        
        const argOp = this.operandStack.pop()
        const paramType = params[currCall.currParam]

        if (argOp.type !== paramType) {
            this.inError = true
            throw new SemanticError("type mismatch", ctx)
        }
        
        this.quadruples.push(generateQuadruple("ASS", argOp.address, null, `$a_${currCall.currParam++}`))

        this.releaseTemp(argOp.address)
    }

    exitArgs(ctx) {
        const currCall = this.funCallStack.pop()

        const params = currCall.info.params || []

        if (currCall.currParam < params.length) {
            this.inError = true
            throw new SemanticError("not enough arguments", ctx)
        }

        this.quadruples.push(generateQuadruple("CALL", null, null, null))
        this.fillGoto(this.quadruples.length - 1, currCall.info.start)

        this.lastCallWasVoid = true
        if (currCall.info.type === "void") { return }

        this.lastCallWasVoid = false
        const temp = this.getTemp()
        this.quadruples.push(generateQuadruple("ASS", "$r", null, temp))

        this.operandStack.push({address: temp, type: currCall.info.type || "number"})
    }

    /* FUN CALLS END*/

    /**
     * @param {string} addr 
     */
    releaseTemp(addr) {
        if (addr.charAt(0) !== "$") {return}

        if (addr.charAt(1) === "t") {
            return this.tempVarQueue.push(addr)
        }
        if (addr.charAt(1) === "$") {
            return this.pointerQueue.push(addr)
        }

        if (addr.charAt(1) === "l") {
            if (addr.charAt(2) === "t") {
                return this.localTempVarQueue.push(addr)
            }
            if (addr.charAt(2) === "$") {
                return this.localPointerQueue.push(addr)
            }
        }
    }
    getTemp() {
        if (this.currScope === "$global") {
            if (this.tempVarQueue.isEmpty()) {
                return `$t_${this.tempVarNum++}`
            }
            return this.tempVarQueue.pop() || "$t_"
        }

        if (this.localTempVarQueue.isEmpty()) {
            return `$lt_${this.tempLocalVarNum++}`
        }
        
        return this.localTempVarQueue.pop() || `$lt_`
    }


    getTempPointer() {
        if (this.currScope === "$global") {
            if (this.pointerQueue.isEmpty()) {
                return `$$_${this.pointerNum++}`
            }
            return this.pointerQueue.pop() || "$$_"
        }

        if (this.localPointerQueue.isEmpty()) {
            return `$l$_${this.localPointerNum++}`
        }
        return this.localPointerQueue.pop() || "$l$_"

    }

    /**
     * @param {number} index 
     * @param {number} target 
     */
    fillGoto(index, target) {
        this.quadruples[index][3] = `${target}`
    }

    /**
     * @param {number} val 
     */
    getConst(val) {
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
            throw new SemanticError("bad grammar", ctx)
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
            throw new SemanticError("type mismatch", ctx)
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
    
    /**
     * @param {number} target 
     */
    resolveBreaks(target) {
        while (!this.breakStack.isEmpty() && this.breakStack.peek() >= 0) {
            const index = this.breakStack.pop()
            this.fillGoto(index, target)
        }

        this.breakStack.pop()
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