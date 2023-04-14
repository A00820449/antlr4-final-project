import { ParserRuleContext } from "antlr4";
import GrammarListener from "./lib/GrammarListener.js";

/**
 * @typedef {(string|null)[]} Quadruple
 */

/**
 * @typedef {{
 *      kind: ("program" | "var" | "function"),
 *      type: ("number" | "boolean" | "void" | null),
 *      dim_1: number | null,
 *      dim_2: number | null,
 *      params: (ParamsTable | null)
 * }} SymInfo
 */

/**
 * @typedef {{
*      type: ("number" | "boolean"),
*      dim_1: number | null,
*      dim_2: number | null
* }} VarInfo
*/

/**
 * @typedef {{
*      [key: string]: ("boolean"|"number")
* }} ParamsTable
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
     * @type {{[key: string]: SymInfo}}
     */
    globalSymTable

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
     * @type {ParamsTable|null}
     */
    currParamsTable

    /**
     * @type {{[key: string]: VarInfo}}
     */
    localVarTable

    /**
     * 
     * @param {Quadruple[]?} q
     */
    constructor(q) {
        super()
        this.quadruples = q || []
        this.globalSymTable = {}
        this.currVarType = {type: null, dim_1: null, dim_2: null}
        this.currScope = "$global"
        this.localVarTable = {}
        this.currParamsTable = {}
        this.currFunType = "void"
    }

    getQuadruples() {
        return this.quadruples
    }

    exitProgram_name(ctx) {
        this.globalSymTable[ctx.getText()] = {kind: "program", type: null, dim_1: null, dim_2: null, params: null}
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
        if (this.globalSymTable[id]) {
            throw new SemanicError(`duplicate ID '${id}'`, ctx)
        }
        if (this.currScope !== "$global") {
            if (this.localVarTable[id]) {
                throw new SemanicError(`duplicate ID '${id}'`, ctx)
            }
            this.localVarTable[id] = {type: this.currVarType.type, dim_1: this.currVarType.dim_1, dim_2: this.currVarType.dim_2}

        }
        else {
            this.globalSymTable[id] = {kind: "var", type: this.currVarType.type, dim_1: this.currVarType.dim_1, dim_2: this.currVarType.dim_2, params: null}
        }
    }

    exitFunctions() {
        this.currScope = "$global"
    }

    /**VARS END */

    /** FUN STARTS */

    enterFunction_decl() {
        this.currParamsTable = {}
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
        if (this.globalSymTable[id]) {
            throw new SemanicError(`Duplicate ID '${id}'`, ctx)
        }
        this.globalSymTable[id] = {kind: "function", type: this.currFunType, dim_1: null, dim_2: null, params: null}
        this.currScope = id
    }

    exitParam_type(ctx) {
        this.currVarType = {type: ctx.getText(), dim_1: null, dim_2: null}
    }
    exitParam_id(ctx) {
        const id = ctx.getText()
        if (this.localVarTable[id] || this.currParamsTable[id]) {
            throw new SemanicError(`ID already used '${id}'`, ctx)
        }

        this.localVarTable[id] = {...(this.currVarType)}
        this.currParamsTable[id] = this.currVarType.type || "number"
    }
    exitParams_done() {
        this.globalSymTable[this.currScope].params = {...(this.currParamsTable)}
    }

    /** FUN ENDS */

    exitEnd(ctx) {
        console.log("GLOBAL SYMBOLS:", this.globalSymTable)
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