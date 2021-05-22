import { rules, schema } from '@ioc:Adonis/Core/Validator'
// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class TransactionsFiltersValidator {
  /*
   * Define schema to validate the "shape", "type", "formatting" and "integrity" of data.
   *
   * For example:
   * 1. The username must be of data type string. But then also, it should
   *    not contain special characters or numbers.
   *    ```
   *     schema.string({}, [ rules.alpha() ])
   *    ```
   *
   * 2. The email must be of data type string, formatted as a valid
   *    email. But also, not used by any other user.
   *    ```
   *     schema.string({}, [
   *       rules.email(),
   *       rules.unique({ table: 'users', column: 'email' }),
   *     ])
   *    ```
   */
  public schema = schema.create({
    page: schema.number.optional([
      rules.unsigned()
    ]),
    per_page: schema.number.optional([
      rules.unsigned(),
      rules.range(1, 50)
    ]),
    kind: schema.enum.optional(['income', 'outgo'] as const),
    category: schema.string.optional({}, [
      rules.exists({ table: 'user_categories', column: 'id' })
    ]),
    account: schema.string.optional({}, [
      rules.exists({ table: 'user_accounts', column: 'id' })
    ]),
    month: schema.number([
      rules.range(1, 12)
    ]),
    year: schema.number.optional([
      rules.unsigned()
    ])
  })

  /**
   * Custom messages for validation failures. You can make use of dot notation `(.)`
   * for targeting nested fields and array expressions `(*)` for targeting all
   * children of an array. For example:
   *
   * {
   *   'profile.username.required': 'Username is required',
   *   'scores.*.number': 'Define scores as valid numbers'
   * }
   *
   */
  public messages = {}
}
