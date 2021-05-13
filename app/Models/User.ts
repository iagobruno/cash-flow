import { BaseModel, beforeCreate, column, hasMany } from '@ioc:Adonis/Lucid/Orm'
import type { HasMany } from '@ioc:Adonis/Lucid/Relations'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import Account from 'App/Models/Account'
import Transaction from 'App/Models/Transaction'

export default class User extends BaseModel {
  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  public id: string

  @column()
  public name: string

  @column({ serializeAs: null })
  public email: string

  @column()
  public photoUrl: string

  @column({ serializeAs: 'balance' })
  public balanceCache: number

  @column({ serializeAs: null })
  public accessToken?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime


  //#region Relationships
  @hasMany(() => Account)
  public accounts: HasMany<typeof Account>

  @hasMany(() => Transaction)
  public transactions: HasMany<typeof Transaction>
  //#endregion Relationships


  //#region Hooks
  @beforeCreate()
  public static assignUuid(user: User) {
    user.id = uuid()
  }

  @beforeCreate()
  public static async beforeCreate(user: User) {
    user.balanceCache = 0
  }
  //#endregion Hooks
}
