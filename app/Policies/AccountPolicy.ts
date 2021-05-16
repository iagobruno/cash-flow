import { BasePolicy } from '@ioc:Adonis/Addons/Bouncer'
import type User from 'App/Models/User'
import type Account from 'App/Models/Account'

export default class AccountPolicy extends BasePolicy {

  public async view(user: User, account: Account) {
    return account.userId === user.id
  }

  public async update(user: User, account: Account) {
    return account.userId === user.id
  }

  public async delete(user: User, account: Account) {
    return account.userId === user.id
  }

}
