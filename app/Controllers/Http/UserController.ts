import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UserController {

  public async index({ auth }: HttpContextContract) {
    return auth.user
  }

  // public async update({ }: HttpContextContract) {
  // }

  public async destroy({ auth, response }: HttpContextContract) {
    const loggedUser = auth.user!

    await loggedUser.delete()

    return response.ok('OK')
  }

}
