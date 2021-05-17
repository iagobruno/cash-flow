import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import NewTransactionValidator from 'App/Validators/NewTransactionValidator'

export default class TransactionsController {

  // public async index({ }: HttpContextContract) {
  // }

  public async store({ request, auth }: HttpContextContract) {
    const loggedUser = auth.user!
    const {
      account_id,
      category_id,
      kind,
      ...data
    } = await request.validate(NewTransactionValidator)

    const transaction = await loggedUser.related('transactions').create({
      ...data,
      categoryId: category_id,
      accountId: account_id
    })

    return transaction
  }

  // public async show ({}: HttpContextContract) {
  // }

  // public async update ({}: HttpContextContract) {
  // }

  // public async destroy ({}: HttpContextContract) {
  // }

}
