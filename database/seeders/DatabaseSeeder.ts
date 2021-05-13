import Database from '@ioc:Adonis/Lucid/Database'
import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import { UserFactory } from 'Database/factories/UserFactory'

export default class DatabaseSeeder extends BaseSeeder {
  public static developmentOnly = true

  public async run() {
    // Clean up database
    await Database.from('user_categories').delete()
    await Database.from('account_transactions').delete()
    await Database.from('user_accounts').delete()
    await Database.from('users').delete()


    const user = await UserFactory.create()

    const account1 = await user.related('accounts').create({
      name: 'NuConta',
      balanceCache: 125.37,
      bank: 'nubank',
      color: '#612F74',
      icon: 'nubank'
    })
    const account2 = await user.related('accounts').query()
      .where('name', '=', 'Carteira')
      .firstOrFail()

    const cat1 = await user.related('categories').create({
      kind: 'outgo',
      name: 'Entretenimento',
      color: 'yellow',
      icon: 'pc',
    })
    const cat2 = await user.related('categories').query()
      .where('name', '=', 'Supermercado')
      .firstOrFail()
    const cat3 = await user.related('categories').create({
      kind: 'income',
      name: 'Freela de barman',
      color: 'green',
      icon: 'drink',
    })

    await account2.related('transactions').createMany([
      {
        amount: 150,
        title: 'Pagamento do freela de hoje',
        userId: user.id,
        categoryId: cat3.id
      },
      {
        amount: -45,
        title: 'Compras no supermercado',
        userId: user.id,
        categoryId: cat2.id
      }
    ])
    await account1.related('transactions').createMany([
      {
        amount: -16.90,
        title: 'Spotify',
        userId: user.id,
        categoryId: cat1.id
      },
      {
        amount: -22,
        title: 'Netflix',
        userId: user.id,
        categoryId: cat1.id
      }
    ])
  }
}
