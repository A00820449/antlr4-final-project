import util from "node:util"
/**
* @template T
*/
export default class Queue {
	/**
	* @type {T[]}
	*/
	#arr
	constructor() {
		this.#arr = new Array(0)
	}

	/**
	 * @returns {T|undefined}
	 */
	peek() {
		return this.#arr[0]
	}
	
	pop() {
		return this.#arr.shift()
	}
	
	/**
	* @param {T} item
	*/
	push(item) {
		return this.#arr.push(item)
	}

	isEmpty() {
		return this.#arr.length <= 0
	}
	
	// for debugging
	[util.inspect.custom]() {
		return this.#arr
	}
}