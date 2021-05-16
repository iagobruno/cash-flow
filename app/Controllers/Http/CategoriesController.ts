import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Category from 'App/Models/Category'
import NewCategoryValidator from 'App/Validators/NewCategoryValidator'
import UpdateCategoryValidator from 'App/Validators/UpdateCategoryValidator'

export default class CategoriesController {

  public async index({ auth }: HttpContextContract) {
    const loggedUser = auth.user!
    const categories = await loggedUser.related('categories').query()
      .orderBy('name', 'asc')

    return categories
  }

  public async show({ params, bouncer }: HttpContextContract) {
    const category = await Category.findOrFail(params.id)

    await bouncer.with('CategoryPolicy').authorize('view', category)

    return category
  }

  public async store({ request, auth }: HttpContextContract) {
    const loggedUser = auth.user!
    const data = await request.validate(NewCategoryValidator)

    const category = await loggedUser.related('categories').create(data)

    return category
  }

  public async update({ request, bouncer, params }: HttpContextContract) {
    const category = await Category.findOrFail(params.id)

    await bouncer.with('CategoryPolicy').authorize('update', category)

    const { kind, ...data } = await request.validate(UpdateCategoryValidator)

    category.merge(data)
    await category.save()

    return category
  }

  public async destroy({ params, bouncer, response }: HttpContextContract) {
    const category = await Category.findOrFail(params.id)

    await bouncer.with('CategoryPolicy').authorize('delete', category)

    await category.delete()

    return response.ok('OK')
  }

}
