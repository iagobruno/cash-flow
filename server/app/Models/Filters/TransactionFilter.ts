import { BaseModelFilter } from '@ioc:Adonis/Addons/LucidFilter'
import type { ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
import type TransactionsFiltersValidator from 'App/Validators/TransactionsFiltersValidator'
import Transaction from 'App/Models/Transaction'
import { now } from 'App/helpers'

type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>
}
type T = NonNullableFields<TransactionsFiltersValidator['schema']['props']>

/**
 * @see https://github.com/lookinlab/adonis-lucid-filter
 */
export default class TransactionFilter extends BaseModelFilter {
  public $query: ModelQueryBuilderContract<typeof Transaction, Transaction>


  public kind(value: T['kind']) {
    if (value === 'income') {
      this.$query.where('amount', '>', 0)
    }
    else if (value === 'outgo') {
      this.$query.where('amount', '<', 0)
    }
  }

  public month(value: T['month']) {
    this.$query.whereRaw('EXTRACT(MONTH FROM created_at) = ?', [value])
  }

  public year(value: T['year'] = now.get('year')) {
    this.$query.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [value])
  }

  public category(value: T['category']) {
    this.$query.where('category_id', '=', value)
  }

  public account(value: T['account']) {
    this.$query.where('account_id', '=', value)
  }

  // public method (value: any): void {
  //   this.$query.where('name', value)
  // }
}
