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
  Route.get('/me', ({ auth }) => {
    return auth.user ?? 'NULL'
  })

  Route.get('/dashboard', 'DashboardController.index')
  Route.resource('/transactions', 'TransactionsController').apiOnly()
  Route.resource('/accounts', 'AccountsController').apiOnly()
  Route.resource('/categories', 'CategoriesController').apiOnly()
})
  .prefix('api')
  .middleware('auth:web,api')




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
