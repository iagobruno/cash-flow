import { DateTime } from 'luxon'

export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = !isProduction

export const HEXColorRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/i

export const now = DateTime.now()
