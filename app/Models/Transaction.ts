import { BaseModel, beforeCreate, belongsTo, column, computed, BelongsTo, afterSave, afterDelete } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import Account from 'App/Models/Account'
import User from 'App/Models/User'
import Category from 'App/Models/Category'

export default class Transaction extends BaseModel {
  public static table = 'accounts_transactions'
  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  public id: string

  @column()
  public userId: string

  @column()
  public accountId: string

  @column()
  public categoryId?: string

  @column()
  public title?: string

  @column({ consume: Number })
  public amount: number

  @column()
  public note?: string

  @column()
  public editable: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @computed()
  public get kind() {
    return this.amount < 0 ? 'outgo' : 'income'
  }


  //#region Relationships
  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @belongsTo(() => Account)
  public account: BelongsTo<typeof Account>

  @belongsTo(() => Category)
  public category: BelongsTo<typeof Category>
  //#endregion Relationships


  //#region Hooks
  @beforeCreate()
  public static assignUuid(transaction: Transaction) {
    transaction.id = uuid()
  }

  @afterSave()
  public static async changeAccountBalance(transaction: Transaction) {
    if (!transaction.account) await transaction.load('account')
    await transaction.account.recalcBalance(transaction.$trx)
  }

  @afterDelete()
  public static async changeAccountBalance2(transaction: Transaction) {
    const account = await Account.findOrFail(transaction.accountId)
    await account.recalcBalance(transaction.$trx)
  }
  //#endregion Hooks
}
