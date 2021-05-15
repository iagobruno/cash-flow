import test from 'japa'
import { expect } from 'chai'
import request from 'supertest'
import { BASE_URL, cleanUpDatabase, generateAnApiToken } from './_helpers'
import { StatusCodes } from 'http-status-codes'
import Account from 'App/Models/Account'
import { UserFactory } from 'Database/factories/UserFactory'

test.group('POST /api/accounts', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .post(`/api/accounts`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar um erro se o body não conter todos os dados obrigatórios', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .post(`/api/accounts`)
      .send({})
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'name')
        expect(res.body.errors[0]).to.have.property('rule', 'required')
      })

    await request(BASE_URL)
      .post(`/api/accounts`)
      .send({
        name: 'Conta Corrente',
        initial_balance: 27.00
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'icon')
        expect(res.body.errors[0]).to.have.property('rule', 'required')
      })

    await request(BASE_URL)
      .post(`/api/accounts`)
      .send({
        name: 'Conta Corrente',
        initial_balance: 27.00,
        icon: 'nubank'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'color')
        expect(res.body.errors[0]).to.have.property('rule', 'required')
      })
  })

  test('Deve atribuir corretamente ao usuário logado', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)

    const createdAccount = await request(BASE_URL)
      .post(`/api/accounts`)
      .send({
        name: 'Conta Corrente',
        initial_balance: 23.00,
        icon: 'nubank',
        color: '#000'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body)

    expect(user!.id).to.equal(createdAccount.user_id)
  })

  test('Deve conseguir criar uma conta', async () => {
    const apiToken = await generateAnApiToken()
    const data = {
      name: 'Conta Corrente',
      balance: 23.00,
      icon: 'nubank',
      color: '#000'
    }

    const createdAccount = await request(BASE_URL)
      .post(`/api/accounts`)
      .send({
        initial_balance: data.balance,
        ...data
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.not.have.property('errors')
        return res.body
      })

    await Account.find(createdAccount.id)
      .then(row => {
        expect(row, 'Não conseguiu salvar no banco de dados').to.not.be.null
        expect(row, 'Não conseguiu salvar no banco de dados').to.not.be.undefined
        expect(row!.toObject()).to.include(data, 'Não conseguiu salvar os dados corretamente no banco de dados')
      })
  })

  test('Deve alterar o balanço total do usuário', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .post(`/api/accounts`)
      .send({
        name: 'Conta Corrente',
        initial_balance: 23.50,
        icon: 'nubank',
        color: '#000'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)

    await user.refresh()
    expect(user.balance).to.equal(23.50, 'Não alterou corretamente o saldo do usuário')

    await request(BASE_URL)
      .post(`/api/accounts`)
      .send({
        name: 'Conta Poupança',
        initial_balance: 50.00,
        icon: 'nubank',
        color: '#000'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)

    await user.refresh()
    expect(user.balance).to.equal(23.50 + 50.00, 'Não alterou corretamente o saldo do usuário')
  })

  test('Deve criar uma transferência de "Saldo inicial" quando criar uma conta com saldo inicial', async () => {
    const apiToken = await generateAnApiToken()

    const accountId = await request(BASE_URL)
      .post(`/api/accounts`)
      .send({
        name: 'Conta Corrente',
        initial_balance: 59.40,
        icon: 'nubank',
        color: '#000'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .then(res => res.body.id)

    const account = await Account.findOrFail(accountId)
    await account.load('transactions')

    expect(account.transactions).to.not.be.undefined
    expect(account.transactions).to.be.an('array').with.lengthOf(1)
    expect(account.transactions[0].toObject()).to.include({
      title: 'Saldo inicial',
      amount: 59.40
    })
  })

})
