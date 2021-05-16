import Factory from '@ioc:Adonis/Lucid/Factory'
import User from 'App/Models/User'
import AccountFactory from './AccountFactory'
import CategoryFactory from './CategoryFactory'
import TransactionFactory from './TransactionFactory'

const UserFactory = Factory.define(User, ({ faker }) => {
  return {
    email: faker.internet.email(),
    name: faker.name.findName(),
    photoUrl: faker.image.people(),
  }
})
  .relation('accounts', () => AccountFactory)
  .relation('categories', () => CategoryFactory)
  .relation('transactions', () => TransactionFactory)
  .build()

export default UserFactory
