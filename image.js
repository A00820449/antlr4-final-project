import sharp from "sharp";
import { readFile } from "node:fs/promises"

/**
 * @typedef {Awaited<ReturnType<typeof sharp>>} Image
 */

/**
 * @type {Image | null}
 */
let image = null

/**
 * @type {number}
 */
let x = 0

/**
 * @type {number}
 */
let y = 0

/**
 * @type {number}
 */
let w = 0

/**
 * @type {number}
 */
let h = 0

/**
 * @type {number}
 */
let deg = 0

export class NoImageError extends Error {
    constructor() {
        super("image not loaded")
    }
}

/**
 * @param {string} name 
 */
export async function loadImage(name) {
    const buff = await readFile(name)
    return image = sharp(buff)
}

/**
 * @param {string} name 
 */
export async function saveImage(name) {
    if (image === null) {
        throw new NoImageError()
    }

    return await image.toFile(name)
}

/**
 * @param {number} newX 
 */
export function setX(newX) {
    return x = newX
}

/**
 * @param {number} newY 
 */
export function setY(newY) {
    return y = newY
}

/**
 * @param {number} newW 
 */
export function setW(newW) {
    return w = newW
}

/**
 * @param {number} newH 
 */
export function setH(newH) {
    return h = newH
}

/**
 * @param {number} newDeg
 */
export function setDeg(newDeg) {
    return deg = newDeg
}

export async function getWidth() {
    if (image === null) {
        throw new NoImageError()
    }

    const meta = await image.metadata()

    return meta.width || 0
}

export async function getHeight() {
    if (image === null) {
        throw new NoImageError()
    }

    const meta = await image.metadata()

    return meta.height || 0
}

export async function resize() {
    if (image === null) {
        throw new NoImageError()
    }

    const buff = await image.resize({width: w, height: h}).toBuffer()

    return image = sharp(buff)
}

export async function crop() {
    if (image === null) {
        throw new NoImageError()
    }

    const buff = await image.extract({left: x, top: y, width: w, height: h}).toBuffer()

    return image = sharp(buff)
}

export async function rotate() {
    if (image === null) {
        throw new NoImageError()
    }

    const buff = await image.rotate(deg).toBuffer()

    return image = sharp(buff)
}

export async function flipVertiaclly() {
    if (image === null) {
        throw new NoImageError()
    }

    const buff = await image.flip().toBuffer()

    return image = sharp(buff)
}

export async function flipHorizontally() {
    if (image === null) {
        throw new NoImageError()
    }

    const buff = await image.flop().toBuffer()

    return image = sharp(buff)
}