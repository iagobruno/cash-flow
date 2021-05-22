import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import UpdateUserValidator from 'App/Validators/UpdateUserValidator'

export default class UserController {

  public async index({ auth }: HttpContextContract) {
    return auth.user
  }

  public async update({ request, auth }: HttpContextContract) {
    const loggedUser = auth.user!
    const { balance, ...data } = await request.validate(UpdateUserValidator)

    loggedUser.merge(data)
    await loggedUser.save()

    return loggedUser
  }

  public async destroy({ auth, response }: HttpContextContract) {
    const loggedUser = auth.user!

    await loggedUser.delete()

    return response.ok('OK')
  }

}
