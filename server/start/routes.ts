/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes.
|
*/

import Route from '@ioc:Adonis/Core/Route'
import HealthCheck from '@ioc:Adonis/Core/HealthCheck'
import Env from '@ioc:Adonis/Core/Env'
import User from 'App/Models/User'

Route.get('/auth/google', 'Auth/GoogleAuthController.redirect')
Route.get('/auth/google/callback', 'Auth/GoogleAuthController.callback')
Route.get('/auth/logout', 'Auth/GoogleAuthController.logout')

Route.group(() => {
  Route.get('/me', 'UserController.index')
  Route.patch('/me', 'UserController.update')
  Route.delete('/me', 'UserController.destroy')

  Route.get('/dashboard', 'DashboardController.index')
  Route.resource('/transactions', 'TransactionsController').apiOnly()
  Route.resource('/accounts', 'AccountsController').apiOnly()
  Route.resource('/categories', 'CategoriesController').apiOnly()
})
  .prefix('api')
  .middleware('auth:web,api')


const initNext = Env.get('NODE_ENV') !== 'testing' && !!process.argv.find(cmd => cmd.includes('server.ts'))
if (initNext) {
  const { nextRequestHandler } = require('../../client')

  // Let NextJs handle other paths
  Route.get('*', ({ request, response }) => {
    return nextRequestHandler(request.request, response.response)
  })
}




if (Env.get('NODE_ENV') === 'development') {
  Route.get('/health', async () => {
    return await HealthCheck.getReport()
  })
}

if (Env.get('NODE_ENV') === 'testing') {
  Route.post('/generate-api-token', async ({ request, auth }) => {
    const user = await User.findByOrFail('email', request.input('email'))
    const token = await auth.use('api').generate(user)
    return token.toJSON()
  })
}
