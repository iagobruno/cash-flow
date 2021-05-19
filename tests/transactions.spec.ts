import test from 'japa'
import { expect } from 'chai'
import request from 'supertest'
import { BASE_URL, cleanUpDatabase, generateAnApiToken } from './_helpers'
import { StatusCodes } from 'http-status-codes'
import UserFactory from 'Database/factories/UserFactory'
import Transaction from 'App/Models/Transaction'
import Database from '@ioc:Adonis/Lucid/Database'
import TransactionFactory from 'Database/factories/TransactionFactory'
import faker from 'faker'
import { DateTime } from 'luxon'

const now = DateTime.now()

test.group('GET /api/transactions', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .get(`/api/transactions`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar um erro se o usuário não especificar um mês', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .get(`/api/transactions`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'month')
        expect(res.body.errors[0]).to.have.property('rule', 'required')
      })
  })

  test('Deve ser uma resposta paginada', async () => {
    const user = await UserFactory
      .with('accounts')
      .with('categories')
      .create()
    await TransactionFactory
      .merge({
        userId: user.id,
        accountId: user.accounts[0].id,
        categoryId: user.categories[0].id,
      })
      .createMany(5)
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        month: now.get('month')
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.not.have.property('errors')
        expect(res.body).to.have.property('meta')
        expect(res.body.meta).to.have.property('total')
        expect(res.body.meta).to.have.property('current_page')
        expect(res.body).to.have.property('data')
        expect(res.body.data).to.be.an('array')
      })
  })

  test('Deve retornar a lista de transações do usuário', async () => {
    const user = await UserFactory
      .with('accounts')
      .with('categories')
      .create()
    await TransactionFactory
      .merge({
        userId: user.id,
        accountId: user.accounts[0].id,
        categoryId: user.categories[0].id,
      })
      .createMany(5)
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        month: now.get('month')
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.not.have.property('errors')
        expect(res.body.data).to.be.an('array').with.lengthOf(5)
        res.body.data.forEach(transaction => {
          expect(transaction).to.have.property('amount')
          expect(transaction).to.have.property('title')
          expect(transaction).to.have.property('kind')
        })
      })
  })

  test('Deve retornar SOMENTE as transações do usuário logado', async () => {
    const user = await UserFactory
      .with('accounts', 1, (a) => a.merge({ balance: 0 }))
      .with('categories')
      .create()
    await TransactionFactory
      .merge({
        userId: user.id,
        accountId: user.accounts[0].id,
        categoryId: user.categories[0].id,
      })
      .createMany(10)
    const apiToken = await generateAnApiToken(user)

    const otherUser = await UserFactory
      .with('accounts')
      .with('categories')
      .create()
    await TransactionFactory
      .merge({
        userId: otherUser.id,
        accountId: otherUser.accounts[0].id,
        categoryId: otherUser.categories[0].id,
      })
      .createMany(6)

    const transactions = await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        month: now.get('month')
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body.data as unknown[])

    expect(transactions).to.be.an('array').with.lengthOf(10, 'Retornou transações de outro usuário')

    transactions.forEach(transaction => {
      expect(transaction).to.have.property('user_id', user.id, 'Retornou a transação de outro usuário')
      expect(transaction).to.not.have.property('user_id', otherUser.id, 'Retornou a transação de outro usuário')
    })
  })

  test('Deve retornar um erro se o usuário tentar buscar mais transações do que o permitido', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        per_page: 100,
        month: now.get('month')
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'per_page')
        expect(res.body.errors[0]).to.have.property('rule', 'range')
      })
  })

  test('Deve conseguir filtrar transações por despesas ou receitas', async () => {
    const user = await UserFactory
      .with('accounts', 1)
      .with('categories', 1)
      .create()
    await TransactionFactory.merge({
      amount: faker.datatype.number({ min: 1, max: 100 }),
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id,
    }).createMany(4)
    await TransactionFactory.merge({
      amount: faker.datatype.number({ min: 1, max: -100 }),
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id,
    }).createMany(6)
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        kind: 'income',
        month: now.get('month')
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body.data).to.be.an('array').with.lengthOf(4, 'Retornou transações a mais')
        res.body.data.forEach(transaction => {
          expect(transaction.amount).to.be.greaterThan(0)
        })
      })

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        kind: 'outgo',
        month: now.get('month')
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body.data).to.be.an('array').with.lengthOf(6, 'Retornou transações a mais')
        res.body.data.forEach(transaction => {
          expect(transaction.amount).to.be.lessThan(0)
        })
      })
  })

  test('Deve conseguir filtrar transações por categoria', async () => {
    const user = await UserFactory
      .with('accounts', 1)
      .with('categories', 2)
      .create()
    const [category1, category2] = user.categories
    await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: category1.id,
    }).createMany(3)
    await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: category2.id,
    }).createMany(2)
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        category: category1.id,
        month: now.get('month')
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body.data).to.be.an('array').with.lengthOf(3, 'Retornou transações a mais')
        res.body.data.forEach(transaction => {
          expect(transaction).to.have.property('category_id', category1.id, 'Retornou transações de outra categoria')
          expect(transaction).to.not.have.property('category_id', category2.id, 'Retornou transações de outra categoria')
        })
      })
  })

  test('Deve retornar um erro se tentar filtrar usando uma categoria que não existe', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        category: 'FAKE-CAT-ID',
        month: now.get('month')
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'category')
        expect(res.body.errors[0]).to.have.property('rule', 'exists')
      })
  })

  test('Deve conseguir filtrar transações por conta', async () => {
    const user = await UserFactory
      .with('accounts', 2)
      .with('categories', 1)
      .create()
    const [account1, account2] = user.accounts
    await TransactionFactory.merge({
      userId: user.id,
      accountId: account1.id,
      categoryId: user.categories[0].id,
    }).createMany(3)
    await TransactionFactory.merge({
      userId: user.id,
      accountId: account2.id,
      categoryId: user.categories[0].id,
    }).createMany(2)
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        account: account1.id,
        month: now.get('month')
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body.data).to.be.an('array').with.lengthOf(3, 'Retornou transações a mais')
        res.body.data.forEach(transaction => {
          expect(transaction).to.have.property('account_id', account1.id, 'Retornou transações de outra conta')
          expect(transaction).to.not.have.property('account_id', account2.id, 'Retornou transações de outra conta')
        })
      })
  })

  test('Deve retornar um erro se tentar filtrar usando uma conta que não existe', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        account: 'FAKE-ACC-ID',
        month: now.get('month')
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'account')
        expect(res.body.errors[0]).to.have.property('rule', 'exists')
      })
  })

  test('Deve conseguir filtrar transações por mês', async () => {
    const user = await UserFactory
      .with('accounts', 2)
      .with('categories', 1)
      .create()

    await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id,
      createdAt: DateTime.now().set({ month: 4 })
    }).createMany(3)
    await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id,
      createdAt: DateTime.now().set({ month: 5 })
    }).createMany(2)
    await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id,
      createdAt: DateTime.now().set({ month: 6 })
    }).createMany(4)

    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        month: 4
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body.data).to.be.an('array').with.lengthOf(3, 'Retornou transações a mais')
        res.body.data.forEach(transaction => {
          const month = DateTime.fromISO(transaction.created_at).get('month')
          expect(month).to.equal(4, 'Retornou uma transação de outro mês')
        })
      })

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        month: 5
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body.data).to.be.an('array').with.lengthOf(2, 'Retornou transações a mais')
        res.body.data.forEach(transaction => {
          const month = DateTime.fromISO(transaction.created_at).get('month')
          expect(month).to.equal(5, 'Retornou uma transação de outro mês')
        })
      })

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        month: 6
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body.data).to.be.an('array').with.lengthOf(4, 'Retornou transações a mais')
        res.body.data.forEach(transaction => {
          const month = DateTime.fromISO(transaction.created_at).get('month')
          expect(month).to.equal(6, 'Retornou uma transação de outro mês')
        })
      })
  })

  test('Deve conseguir filtrar transações de um dia específico', async () => {
    const user = await UserFactory
      .with('accounts', 2)
      .with('categories', 1)
      .create()

    await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id,
      createdAt: DateTime.now().set({ month: 4, day: 21 })
    }).createMany(3)
    await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id,
      createdAt: DateTime.now().set({ month: 4, day: 15 })
    }).createMany(5)

    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        month: 4,
        day: 15
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body.data).to.be.an('array').with.lengthOf(5, 'Retornou transações a mais')
        res.body.data.forEach(transaction => {
          const day = DateTime.fromISO(transaction.created_at).get('day')
          expect(day).to.equal(15, 'Retornou uma transação de outro dia')
        })
      })

    await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        month: 4,
        day: 21
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body.data).to.be.an('array').with.lengthOf(3, 'Retornou transações a mais')
        res.body.data.forEach(transaction => {
          const day = DateTime.fromISO(transaction.created_at).get('day')
          expect(day).to.equal(21, 'Retornou uma transação de outro dia')
        })
      })
  })

  test('A lista deve está ordenada por mais recentes primeiro', async () => {
    const user = await UserFactory
      .with('accounts', 2)
      .with('categories', 1)
      .create()

    await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id,
      createdAt: DateTime.now().set({ month: 8, day: 6 })
    }).create()
    await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id,
      createdAt: DateTime.now().set({ month: 8, day: 10 })
    }).create()
    await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id,
      createdAt: DateTime.now().set({ month: 8, day: 15 })
    }).create()

    const apiToken = await generateAnApiToken(user)

    const list = await request(BASE_URL)
      .get(`/api/transactions`)
      .query({
        month: 8,
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body.data)

    for (let index = 0; index < list.length; index++) {
      const currentItem = list[index]
      const lastItem = list[index - 1]
      if (!lastItem) continue

      const currentDate = DateTime.fromISO(currentItem.created_at)
      const lastDate = DateTime.fromISO(lastItem.created_at)
      const isMoreRecentThanPrevious = currentDate.diff(lastDate, 'milliseconds')
        .toObject().milliseconds! <= 0

      expect(
        isMoreRecentThanPrevious,
        'A lista não está ordenada corretamente'
      ).to.be.true
    }
  })

})

