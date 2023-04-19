import util from "node:util"
/**
 * @template T
 */
export default class Stack {
    /**
     * @type {T[]}
    */
    #arr
    constructor() {
        this.#arr = []
    }

    pop() {
        return this.#arr.pop()
    }

    /**
     * @param {T} x 
     */
    push(x) {
        return this.#arr.push(x)
    }

    /**
     * @returns {T | undefined}
     */
    peek() {
        return this.#arr[this.#arr.length - 1]
    }

    isEmpty() {
        return this.#arr.length <= 0
    }

    [util.inspect.custom]() {
        return this.#arr
    }
}