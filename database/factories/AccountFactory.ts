import Factory from '@ioc:Adonis/Lucid/Factory'
import Account from 'App/Models/Account'
import { UserFactory } from './UserFactory'

export const AccountFactory = Factory.define(Account, ({ }) => {
  return {
    name: 'Carteira',
    balanceCache: 0,
    bank: null,
    color: '#000',
    icon: 'wallet',
  }
})
  .relation('user', () => UserFactory)
  .build()
