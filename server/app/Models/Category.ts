import { BaseModel, belongsTo, BelongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Transaction from 'App/Models/Transaction'
import User from 'App/Models/User'
import uuid from 'App/Services/uuidDecorator'

export default class Category extends BaseModel {
  public static table = 'user_categories'

  @column({ isPrimary: true })
  @uuid()
  public id: string

  @column()
  public userId: string

  @column()
  public kind: 'income' | 'outgo'

  @column()
  public name: string

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
  //#endregion
}
