import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class GoogleAuthController {

  public async redirect({ ally }: HttpContextContract) {
    return ally.use('google').redirect()
  }

  public async callback({ ally, auth, response }: HttpContextContract) {
    const googleAuth = ally.use('google')

    // User has explicitly denied the login request
    if (googleAuth.accessDenied()) {
      return 'Access was denied'
    }
    // Unable to verify the CSRF state
    if (googleAuth.stateMisMatch()) {
      return 'Request expired. Retry again'
    }
    // here was an unknown error during the redirect
    if (googleAuth.hasError()) {
      return googleAuth.getError()
    }

    const googleUser = await googleAuth.user()

    /**
     * Find the user by email or create a new one
     */
    const user = await User.firstOrCreate(
      {
        email: googleUser.email,
      },
      {
        email: googleUser.email,
        name: googleUser.name,
        photoUrl: googleUser.avatarUrl,
        accessToken: googleUser.token.token,
      }
    )

    /**
     * Finally, login the user
     */
    await auth.use('web').login(user)

    return response.redirect('/')
  }

  public async logout({ auth, response }: HttpContextContract) {
    await auth.use('web').logout()

    return response.redirect('/')
  }
}
