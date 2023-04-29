import { createInterface } from "node:readline/promises"

/**
 * @typedef {(prompt?: string) => Promise<string>} InputFunction
 */

/**
 * @param {ReadableStream} stream 
 */
export async function getBufferFromStream(stream) {
    /**
     * @type {Buffer[]}
     */
    const buffer = []
    for await (const data of stream) {
        if (data instanceof Buffer) {
            buffer.push(data)
        }   
    }
    return Buffer.concat(buffer)
}

/**
 * @param {NodeJS.ReadStream} input 
 * @param {NodeJS.WriteStream} output 
 * @returns {InputFunction}
 */
export function getTTYInputFunction(input, output) {
    return async (prompt) => {
        const rl = createInterface({input, output})
        if (prompt === undefined) {
            prompt = "> "
        }
        const a = await rl.question(prompt)
        rl.close()
        return a
    }
}

/**
 * @param {Buffer} buffer 
 * @param {NodeJS.WriteStream} output 
 * @return {InputFunction}
 */
export function getNonTTYFunction(buffer, output) {
    const queue = buffer.toString().replace(/\n$/,"").split('\n')
    
    return async (prompt) => {
        output.write(prompt||"")
        return queue.shift() || ''
    }
}

/**
 * 
 * @param {NodeJS.ReadStream} input 
 * @param {NodeJS.WriteStream} output 
 */
export async function getInputFuntion(input, output) {
    if (input.isTTY) {
        return getTTYInputFunction(input, output)
    }
    const buffer = await getBufferFromStream(input)
    return getNonTTYFunction(buffer, output)
}