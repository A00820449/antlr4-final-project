import { z } from "zod"

export const quadrupleSchema = z.object({
    "0": z.string().or(z.null()),
    "1": z.string().or(z.null()),
    "2": z.string().or(z.null()),
    "3": z.string().or(z.null()),
})

export const constTableSchema = z.record(z.union([z.number(), z.string(), z.boolean()]))

export const inputSchema = z.object({
    quadruples: z.array(quadrupleSchema),
    constTable: constTableSchema
})

/**
 * @typedef {z.infer<typeof quadrupleSchema>} Quadruple
 */

/**
 * @typedef {z.infer<typeof constTable>} ConstTable
 */