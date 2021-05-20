import test from 'japa'
import { expect } from 'chai'
import request from 'supertest'
import { BASE_URL, cleanUpDatabase, generateAnApiToken } from './_helpers'
import { StatusCodes } from 'http-status-codes'
import UserFactory from 'Database/factories/UserFactory'

test.group('GET /api/me', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .get(`/api/me`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar os dados do usuário logado', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .get(`/api/me`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.not.have.property('errors')
        expect(res.body).to.have.property('id', user.id, 'Não retornou o usuário solicitado')
        expect(res.body).to.have.property('name', user.name, 'Não retornou o usuário solicitado')
      })
  })

})
