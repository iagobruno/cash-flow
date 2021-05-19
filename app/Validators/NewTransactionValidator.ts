import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class NewTransactionValidator {
  constructor (protected ctx: HttpContextContract) {
  }

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
    title: schema.string({}, [
      rules.minLength(1),
      rules.maxLength(255)
    ]),
    amount: schema.number([
      rules.notIn([0])
    ]),
    editable: schema.boolean.optional(),
    note: schema.string.optional({}, [
      rules.maxLength(255)
    ]),
    account_id: schema.string({}, [
      rules.exists({ table: 'user_accounts', column: 'id' })
    ]),
    category_id: schema.string({}, [
      rules.exists({ table: 'user_categories', column: 'id' })
    ]),
    kind: schema.string.optional({}, [
      rules.cannotDefine()
    ]),
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
