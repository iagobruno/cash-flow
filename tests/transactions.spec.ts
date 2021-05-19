import test from 'japa'
import { expect } from 'chai'
import request from 'supertest'
import { BASE_URL, cleanUpDatabase, generateAnApiToken } from './_helpers'
import { StatusCodes } from 'http-status-codes'
import UserFactory from 'Database/factories/UserFactory'
import Transaction from 'App/Models/Transaction'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('POST /api/transactions', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .post(`/api/transactions`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar um erro se o body não conter todos os dados obrigatórios', async () => {
    const user = await UserFactory
      .with('accounts', 1)
      .with('categories', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const fakeCategory = user.categories[0]
    const fakeAccount = user.accounts[0]

    await request(BASE_URL)
      .post(`/api/transactions`)
      .send({})
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'title')
        expect(res.body.errors[0]).to.have.property('rule', 'required')
      })

    await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Gasolina'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'amount')
        expect(res.body.errors[0]).to.have.property('rule', 'required')
      })

    await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Gasolina',
        amount: 20.00
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'account_id')
        expect(res.body.errors[0]).to.have.property('rule', 'required')
      })

    await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Gasolina',
        amount: 20.00,
        account_id: fakeAccount.id
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'category_id')
        expect(res.body.errors[0]).to.have.property('rule', 'required')
      })
  })

  test('Deve retornar um erro se o valor da transação for 0', async () => {
    const user = await UserFactory
      .with('accounts', 1)
      .with('categories', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const fakeCategory = user.categories[0]
    const fakeAccount = user.accounts[0]

    await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Bolsa',
        amount: 0,
        account_id: fakeAccount.id,
        category_id: fakeCategory.id,
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'amount')
        expect(res.body.errors[0]).to.have.property('rule', 'notIn')
      })
  })

  test('Deve retornar um erro se o usuário tentar definir o campo "kind"', async () => {
    const user = await UserFactory
      .with('accounts', 1)
      .with('categories', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const fakeCategory = user.categories[0]
    const fakeAccount = user.accounts[0]

    await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Gasolina',
        amount: 20.00,
        account_id: fakeAccount.id,
        category_id: fakeCategory.id,
        kind: 'outgo'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'kind')
        expect(res.body.errors[0]).to.have.property('rule', 'cannotDefine')
      })
  })

  test('Deve retornar um erro se o usuário tentar usar uma categoria que não existe', async () => {
    const user = await UserFactory
      .with('accounts', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const fakeAccount = user.accounts[0]

    await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Gasolina',
        amount: 20.00,
        category_id: 'fake-id',
        account_id: fakeAccount.id,
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'category_id')
        expect(res.body.errors[0]).to.have.property('rule', 'exists')
      })
  })

  test('Deve retornar um erro se o usuário tentar usar uma conta que não existe', async () => {
    const user = await UserFactory
      .with('categories', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const fakeCategory = user.categories[0]

    await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Gasolina',
        amount: 20.00,
        account_id: 'fake-id',
        category_id: fakeCategory.id,
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'account_id')
        expect(res.body.errors[0]).to.have.property('rule', 'exists')
      })
  })

  test('Deve conseguir criar uma nova transação', async () => {
    const user = await UserFactory
      .with('categories', 1)
      .with('accounts', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const category = user.categories[0]
    const account = user.accounts[0]

    const createdTransaction = await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Blusa nova',
        amount: 32.00,
        note: 'Lorem ipsum dolor',
        account_id: account.id,
        category_id: category.id,
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body)

    const transactionToCheck = await Transaction.findOrFail(createdTransaction.id)
      .then(row => row.toObject())

    expect(transactionToCheck).to.not.be.null
    expect(transactionToCheck).to.not.be.undefined
    expect(transactionToCheck).to.have.property('title', 'Blusa nova')
    expect(transactionToCheck).to.have.property('amount', 32.00)
    expect(transactionToCheck).to.have.property('note', 'Lorem ipsum dolor')
  })

  test('Deve conseguir atribuir a categoria especificada corretamente', async () => {
    const user = await UserFactory
      .with('categories', 1)
      .with('accounts', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const category = user.categories[0]
    const account = user.accounts[0]

    const createdTransaction = await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Blusa nova',
        amount: 32.00,
        account_id: account.id,
        category_id: category.id,
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body)

    const transactionToCheck = await Transaction.findOrFail(createdTransaction.id)
      .then(row => row.toObject())

    expect(transactionToCheck).to.have.property('categoryId', category.id)
  })

  test('Deve conseguir atribuir a conta especificada corretamente', async () => {
    const user = await UserFactory
      .with('categories', 1)
      .with('accounts', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const category = user.categories[0]
    const account = user.accounts[0]

    const createdTransaction = await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Blusa nova',
        amount: 32.00,
        account_id: account.id,
        category_id: category.id,
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body)

    const transactionToCheck = await Transaction.findOrFail(createdTransaction.id)
      .then(row => row.toObject())

    expect(transactionToCheck).to.have.property('accountId', account.id)
  })

  test('Deve alterar o saldo da conta associada', async () => {
    const user = await UserFactory
      .with('categories', 1)
      .with('accounts', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const category = user.categories[0]
    const account = user.accounts[0]

    await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Supermercado',
        amount: 112.43,
        account_id: account.id,
        category_id: category.id,
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)

    await account.refresh()
    expect(account.balance).to.equal(112.43)

    await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Conserto do Carro',
        amount: 350.00,
        account_id: account.id,
        category_id: category.id,
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)

    await account.refresh()
    expect(account.balance).to.equal(112.43 + 350.00)
  })

  test('Deve alterar o saldo do usuário', async () => {
    const user = await UserFactory
      .with('categories', 1)
      .with('accounts', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const category = user.categories[0]
    const account = user.accounts[0]

    await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Supermercado',
        amount: 67.24,
        account_id: account.id,
        category_id: category.id,
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body)

    await user.refresh()
    expect(user.balance).to.equal(67.24)

    await request(BASE_URL)
      .post(`/api/transactions`)
      .send({
        title: 'Produtos de higiene',
        amount: 22.41,
        account_id: account.id,
        category_id: category.id,
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body)

    await user.refresh()
    expect(user.balance).to.be.closeTo(67.24 + 22.41, 0.1)
  })

})
