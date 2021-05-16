import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Category from 'App/Models/Category'

export default class CategoriesController {

  // public async index({ }: HttpContextContract) {
  // }

  public async show({ params, bouncer }: HttpContextContract) {
    const category = await Category.findOrFail(params.id)

    await bouncer.with('CategoryPolicy').authorize('view', category)

    return category
  }

  // public async store({ }: HttpContextContract) {
  // }

  // public async update({ }: HttpContextContract) {
  // }

  public async destroy({ params, bouncer, response }: HttpContextContract) {
    const category = await Category.findOrFail(params.id)

    await bouncer.with('CategoryPolicy').authorize('delete', category)

    await category.delete()

    return response.ok('OK')
  }

}
