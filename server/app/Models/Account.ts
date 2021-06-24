import { BaseModel, belongsTo, HasMany, column, BelongsTo, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Database, { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import User from 'App/Models/User'
import Transaction from 'App/Models/Transaction'
import uuid from 'App/Services/uuidDecorator'

export default class Account extends BaseModel {
  public static table = 'user_accounts'

  @column({ isPrimary: true })
  @uuid()
  public id: string

  @column()
  public userId: string

  @column()
  public name: string

  /** Cache do saldo da conta para evitar consultas ao banco de dados */
  @column({ columnName: 'balance_cache', consume: Number })
  public readonly balance: number

  @column()
  public bank?: string | null

  @column()
  public icon: string

  @column()
  public color: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime


  //#region Relationships
  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @hasMany(() => Transaction)
  public transactions: HasMany<typeof Transaction>
  //#endregion Relationships


  //#region Methods
  public async recalcBalance($trx?: TransactionClientContract) {
    const newAccountBalance = await Database.query()
      .sum('amount AS total')
      .from('accounts_transactions')
      .where('account_id', '=', this.id)
      .andWhere('user_id', '=', this.userId)
      .groupBy('account_id')
      .if($trx, query => query.useTransaction($trx!))
      .then(rows => {
        if (!rows || rows.length === 0) return 0
        return Number(rows[0].total)
      })

    const account = this as Account
    await Database.query()
      .from('user_accounts')
      .update('balance_cache', newAccountBalance)
      .where('id', '=', account.id)
      .limit(1)
      .if($trx, query => query.useTransaction($trx!))

    // Recalcular automaticamente o balanço da conta do usuário
    if (!account.user) await account.load('user')
    await account.user.recalcBalance($trx)

    return newAccountBalance
  }
  //#endregion


  //#region Hooks
  //#endregion Hooks
}
