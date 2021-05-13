import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'account_transactions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').unique().notNullable().index()
      table.decimal('amount').notNullable()
      table.string('title').nullable()
      table.text('note').nullable()
      table.string('user_id')
        .notNullable()
        .references('id').inTable('users')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.string('account_id')
        .notNullable()
        .references('id').inTable('accounts')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
