import Database from '@ioc:Adonis/Lucid/Database'

export async function cleanUpDatabase() {
  await Promise.all([
    Database.from('user_categories').delete(),
    Database.from('account_transactions').delete(),
    Database.from('user_accounts').delete(),
    Database.from('api_tokens').delete(),
  ])
  await Database.from('users').delete()

  return Promise.resolve()
}

interface WithId {
  id: string,
  [key: string]: any,
}

export function mapIds(array: Array<WithId>): string[] {
  return array.map(item => {
    return item.id
  })
}
