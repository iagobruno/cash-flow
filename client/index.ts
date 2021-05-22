import next from 'next'

const isDev = process.env.NODE_ENV !== 'production'
const app = next({
  dir: __dirname,
  dev: isDev
})
app.prepare()

export const nextRequestHandler = app.getRequestHandler()
