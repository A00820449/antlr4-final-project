import Jimp from "jimp";
const { read } = Jimp

/**
 * @typedef {Awaited<ReturnType<typeof read>>} Image
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
    return image = await read(name)
}

/**
 * @param {string} name 
 */
export async function saveImage(name) {
    if (image === null) {
        throw new NoImageError()
    }
    
    return image.write(name)
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

export function getWidth() {
    if (image === null) {
        throw new NoImageError()
    }

    return image.getWidth()
}

export function getHeight() {
    if (image === null) {
        throw new NoImageError()
    }

    return image.getHeight()
}

export function resize() {
    if (image === null) {
        throw new NoImageError()
    }

    return image.resize(w, h)
}

export function crop() {
    if (image === null) {
        throw new NoImageError()
    }

    return image.crop(x, y, w, h)
}

export function rotate() {
    if (image === null) {
        throw new NoImageError()
    }

    return image.rotate(deg)
}

export function flipVertiaclly() {
    if (image === null) {
        throw new NoImageError()
    }

    return image.flip(false, true)
}

export function flipHorizontally() {
    if (image === null) {
        throw new NoImageError()
    }

    return image.flip(true, false)
}