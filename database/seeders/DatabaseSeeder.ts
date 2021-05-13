import Database from '@ioc:Adonis/Lucid/Database'
import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import { UserFactory } from 'Database/factories/UserFactory'

export default class DatabaseSeeder extends BaseSeeder {
  public static developmentOnly = true

  public async run() {
    // Clean up database
    await Database.from('user_accounts').delete()
    await Database.from('users').delete()


    const user = await UserFactory.create()

    const account1 = await user.related('accounts').create({
      name: 'Carteira',
      balanceCache: 22.05,
      bank: null,
      color: '#2AB14C',
      icon: 'currency'
    })
    const account2 = await user.related('accounts').create({
      name: 'NuConta',
      balanceCache: 125.37,
      bank: 'nubank',
      color: '#612F74',
      icon: 'nubank'
    })
  }
}
