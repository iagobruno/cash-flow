import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Transaction from 'App/Models/Transaction'
import NewTransactionValidator from 'App/Validators/NewTransactionValidator'
import TransactionsFiltersValidator from 'App/Validators/TransactionsFiltersValidator'
import UpdateTransactionValidator from 'App/Validators/UpdateTransactionValidator'
import type { ModelObject } from '@ioc:Adonis/Lucid/Orm'
import { now } from 'App/helpers'

export default class TransactionsController {

  public async index({ request, auth }: HttpContextContract) {
    const loggedUser = auth.user!
    const {
      page = 1,
      per_page = 50,
      ...inputs
    } = await request.validate(TransactionsFiltersValidator)

    const query = Transaction
      .filter(inputs)
      .where('user_id', '=', loggedUser.id)
      .orderBy('created_at', 'desc')

    const queryResults = await query
      // .debug(true)
      .paginate(page, per_page)

    const groups = new Map<string, Array<ModelObject>>()

    queryResults.forEach(row => {
      // @ts-ignore
      const dayLabel = row.createdAt.get('weekdayLong').split('-')[0] + ', ' + row.createdAt.get('daysInMonth')
      const transaction = row.toJSON()

      if (!groups.has(dayLabel)) {
        groups.set(dayLabel, [])
      }
      groups.get(dayLabel)?.push(transaction)
    })

    return {
      meta: queryResults.getMeta(),
      data: Array.from(groups.entries()),
    }
  }

  public async show({ params, bouncer }: HttpContextContract) {
    const transaction = await Transaction.findOrFail(params.id)

    await bouncer.with('TransactionPolicy').authorize('view', transaction)

    return transaction
  }

  public async store({ request, auth }: HttpContextContract) {
    const loggedUser = auth.user!
    const { kind, ...data } = await request.validate(NewTransactionValidator)

    const transaction = await loggedUser.related('transactions').create(data)

    return transaction
  }

  public async update({ request, params, bouncer }: HttpContextContract) {
    const { kind, ...data } = await request.validate(UpdateTransactionValidator)
    const transaction = await Transaction.findOrFail(params.id)

    await bouncer.with('TransactionPolicy').authorize('update', transaction)

    transaction.merge(data)
    await transaction.save()

    return transaction
  }

  public async destroy({ params, bouncer, response }: HttpContextContract) {
    const transaction = await Transaction.findOrFail(params.id)

    await bouncer.with('TransactionPolicy').authorize('delete', transaction)

    await transaction.delete()

    return response.ok('OK')
  }

}
