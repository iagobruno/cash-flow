import { BaseModel, beforeCreate, belongsTo, BelongsTo, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import { v4 as uuid } from 'uuid'
import { DateTime } from 'luxon'
import Transaction from 'App/Models/Transaction'
import User from './User'

export default class Category extends BaseModel {
  public static table = 'user_categories'
  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
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
  @beforeCreate()
  public static assignUuid(cat: Category) {
    cat.id = uuid()
  }
  //#endregion
}
