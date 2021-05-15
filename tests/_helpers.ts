import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from 'Database/factories/UserFactory'
import type User from 'App/Models/User'
import request from 'supertest'
import { StatusCodes } from 'http-status-codes'
import faker from 'faker'

export const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

export async function cleanUpDatabase() {
  await Promise.all([
    Database.from('user_categories').delete(),
    Database.from('accounts_transactions').delete(),
    Database.from('user_accounts').delete(),
    Database.from('api_tokens').delete(),
  ])
  await Database.from('users').delete()

  return Promise.resolve()
}

export async function generateAnApiToken(user?: User): Promise<string> {
  if (!user) {
    user = await UserFactory.create()
  }

  return await request(BASE_URL)
    .post('/generate-api-token')
    .send({ email: user.email })
    .expect(StatusCodes.OK)
    .then(res => `bearer ${res.body.token}`)
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
