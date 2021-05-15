import { BaseModel, beforeCreate, belongsTo, HasMany, column, BelongsTo, hasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import User from 'App/Models/User'
import Transaction from 'App/Models/Transaction'

export default class Account extends BaseModel {
  public static table = 'user_accounts'
  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  public id: string

  @column()
  public userId: string

  @column()
  public name: string

  /** Cache do saldo da conta para evitar consultas ao banco de dados */
  @column({ columnName: 'balance_cache' })
  public balance: number

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


  //#region Hooks
  @beforeCreate()
  public static assignUuid(account: Account) {
    account.id = uuid()
  }
  //#endregion Hooks
}
