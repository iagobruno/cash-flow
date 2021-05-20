import test from 'japa'
import { expect } from 'chai'
import request from 'supertest'
import { BASE_URL, cleanUpDatabase, generateAnApiToken } from './_helpers'
import { StatusCodes } from 'http-status-codes'
import UserFactory from 'Database/factories/UserFactory'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'
import TransactionFactory from 'Database/factories/TransactionFactory'

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

test.group('PATCH /api/me', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .patch(`/api/me`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar um erro se tentar alterar o campo "balance"', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .patch(`/api/me`)
      .send({
        balance: 1_000_000.00
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'balance')
        expect(res.body.errors[0]).to.have.property('rule', 'cannotDefine')
      })
  })

  test('Deve retornar um erro se tentar alterar o campo "email" com outro tipo de valor', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .patch(`/api/me`)
      .send({
        email: 'http://google.com'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'email')
        expect(res.body.errors[0]).to.have.property('rule', 'email')
      })

    await request(BASE_URL)
      .patch(`/api/me`)
      .send({
        email: 'lorem ipsum dolor'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'email')
        expect(res.body.errors[0]).to.have.property('rule', 'email')
      })
  })

  test('Deve retornar um erro se tentar alterar o campo "photo_url" com outro tipo de valor', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .patch(`/api/me`)
      .send({
        photo_url: 'lorem ipsum dolor'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'photo_url')
        expect(res.body.errors[0]).to.have.property('rule', 'url')
      })
  })

  test('Deve conseguir atualizar as informações o usuário logado', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)

    const newData = {
      name: 'New Name',
      email: 'new-email@gmail.com',
      photo_url: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
    }
    await request(BASE_URL)
      .patch(`/api/me`)
      .send(newData)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.not.have.property('errors')
      })

    await user.refresh()
    expect(user.name).to.equal(newData.name, 'Não conseguiu atualizar no banco de dados')
    expect(user.email).to.equal(newData.email, 'Não conseguiu atualizar no banco de dados')
    expect(user.photoUrl).to.equal(newData.photo_url, 'Não conseguiu atualizar no banco de dados')
  })

})

test.group('DELETE /api/me', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .delete(`/api/me`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve conseguir deletar o usuário logado', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .delete(`/api/me`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .then(res => {
        expect(res.body).to.not.have.property('errors')
      })

    const userToCheck = await User.find(user.id)
    expect(
      userToCheck,
      'Não conseguiu deletar o usuário do banco de dados'
    ).to.be.null
  })

  test('Deve deletar todos os dados do usuário', async () => {
    const user = await UserFactory
      .with('accounts', 3)
      .with('categories', 9)
      .create()
    await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id
    }).createMany(15)
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .delete(`/api/me`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .then(res => {
        expect(res.body).to.not.have.property('errors')
      })

    expect(
      await Database.query().from('user_accounts').where('user_id', user.id)
    ).lengthOf(0, 'Não conseguiu deletar as contas do usuário')
    expect(
      await Database.query().from('user_categories').where('user_id', user.id)
    ).lengthOf(0, 'Não conseguiu deletar as categorias do usuário')
    expect(
      await Database.query().from('accounts_transactions').where('user_id', user.id)
    ).lengthOf(0, 'Não conseguiu deletar as transações do usuário')
    expect(
      await Database.query().from('api_tokens').where('user_id', user.id)
    ).lengthOf(0, 'Não conseguiu deletar os tokens de api do usuário')
  })

})
