import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Transaction from 'App/Models/Transaction'
import NewTransactionValidator from 'App/Validators/NewTransactionValidator'
import TransactionsFiltersValidator from 'App/Validators/TransactionsFiltersValidator'
import { DateTime } from 'luxon'

export default class TransactionsController {

  public async index({ request, auth }: HttpContextContract) {
    const loggedUser = auth.user!
    const {
      page = 1,
      per_page = 50,
      kind,
      category,
      account,
      month,
      year = DateTime.now().get('year'),
      day,
    } = await request.validate(TransactionsFiltersValidator)

    const query = loggedUser.related('transactions').query()
      .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [month])
      .andWhereRaw('EXTRACT(YEAR FROM created_at) = ?', [year])
      .orderBy('created_at', 'desc')

    if (day) {
      query.andWhereRaw('EXTRACT(DAY FROM created_at) = ?', [day])
    }

    if (kind) {
      if (kind === 'income') {
        query.andWhere('amount', '>', 0)
      }
      else if (kind === 'outgo') {
        query.andWhere('amount', '<', 0)
      }
    }

    if (category) {
      query.andWhere('category_id', '=', category)
    }

    if (account) {
      query.andWhere('account_id', '=', account)
    }

    const transactions = await query
      // .debug(true)
      .paginate(page, per_page)
    return transactions
  }

  public async show({ params, bouncer }: HttpContextContract) {
    const transaction = await Transaction.findOrFail(params.id)

    await bouncer.with('TransactionPolicy').authorize('view', transaction)

    return transaction
  }

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

  // public async update ({}: HttpContextContract) {
  // }

  // public async destroy ({}: HttpContextContract) {
  // }

}