test.group('GET /api/transactions/:id', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .get(`/api/transactions/1`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar um erro 404 se a transação não existir', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .get(`/api/transactions/9999`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.NOT_FOUND)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.contain('E_ROW_NOT_FOUND')
      })
  })

  test('Deve retornar um erro se um usuário tentar buscar uma transação de outro usuário', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)

    const otherUser = await UserFactory
      .with('accounts', 1)
      .with('categories', 1)
      .create()
    const transactionToTryView = await TransactionFactory.merge({
      userId: otherUser.id,
      accountId: otherUser.accounts[0].id,
      categoryId: otherUser.categories[0].id
    }).create()

    await request(BASE_URL)
      .get(`/api/transactions/${transactionToTryView.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.FORBIDDEN)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.contain('E_AUTHORIZATION_FAILURE')
      })
  })

  test('Deve conseguir retornar as informações de uma transação se estiver tudo ok', async () => {
    const user = await UserFactory
      .with('accounts', 1)
      .with('categories', 1)
      .create()
    const apiToken = await generateAnApiToken(user)

    const transaction = await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id
    }).create()

    await request(BASE_URL)
      .get(`/api/transactions/${transaction.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.not.be.undefined
        expect(res.body).to.have.property('title', transaction.title, 'Não retornou a transação certa')
        expect(res.body).to.have.property('amount', transaction.amount, 'Não retornou a transação certa')
        expect(res.body).to.have.property('note', transaction.note, 'Não retornou a transação certa')
        expect(res.body).to.have.property('user_id', user.id, 'Retornou a transação de outro usuário')
      })
  })
})

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

