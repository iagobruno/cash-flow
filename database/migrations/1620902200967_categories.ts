import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'user_categories'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').unique().notNullable().index()
      table.enum('kind', ['income', 'outgo']).notNullable()
      table.string('name').notNullable().index()
      table.string('icon', 100).notNullable()
      table.string('color', 10).notNullable()
      table.string('user_id')
        .notNullable()
        .references('id').inTable('users')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.timestamps(true)
    })

    this.schema.alterTable('accounts_transactions', table => {
      table.string('category_id')
        .notNullable()
        .references('id').inTable('user_categories')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
    })
  }

  public async down() {
    this.schema.alterTable('accounts_transactions', table => {
      table.dropColumn('category_id')
    })

    this.schema.dropTable(this.tableName)
  }
}
