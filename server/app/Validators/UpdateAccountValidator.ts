import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { HEXColorRegex } from 'App/helpers'

export default class UpdateAccountValidator {
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
    name: schema.string.optional({ trim: true }, [
      rules.maxLength(255),
    ]),
    balance: schema.number.optional([
      rules.cannotDefine()
    ]),
    bank: schema.string.optional({ trim: true }, [
      rules.minLength(1),
      rules.maxLength(25)
    ]),
    icon: schema.string.optional({ trim: true }, [
      rules.minLength(1),
      rules.maxLength(10)
    ]),
    color: schema.string.optional({ trim: true }, [
      rules.regex(HEXColorRegex),
      rules.minLength(1),
      rules.maxLength(10)
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
