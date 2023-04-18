import { ParserRuleContext } from "antlr4";
import GrammarListener from "./lib/GrammarListener.js";

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
*      dim_2: number | null
* }} VarInfo
*/

/**
 * @typedef {("number" | "boolean")[]} ParamsList
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
     * @type {{
     *  type: ("number" | "boolean" | null), 
     *  dim_1: number|null, 
     *  dim_2: number|null,
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
    }

    getQuadruples() {
        return this.quadruples
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
            this.globalVarTable[id] = {type: this.currVarType.type, dim_1: this.currVarType.dim_1, dim_2: this.currVarType.dim_2}
        }
        else {
            if (this.localVarTable[id]) {
                throw new SemanicError(`duplicate ID '${id}'`, ctx)
            }
            this.localVarTable[id] = {type: this.currVarType.type, dim_1: this.currVarType.dim_1, dim_2: this.currVarType.dim_2}

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

        this.localVarTable[id] = {...(this.currVarType)}
        this.currParamsList?.push(this.currVarType.type || "number")
    }
    exitParams_done() {
        this.funTable[this.currScope].params = this.currParamsList.slice()
    }

    /** FUN ENDS */

    exitEnd(ctx) {
        console.log("PROGRAM:", this.progName, "GLOBAL FUNS:", this.funTable, "GLOBAL VARS:", this.globalVarTable)
        console.log("DONE")
    }

    exitExpression(ctx) {
        
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