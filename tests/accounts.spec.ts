import test from 'japa'
import { expect } from 'chai'
import request from 'supertest'
import { BASE_URL, cleanUpDatabase, generateAnApiToken } from './_helpers'
import { StatusCodes } from 'http-status-codes'
import Account from 'App/Models/Account'
import UserFactory from 'Database/factories/UserFactory'
import AccountFactory from 'Database/factories/AccountFactory'

test.group('GET /api/accounts', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .get(`/api/accounts`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve conseguir retornar a lista de contas do usuário logado', async () => {
    const user = await UserFactory
      .with('accounts', 3)
      .create()
    const apiToken = await generateAnApiToken(user)

    const accounts = await request(BASE_URL)
      .get(`/api/accounts`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body as any[])

    expect(accounts).to.be.an('array').with.lengthOf(3)
    accounts.forEach(account => {
      expect(account).to.have.property('name')
      expect(account).to.have.property('balance')
      expect(account).to.have.property('bank')
    })
  })

  test('Deve retornar SOMENTE as contas do usuário logado', async () => {
    const user = await UserFactory
      .with('accounts', 4)
      .create()
    const otherUser = await UserFactory
      .with('accounts', 2)
      .create()
    const apiToken = await generateAnApiToken(user)

    const accounts = await request(BASE_URL)
      .get(`/api/accounts`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body as any[])

    expect(accounts).to.be.an('array').with.lengthOf(4)
    accounts.forEach(account => {
      expect(account).to.have.property('user_id', user.id, 'Retornou a conta de outro usuário')
      expect(account).to.not.have.property('user_id', otherUser.id, 'Retornou a conta de outro usuário')
    })
  })

})

