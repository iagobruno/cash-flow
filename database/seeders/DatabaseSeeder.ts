import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import { UserFactory } from 'Database/factories/UserFactory'

export default class DatabaseSeeder extends BaseSeeder {
  public async run() {
    const user = await UserFactory.create()
  }
}
