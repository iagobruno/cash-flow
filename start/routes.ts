/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes.
|
*/

import HealthCheck from '@ioc:Adonis/Core/HealthCheck'
import Route from '@ioc:Adonis/Core/Route'

Route.get('/health', async () => {
  return await HealthCheck.getReport()
})

Route.get('/auth/google', 'Auth/GoogleAuthController.redirect')
Route.get('/auth/google/callback', 'Auth/GoogleAuthController.callback')
Route.get('/auth/logout', 'Auth/GoogleAuthController.logout')

Route.group(() => {
  Route.get('/me', ({ auth }) => {
    return auth.user ?? 'NULL'
  })
})
  .prefix('api')
  .middleware('auth:web')
