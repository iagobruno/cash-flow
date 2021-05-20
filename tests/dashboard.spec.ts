import test from 'japa'
import { expect } from 'chai'
import request from 'supertest'
import { BASE_URL, cleanUpDatabase, deepConsoleLog, generateAnApiToken } from './_helpers'
import { StatusCodes } from 'http-status-codes'
import UserFactory from 'Database/factories/UserFactory'
import { DateTime } from 'luxon'

test.group('GET /api/dashboard', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .get(`/api/dashboard`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar a lista de transações do usuário', async () => {
    const {
      user,
      expectedTransactionsLength
    } = await createFakeDashboardData()
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .get(`/api/dashboard`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('transactions')
        expect(res.body.transactions).to.be.an('array').with.lengthOf(expectedTransactionsLength)

        res.body.transactions.forEach(item => {
          expect(item).to.have.property('user_id', user.id, 'Retornou uma transação de outro usuário')
        })
      })
  })

  test('Deve retornar a lista de contas do usuário', async () => {
    const {
      user,
      expectedAccountsLength,
    } = await createFakeDashboardData()
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .get(`/api/dashboard`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('accounts')
        expect(res.body.accounts).to.be.an('array').with.lengthOf(expectedAccountsLength)

        res.body.accounts.forEach(item => {
          expect(item).to.have.property('user_id', user.id, 'Retornou uma transação de outro usuário')
        })
      })
  })

  test('Deve retornar o relatório do mês atual', async () => {
    const {
      user,
      expectedMonthBalance,
      expectedIncomeBalance,
      expectedOutgoBalance
    } = await createFakeDashboardData()
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .get(`/api/dashboard`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('month_report')
        const { month_report } = res.body
        expect(month_report).to.have.property('name', DateTime.now().get('monthLong'), 'Retornou o balanço de outro mês')
        expect(month_report).to.have.property('balance', expectedMonthBalance, 'O balanço do mês tá errado')
        expect(month_report).to.have.property('income_balance', expectedIncomeBalance)
        expect(month_report).to.have.property('outgo_balance', expectedOutgoBalance)
        const expectedSavings = parseFloat(((expectedIncomeBalance - expectedOutgoBalance) / expectedIncomeBalance * 100).toFixed(2))
        expect(month_report).to.have.property('savings', expectedSavings)
      })
  })

  test('Deve permitir retornar o relatório do outro mês', async () => {
    const otherDate = DateTime.now().minus({ months: 1 })
    const {
      user,
      expectedMonthBalance,
      expectedIncomeBalance,
      expectedOutgoBalance,
      expectedTransactionsLength
    } = await createFakeDashboardData({
      trans_createdAt: otherDate
    })
    const apiToken = await generateAnApiToken(user)

    const data = await request(BASE_URL)
      .get(`/api/dashboard`)
      .query({
        month: otherDate.get('month'),
        year: otherDate.get('year')
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body)

    expect(data).to.have.property('month_report')
    const { month_report } = data
    expect(month_report).to.have.property('name', DateTime.now().get('monthLong'), 'Retornou o balanço de outro mês')
    expect(month_report).to.have.property('balance', expectedMonthBalance, 'O balanço do mês tá errado')
    expect(month_report).to.have.property('income_balance', expectedIncomeBalance)
    expect(month_report).to.have.property('outgo_balance', expectedOutgoBalance)
    const expectedSavings = parseFloat(((expectedIncomeBalance - expectedOutgoBalance) / expectedIncomeBalance * 100).toFixed(2))
    expect(month_report).to.have.property('savings', expectedSavings)

    expect(data).to.have.property('transactions')
    expect(data.transactions).to.be.an('array').with.lengthOf(expectedTransactionsLength)
    data.transactions.forEach(item => {
      expect(item).to.have.property('user_id', user.id, 'Retornou uma transação de outro usuário')
    })
  })

})



async function createFakeDashboardData(opts: any = {}) {
  const { trans_createdAt } = opts

  const user = await UserFactory.create()

  const userAccount1 = await user.related('accounts').create({
    name: 'Carteira',
    icon: 'currency',
    color: '#000',
  })
  const userAccount2 = await user.related('accounts').create({
    name: 'Conta Corrente',
    icon: 'nubank',
    color: '#000',
  })

  const userIncomeCategory = await user.related('categories').create({
    name: 'Freela',
    kind: 'income',
    icon: 'job',
    color: '#000',
  })
  const userOutgoCategory1 = await user.related('categories').create({
    name: 'Supermercado',
    kind: 'outgo',
    icon: 'cart',
    color: '#000',
  })
  const userOutgoCategory2 = await user.related('categories').create({
    name: 'Contas',
    kind: 'outgo',
    icon: 'boleto',
    color: '#000',
  })
  const userOutgoCategory3 = await user.related('categories').create({
    name: 'Entretenimento',
    kind: 'outgo',
    icon: 'tv',
    color: '#000',
  })

  const otherUser = await UserFactory
    .with('accounts', 2)
    .with('categories', 3)
    .create()

  const t1 = await user.related('transactions').create({
    title: 'Salário',
    amount: 600.00,
    userId: user.id,
    accountId: userAccount1.id,
    categoryId: userIncomeCategory.id,
    createdAt: trans_createdAt
  })
  const t2 = await user.related('transactions').create({
    title: 'Supermercado',
    amount: -55.50,
    userId: user.id,
    accountId: userAccount1.id,
    categoryId: userOutgoCategory1.id,
    createdAt: trans_createdAt
  })
  const t3 = await user.related('transactions').create({
    title: 'Conta de Luz',
    amount: -92.00,
    userId: user.id,
    accountId: userAccount1.id,
    categoryId: userOutgoCategory2.id,
    createdAt: trans_createdAt
  })
  const t4 = await user.related('transactions').create({
    title: 'Spotify',
    amount: -16.99,
    userId: user.id,
    accountId: userAccount1.id,
    categoryId: userOutgoCategory3.id,
    createdAt: trans_createdAt
  })

  return {
    user,
    otherUser,

    expectedTransactionsLength: 4,
    expectedAccountsLength: 2,

    expectedMonthBalance: t1.amount + t2.amount + t3.amount + t4.amount,
    expectedUserBalance: t1.amount + t2.amount + t3.amount + t4.amount,

    expectedIncomeBalance: t1.amount,
    expectedOutgoBalance: Math.abs(t2.amount + t3.amount + t4.amount)
  }
}
