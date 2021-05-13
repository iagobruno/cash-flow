import Factory from '@ioc:Adonis/Lucid/Factory'
import Category from 'App/Models/Category'
import { TransactionFactory } from './TransactionFactory'
import { UserFactory } from './UserFactory'

export const CategoryFactory = Factory.define(Category, ({ faker }) => {
  return {
    name: faker.lorem.word(),
    color: faker.internet.color(),
    kind: faker.random.arrayElement(['outgo', 'income']) as any,
  }
})
  .relation('user', () => UserFactory)
  .relation('transactions', () => TransactionFactory)
  .build()
