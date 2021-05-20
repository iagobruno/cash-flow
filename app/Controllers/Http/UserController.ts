import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UserController {

  public async index({ auth }: HttpContextContract) {
    return auth.user
  }

  // public async update({ }: HttpContextContract) {
  // }

  // public async destroy({ }: HttpContextContract) {
  // }

}
