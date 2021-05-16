import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Category from 'App/Models/Category'

export default class CategoriesController {

  // public async index({ }: HttpContextContract) {
  // }

  public async show({ params, auth, bouncer }: HttpContextContract) {
    const loggedUser = auth.user!
    const category = await Category.findOrFail(params.id)

    await bouncer.forUser(loggedUser).authorize('view-category', category)

    return category
  }

  // public async store({ }: HttpContextContract) {
  // }

  // public async update({ }: HttpContextContract) {
  // }

  // public async destroy({ }: HttpContextContract) {
  // }

}
