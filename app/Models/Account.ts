import { BaseModel, beforeCreate, belongsTo, column, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import User from 'App/Models/User'

export default class Account extends BaseModel {
  public static table = 'user_accounts'
  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  public id: string

  @column()
  public userId: number

  @column()
  public name: string

  @column()
  public balanceCache: number

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
  //#endregion Relationships


  //#region Hooks
  @beforeCreate()
  public static assignUuid(account: Account) {
    account.id = uuid()
  }
  //#endregion Hooks
}
