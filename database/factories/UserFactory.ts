import Factory from '@ioc:Adonis/Lucid/Factory'
import User from 'App/Models/User'
import { AccountFactory } from './AccountFactory'
import { TransactionFactory } from './TransactionFactory'

export const UserFactory = Factory.define(User, ({ faker }) => {
  return {
    email: faker.internet.email(),
    name: faker.name.findName(),
    photoUrl: faker.image.people(),
  }
})
  .relation('accounts', () => AccountFactory)
  .relation('transactions', () => TransactionFactory)
  .build()
