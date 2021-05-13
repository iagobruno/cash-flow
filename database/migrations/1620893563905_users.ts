import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').unique().notNullable().index()
      table.string('name', 255).notNullable()
      table.string('email', 255).notNullable().unique().index()
      table.string('photo_url', 255).nullable()
      table.decimal('balance_cache').notNullable()
      table.string('access_token', 255).nullable()
      table.timestamps(true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
