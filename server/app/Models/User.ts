import { afterCreate, BaseModel, beforeCreate, column, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Database, { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import type { HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import Account from 'App/Models/Account'
import Transaction from 'App/Models/Transaction'
import Category from 'App/Models/Category'

export default class User extends BaseModel {
  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  public id: string

  @column()
  public name: string

  @column({ serializeAs: null })
  public email: string

  @column()
  public photoUrl?: string

  /** Cache do saldo total do usuário para evitar consultas ao banco de dados */
  @column({ columnName: 'balance_cache', consume: Number })
  public readonly balance: number

  @column({ serializeAs: null })
  public accessToken?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime


  //#region Methods
  public async recalcBalance($trx?: TransactionClientContract) {
    const newUserBalance = await Database.query()
      .sum('balance_cache AS total')
      .from('user_accounts')
      .where('user_id', '=', this.id)
      .groupBy('user_id')
      .if($trx, query => query.useTransaction($trx!))
      .then(rows => {
        if (!rows || rows.length === 0) return 0
        return Number(rows[0].total)
      })

    await Database.query()
      .from('users')
      .update('balance_cache', newUserBalance)
      .where('id', '=', this.id)
      .limit(1)
      .if($trx, query => query.useTransaction($trx!))

    return newUserBalance
  }

  public async createInitialUserData() {
    const user = this as User
    await user.related('accounts').create({
      name: 'Carteira',
      balance: 0,
      color: 'green',
      icon: 'wallet',
    })
    await user.related('categories').createMany([
      {
        kind: 'income',
        name: 'Salário',
        icon: 'money',
        color: 'green',
      },
      {
        kind: 'income',
        name: 'Freelas',
        icon: 'money',
        color: 'green',
      },
      {
        kind: 'outgo',
        name: 'Supermercado',
        icon: 'cart',
        color: 'orange',
      },
      {
        kind: 'outgo',
        name: 'Transporte',
        icon: 'car',
        color: 'black',
      },
      {
        kind: 'outgo',
        name: 'Alimentação',
        icon: 'fooad',
        color: 'blue',
      },
      {
        kind: 'outgo',
        name: 'Casa',
        icon: 'house',
        color: 'yellow',
      }
    ])
  }
  //#endregion


  //#region Relationships
  @hasMany(() => Account)
  public accounts: HasMany<typeof Account>

  @hasMany(() => Transaction)
  public transactions: HasMany<typeof Transaction>

  @hasMany(() => Category)
  public categories: HasMany<typeof Category>
  //#endregion Relationships


  //#region Hooks
  @beforeCreate()
  public static async beforeCreate(user: User) {
    user.id = uuid()
  }
  //#endregion Hooks
}
