import Factory from '@ioc:Adonis/Lucid/Factory'
import Account from 'App/Models/Account'
import { TransactionFactory } from './TransactionFactory'
import { UserFactory } from './UserFactory'

export const AccountFactory = Factory.define(Account, ({ faker }) => {
  return {
    name: faker.lorem.words(2),
    balance: faker.datatype.number({ min: 0, max: 1000 }),
    bank: null,
    color: '#664fff',
    icon: 'wallet',
  }
})
  .relation('user', () => UserFactory)
  .relation('transactions', () => TransactionFactory)
  .build()
