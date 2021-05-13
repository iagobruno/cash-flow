import 'reflect-metadata'
import { join } from 'path'
import getPort from 'get-port'
import japa from 'japa'
import sourceMapSupport from 'source-map-support'

process.env.NODE_ENV = 'testing'
process.env.ADONIS_ACE_CWD = join(__dirname)
sourceMapSupport.install({ handleUncaughtExceptions: false })

/**
 * Configure test runner
 */
japa.configure({
  files: getTestFiles(),
  before: [startHttpServer],
  after: [closeDatabaseConnection],
  bail: true,
})

function getTestFiles() {
  let testFilePath = process.argv.slice(2)[0]
  if (!testFilePath) {
    return 'tests/**/*.(spec|test).(ts|js)'
  }
  else {
    return `tests/**/${testFilePath.replace(/(\.ts$|\.js)$/, '')}.(ts|js)`
  }
}

async function startHttpServer() {
  const { Ignitor } = await import('@adonisjs/core/build/src/Ignitor')
  process.env.PORT = String(await getPort())
  await new Ignitor(__dirname).httpServer().start()
}

async function closeDatabaseConnection() {
  const { default: Database } = await import('@ioc:Adonis/Lucid/Database')
  await Database.manager.closeAll()
}
