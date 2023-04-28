import { z } from "zod"

export const quadrupleSchema = z.tuple([
    z.string().or(z.null()),
    z.string().or(z.null()),
    z.string().or(z.null()),
    z.string().or(z.null()),
])

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