test.group('DELETE /api/transactions/:id', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .delete(`/api/transactions/1`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar um erro 404 se a transação não existir', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .delete(`/api/transactions/9999`)
      .send({})
      .set('Authorization', apiToken)
      .expect(StatusCodes.NOT_FOUND)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.contain('E_ROW_NOT_FOUND')
      })
  })

  test('Deve retornar um erro se um usuário tentar deletar uma transação de outro usuário', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)

    const otherUser = await UserFactory
      .with('categories', 1)
      .with('accounts')
      .create()
    const transactionToTryDelete = await TransactionFactory.merge({
      userId: otherUser.id,
      accountId: otherUser.accounts[0].id,
      categoryId: otherUser.categories[0].id
    }).create()

    await request(BASE_URL)
      .delete(`/api/transactions/${transactionToTryDelete.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.FORBIDDEN)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.contain('E_AUTHORIZATION_FAILURE')
      })
  })

  test('Deve conseguir deletar uma transação', async () => {
    const user = await UserFactory
      .with('categories', 1)
      .with('accounts', 1)
      .create()
    const apiToken = await generateAnApiToken(user)

    const transactionToDelete = await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id
    }).create()
    await TransactionFactory.merge({
      userId: user.id,
      accountId: user.accounts[0].id,
      categoryId: user.categories[0].id
    }).create()

    await request(BASE_URL)
      .delete(`/api/transactions/${transactionToDelete.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)

    const userTransactions = await user.related('transactions').query()

    expect(
      userTransactions,
      'Não conseguiu deletar a transação no banco de dados'
    ).to.be.an('array').with.lengthOf(1)
    expect(userTransactions[0].title).to.not.equal(transactionToDelete.title)
  })

  test('Deve alterar o saldo da conta associada', async () => {
    const user = await UserFactory
      .with('categories', 1)
      .with('accounts', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const category = user.categories[0]
    const account = user.accounts[0]

    const transaction1 = await TransactionFactory.merge({
      amount: 69.99,
      userId: user.id,
      categoryId: category.id,
      accountId: account.id
    }).create()
    const transaction2 = await TransactionFactory.merge({
      amount: -23.50,
      userId: user.id,
      categoryId: category.id,
      accountId: account.id
    }).create()

    await account.refresh()
    expect(account.balance).to.be.closeTo(69.99 + -23.50, 0.1, 'Não alterou o saldo da conta ao CRIAR uma transação')

    await request(BASE_URL)
      .delete(`/api/transactions/${transaction2.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)

    await account.refresh()
    expect(account.balance).to.be.closeTo(69.99, 0.1, 'Não diminuiu o saldo da conta após deletar a transação')
  })

  test('Deve alterar o saldo do usuário', async () => {
    const user = await UserFactory
      .with('categories', 1)
      .with('accounts', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const category = user.categories[0]
    const account = user.accounts[0]

    const transaction1 = await TransactionFactory.merge({
      amount: 69.99,
      userId: user.id,
      categoryId: category.id,
      accountId: account.id
    }).create()
    const transaction2 = await TransactionFactory.merge({
      amount: -23.50,
      userId: user.id,
      categoryId: category.id,
      accountId: account.id
    }).create()

    await user.refresh()
    expect(user.balance).to.be.closeTo(69.99 + -23.50, 0.1, 'Não alterou o saldo do usuário ao CRIAR uma transação')

    await request(BASE_URL)
      .delete(`/api/transactions/${transaction2.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)

    await user.refresh()
    expect(user.balance).to.be.closeTo(69.99, 0.1, 'Não diminuiu o saldo da conta após deletar a transação')
  })

})
