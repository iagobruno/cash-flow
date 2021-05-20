import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import DashboardFiltersValidator from 'App/Validators/DashboardFiltersValidator'
import { now } from 'App/utils'

export default class DashboardController {

  public async index({ request, auth }: HttpContextContract) {
    const {
      month = now.get('month'),
      year = now.get('year')
    } = await request.validate(DashboardFiltersValidator)
    const loggedUser = auth.user!

    const accounts = await loggedUser.related('accounts').query()
      .orderBy('name', 'asc')

    const transactions = await loggedUser.related('transactions').query()
      .apply(scope => scope.fromMonth(month))
      .apply(scope => scope.fromYear(year))
      .orderBy('created_at', 'desc')
      .preload('category', (query) => {
        query.select(['name', 'icon', 'color'])
      })
      .preload('account', (query) => {
        query.select(['name', 'icon', 'color'])
      })

    let income_balance = 0
    let outgo_balance = 0
    let outgo_by_category: Record<string, number> = {}

    transactions.forEach(transaction => {
      if (transaction.kind === 'income') {
        income_balance += Math.abs(transaction.amount)
      }

      if (transaction.kind === 'outgo') {
        outgo_balance += Math.abs(transaction.amount)

        outgo_by_category[transaction.category.name] ??= 0
        outgo_by_category[transaction.category.name] += Math.abs(transaction.amount)
      }
    })

    const month_balance = income_balance - outgo_balance

    return {
      user_balance: loggedUser.balance,
      month_report: {
        name: now.get('monthLong'),
        balance: month_balance,
        savings: parseFloat(((income_balance - outgo_balance) / income_balance * 100).toFixed(2)),
        income_balance,
        outgo_balance,
      },
      outgo_by_category,
      accounts,
      transactions
    }
  }

}
