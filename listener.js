import { ParserRuleContext } from "antlr4";
import GrammarListener from "./lib/GrammarListener.js";

/**
 * @typedef {(string|null)[]} Quadruple
 */

/**
 * @typedef {{
 *      kind: ("program" | "var" | "function"),
 *      type: ("number" | "boolean" | null),
 *      dim_1: number | null,
 *      dim_2: number | null
 * }} SymInfo
 */

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
     *  scope: ("global" | "local" | null})
     * }}
     */
    currVarType

    /**
     * @type {{[key: string]: SymInfo}}
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
        this.currVarType = {type: null, dim_1: null, dim_2: null, scope: null}
        this.localVarTable = {}
    }

    getQuadruples() {
        return this.quadruples
    }

    exitProgram_name(ctx) {
        this.globalSymTable[ctx.getText()] = {kind: "program", type: null, dim_1: null, dim_2: null}
    }

    /**VARS START */

    enterGlobal_vars(ctx) {
        this.currVarType.scope = "global"
    }

    enterVar_decl(ctx) {
        this.currVarType.dim_1 = null
        this.currVarType.dim_2 = null
    }

    exitVar_basic_type(ctx) {
        this.currVarType.type = ctx.getText()
    }

    exitVar_type_dim_1_num(ctx) {
        const num = Math.trunc(parseFloat(ctx.getText()))
        this.currVarType.dim_1 = num
    }

    exitVar_type_dim_2_num(ctx) {
        const num = Math.trunc(parseFloat(ctx.getText()))
        this.currVarType.dim_2 = num
    }

    exitVar_id(ctx) {
        const id = ctx.getText()
        if (this.globalSymTable[id]) {
            throw new SemanicError(`ID already used: ${id}`, ctx)
        }
        if (this.currVarType.scope === "local") {
            if (this.localVarTable[id]) {
                throw new SemanicError(`ID already used: ${id}`, ctx)
            }
            this.localVarTable[id] = {kind: "var", type: this.currVarType.type, dim_1: this.currVarType.dim_1, dim_2: this.currVarType.dim_2}
        }
        else if (this.currVarType.scope === "global") {
            this.globalSymTable[id] = {kind: "var", type: this.currVarType.type, dim_1: this.currVarType.dim_1, dim_2: this.currVarType.dim_2}
        }
    }    

    /**VARS END */

    exitEnd(ctx) {
        console.log(this.globalSymTable)
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
function generateQuadruple(a, b, c, d) {
    return [a || null, b || null, c || null, d || null]
}

class SemanicError extends Error {

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