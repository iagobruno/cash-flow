import Factory from '@ioc:Adonis/Lucid/Factory'
import Transaction from 'App/Models/Transaction'
import { AccountFactory } from './AccountFactory'
import { UserFactory } from './UserFactory'

export const TransactionFactory = Factory.define(Transaction, ({ faker }) => {
  return {
    amount: faker.datatype.number({ min: -100, max: 100 }),
    title: faker.lorem.sentence(5),
    note: faker.lorem.sentence(12),
  }
})
  .relation('user', () => UserFactory)
  .relation('accounts', () => AccountFactory)
  .build()
