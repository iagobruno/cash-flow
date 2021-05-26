import 'reflect-metadata'
import japa from 'japa'
import getPort from 'get-port'
import execa from 'execa'
import { join } from 'path'
import sourceMapSupport from 'source-map-support'

process.env.NODE_ENV = 'testing'
process.env.ADONIS_ACE_CWD = join(__dirname)
sourceMapSupport.install({ handleUncaughtExceptions: false })
console.clear()

/**
 * Configure test runner
 */
japa.configure({
  files: getTestFiles(),
  before: [
    runMigrations,
    startHttpServer
  ],
  after: [
    rollbackMigrations,
    closeDatabaseConnection
  ],
  bail: true,
  timeout: 1000 * 10,
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
  console.log('Starting server...')

  const { Ignitor } = await import('@adonisjs/core/build/src/Ignitor')
  process.env.PORT = String(await getPort())
  await new Ignitor(__dirname).httpServer().start()
}

async function closeDatabaseConnection() {
  const { default: Database } = await import('@ioc:Adonis/Lucid/Database')
  await Database.manager.closeAll()
}

async function runMigrations() {
  console.log('Running migrations...')

  await execa.node('ace', ['migration:run'], {
    stdio: 'inherit',
  })
}

async function rollbackMigrations() {
  console.log('Rollbacking migrations...')

  await execa.node('ace', ['migration:rollback'], {
    stdio: 'inherit',
  })
}
