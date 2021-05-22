import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'accounts_transactions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
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
        .references('id').inTable('user_accounts')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.boolean('editable').defaultTo(true).notNullable()
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
