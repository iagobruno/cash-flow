import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Account from 'App/Models/Account'
import NewAccountValidator from 'App/Validators/NewAccountValidator'

export default class AccountsController {
  public async index({ }: HttpContextContract) {
  }

  public async store({ request, auth }: HttpContextContract) {
    const loggedUser = auth.user!
    const { initial_balance, ...data } = await request.validate(NewAccountValidator)

    let newAccount: Account
    await Database.transaction(async (trx) => {
      loggedUser.useTransaction(trx)

      newAccount = await loggedUser.related('accounts').create(data)

      if (initial_balance && initial_balance > 0) {
        await newAccount.related('transactions').create({
          title: 'Saldo inicial',
          amount: initial_balance,
          userId: loggedUser.id,
          editable: false,
        })
      }
    })

    // @ts-ignore
    return newAccount
  }

  public async update({ }: HttpContextContract) {
  }

  public async destroy({ params, auth, bouncer, response }: HttpContextContract) {
    const loggedUser = auth.user!
    const account = await Account.findOrFail(params.id)

    await bouncer.forUser(loggedUser).authorize('delete-account', account)

    await account.delete()

    return response.ok('OK')
  }
}
