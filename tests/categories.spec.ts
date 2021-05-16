import test from 'japa'
import { expect } from 'chai'
import request from 'supertest'
import { BASE_URL, cleanUpDatabase, generateAnApiToken } from './_helpers'
import { StatusCodes } from 'http-status-codes'
import UserFactory from 'Database/factories/UserFactory'

test.group('GET /api/categories/:id', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .get(`/api/categories/1`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar um erro 404 se a conta não existir', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .get(`/api/categories/9999`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.NOT_FOUND)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.contain('E_ROW_NOT_FOUND')
      })
  })

  test('Deve retornar um erro se um usuário tentar buscar uma categoria de outro usuário', async () => {
    const user = await UserFactory.create()
    const otherUser = await UserFactory
      .with('categories', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const categoryToTryView = otherUser.categories[0]

    await request(BASE_URL)
      .get(`/api/categories/${categoryToTryView.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.FORBIDDEN)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.contain('E_AUTHORIZATION_FAILURE')
      })
  })

  test('Deve conseguir retornar as informações de uma conta se estiver tudo ok', async () => {
    const user = await UserFactory
      .with('categories', 2)
      .create()
    const apiToken = await generateAnApiToken(user)
    const category = user.categories[0]

    await request(BASE_URL)
      .get(`/api/categories/${category.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.not.be.undefined
        expect(res.body).to.have.property('name', category.name, 'Não retornou a conta certa')
        expect(res.body).to.have.property('kind', category.kind, 'Não retornou a conta certa')
        expect(res.body).to.have.property('icon', category.icon, 'Não retornou a conta certa')
        expect(res.body).to.have.property('user_id', user.id, 'Retornou a conta de outro usuário')
      })
  })
})
