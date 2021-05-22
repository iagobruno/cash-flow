import { BasePolicy } from '@ioc:Adonis/Addons/Bouncer'
import type User from 'App/Models/User'
import type Transaction from 'App/Models/Transaction'

export default class TransactionPolicy extends BasePolicy {

  public async view(user: User, transaction: Transaction) {
    return transaction.userId === user.id
  }

  public async update(user: User, transaction: Transaction) {
    return (
      transaction.userId === user.id &&
      transaction.editable === true
    )
  }

  public async delete(user: User, transaction: Transaction) {
    return transaction.userId === user.id
  }
}
