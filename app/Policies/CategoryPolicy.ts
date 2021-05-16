import { BasePolicy } from '@ioc:Adonis/Addons/Bouncer'
import type User from 'App/Models/User'
import type Category from 'App/Models/Category'

export default class AccountPolicy extends BasePolicy {

  public async view(user: User, category: Category) {
    return category.userId === user.id
  }

  public async update(user: User, category: Category) {
    return category.userId === user.id
  }

  public async delete(user: User, category: Category) {
    return category.userId === user.id
  }

}