test.group('GET /api/accounts/:id', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .get(`/api/accounts/1`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar um erro 404 se a conta não existir', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .get(`/api/accounts/9999`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.NOT_FOUND)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.contain('E_ROW_NOT_FOUND')
      })
  })

  test('Deve retornar um erro se um usuário tentar buscar as informações de uma conta de outro usuário', async () => {
    const user = await UserFactory.create()
    const otherUser = await UserFactory
      .with('accounts', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const accountToTryView = otherUser.accounts[0]

    await request(BASE_URL)
      .get(`/api/accounts/${accountToTryView.id}`)
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
      .with('accounts', 2)
      .create()
    const apiToken = await generateAnApiToken(user)
    const account = user.accounts[0]

    await request(BASE_URL)
      .get(`/api/accounts/${account.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.not.be.undefined
        expect(res.body).to.have.property('name', account.name, 'Não retornou a conta certa')
        expect(res.body).to.have.property('balance', account.balance, 'Não retornou a conta certa')
        expect(res.body).to.have.property('bank', account.bank, 'Não retornou a conta certa')
        expect(res.body).to.have.property('user_id', user.id, 'Retornou a conta de outro usuário')
      })
  })
})

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
        color: '#664fff'
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
      color: '#664fff'
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

    await Account.findOrFail(createdAccount.id)
      .then(row => {
        expect(row, 'Não conseguiu salvar no banco de dados').to.not.be.null
        expect(row, 'Não conseguiu salvar no banco de dados').to.not.be.undefined
        expect(row!.toObject()).to.include(data, 'Não conseguiu salvar os dados corretamente no banco de dados')
      })
  })

  test('Deve criar uma transferência de "Saldo inicial" quando criar uma conta com saldo inicial', async () => {
    const apiToken = await generateAnApiToken()

    const accountId = await request(BASE_URL)
      .post(`/api/accounts`)
      .send({
        name: 'Conta Corrente',
        initial_balance: 59.40,
        icon: 'nubank',
        color: '#664fff'
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

  test('Deve alterar o balanço total do usuário', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .post(`/api/accounts`)
      .send({
        name: 'Conta Corrente',
        initial_balance: 23.50,
        icon: 'nubank',
        color: '#664fff'
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
        color: '#664fff'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)

    await user.refresh()
    expect(user.balance).to.equal(23.50 + 50.00, 'Não alterou corretamente o saldo do usuário')
  })
})

test.group('PATCH /api/accounts/:id', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .patch(`/api/accounts/1`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar um erro 404 se a conta não existir', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .patch(`/api/accounts/9999`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.NOT_FOUND)
  })

  test('Deve retornar um erro se um usuário tentar atualizar uma conta de outro usuário', async () => {
    const user = await UserFactory.create()
    const otherUser = await UserFactory
      .with('accounts', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const accountToTryUpdate = otherUser.accounts[0]

    await request(BASE_URL)
      .patch(`/api/accounts/${accountToTryUpdate.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.FORBIDDEN)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.contain('E_AUTHORIZATION_FAILURE')
      })
  })

  test('Deve retornar um erro se o usuário tentar mudar o campo "balance"', async () => {
    const user = await UserFactory
      .with('accounts', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const accountToTryUpdate = user.accounts[0]

    await request(BASE_URL)
      .patch(`/api/accounts/${accountToTryUpdate.id}`)
      .set('Authorization', apiToken)
      .send({
        balance: 1000.00
      })
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('rule', 'cannotDefine')
        expect(res.body.errors[0]).to.have.property('field', 'balance')
      })
  })

  test('Deve retornar um erro se houver algum campo inválido no body', async () => {
    const user = await UserFactory
      .with('accounts', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const accountToTryUpdate = user.accounts[0]

    await request(BASE_URL)
      .patch(`/api/accounts/${accountToTryUpdate.id}`)
      .set('Authorization', apiToken)
      .send({
        color: 'red'
      })
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('rule', 'regex')
        expect(res.body.errors[0]).to.have.property('field', 'color')
      })
  })

  test('Deve conseguir atualizar os dados de uma conta se estiver tudo ok', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)
    const accountToUpdate = await AccountFactory.merge({ userId: user.id }).create()

    const newData = {
      name: 'Conta Corrente no Bradesco',
      bank: 'Bradesco',
      icon: 'bradesco',
      color: '#00cae4'
    }
    await request(BASE_URL)
      .patch(`/api/accounts/${accountToUpdate.id}`)
      .send(newData)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.not.have.property('errors')
      })

    await accountToUpdate.refresh()

    expect(accountToUpdate.toObject()).to.include(newData, 'Não conseguiu atualizar os dados corretamente no banco de dados')
  })
})

test.group('DELETE /api/accounts/:id', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .delete(`/api/accounts/1`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar um erro 404 se a conta não existir', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .delete(`/api/accounts/9999`)
      .send({})
      .set('Authorization', apiToken)
      .expect(StatusCodes.NOT_FOUND)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.contain('E_ROW_NOT_FOUND')
      })
  })

  test('Deve retornar um erro se um usuário tentar deletar uma conta de outro usuário', async () => {
    const user = await UserFactory.create()
    const otherUser = await UserFactory
      .with('accounts', 2)
      .create()
    const apiToken = await generateAnApiToken(user)
    const accountToTryDelete = otherUser.accounts[0]

    await request(BASE_URL)
      .delete(`/api/accounts/${accountToTryDelete.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.FORBIDDEN)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.contain('E_AUTHORIZATION_FAILURE')
      })
  })

  test('Deve conseguir deletar uma conta', async () => {
    const user = await UserFactory
      .with('accounts', 2)
      .create()
    const accountToDelete = user.accounts[0]
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .delete(`/api/accounts/${accountToDelete.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)

    const userAccounts = await user.related('accounts').query()

    expect(
      userAccounts,
      'Não conseguiu deletar a conta no banco de dados'
    ).to.be.an('array').with.lengthOf(1)
    expect(userAccounts[0].name).to.not.equal(accountToDelete.name)
  })
})
