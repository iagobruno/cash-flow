import test from 'japa'
import { expect } from 'chai'
import request from 'supertest'
import { BASE_URL, cleanUpDatabase, generateAnApiToken } from './_helpers'
import { StatusCodes } from 'http-status-codes'
import UserFactory from 'Database/factories/UserFactory'
import CategoryFactory from 'Database/factories/CategoryFactory'
import Category from 'App/Models/Category'

test.group('GET /api/categories', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .get(`/api/categories`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve conseguir retornar a lista de categorias do usuário logado', async () => {
    const user = await UserFactory
      .with('categories', 3)
      .create()
    const apiToken = await generateAnApiToken(user)

    const categories = await request(BASE_URL)
      .get(`/api/categories`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body as any[])

    expect(categories).to.be.an('array').with.lengthOf(3)
    categories.forEach(category => {
      expect(category).to.have.property('name')
      expect(category).to.have.property('kind')
      expect(category).to.have.property('icon')
    })
  })

  test('Deve retornar SOMENTE as categorias do usuário logado', async () => {
    const user = await UserFactory
      .with('categories', 4)
      .create()
    const otherUser = await UserFactory
      .with('categories', 2)
      .create()
    const apiToken = await generateAnApiToken(user)

    const categories = await request(BASE_URL)
      .get(`/api/categories`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body as any[])

    expect(categories).to.be.an('array').with.lengthOf(4)
    categories.forEach(category => {
      expect(category).to.have.property('userId', user.id, 'Retornou a categorias de outro usuário')
      expect(category).to.not.have.property('userId', otherUser.id, 'Retornou a categorias de outro usuário')
    })
  })

})

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

  test('Deve retornar um erro 404 se a categoria não existir', async () => {
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

  test('Deve conseguir retornar as informações de uma categoria se estiver tudo ok', async () => {
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
        expect(res.body).to.have.property('name', category.name, 'Não retornou a categoria certa')
        expect(res.body).to.have.property('kind', category.kind, 'Não retornou a categoria certa')
        expect(res.body).to.have.property('icon', category.icon, 'Não retornou a categoria certa')
        expect(res.body).to.have.property('userId', user.id, 'Retornou a categoria de outro usuário')
      })
  })
})

test.group('POST /api/categories', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .post(`/api/categories`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar um erro se o body não conter todos os dados obrigatórios', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .post(`/api/categories`)
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
      .post(`/api/categories`)
      .send({
        name: 'Salário'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'kind')
        expect(res.body.errors[0]).to.have.property('rule', 'required')
      })

    await request(BASE_URL)
      .post(`/api/categories`)
      .send({
        name: 'Salário',
        kind: 'income'
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
      .post(`/api/categories`)
      .send({
        name: 'Salário',
        kind: 'income',
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

  test('Deve retornar um erro se a categoria já existir', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .post(`/api/categories`)
      .send({
        name: 'Contas',
        kind: 'outgo',
        icon: 'boleto',
        color: '#000000'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)

    await request(BASE_URL)
      .post(`/api/categories`)
      .send({
        name: 'Contas',
        kind: 'outgo',
        icon: 'boleto',
        color: '#000000'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('field', 'name')
        expect(res.body.errors[0]).to.have.property('rule', 'unique')
      })
  })

  test('Deve atribuir corretamente ao usuário logado', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)

    const createdCategory = await request(BASE_URL)
      .post(`/api/categories`)
      .send({
        name: 'Freela',
        kind: 'income',
        icon: 'moto',
        color: '#664fff'
      })
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => res.body)

    const category = await Category.findOrFail(createdCategory.id)

    expect(category.toObject()).to.have.property('userId', user.id)
  })

  test('Deve conseguir criar uma categoria', async () => {
    const apiToken = await generateAnApiToken()
    const data = {
      name: 'Gasolina',
      kind: 'outgo',
      icon: 'nubank',
      color: '#664fff'
    }

    const createdCategory = await request(BASE_URL)
      .post(`/api/categories`)
      .send(data)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.not.have.property('errors')
        return res.body
      })

    await Category.findOrFail(createdCategory.id)
      .then(row => {
        expect(row, 'Não conseguiu salvar no banco de dados').to.not.be.null
        expect(row, 'Não conseguiu salvar no banco de dados').to.not.be.undefined
        expect(row!.toObject()).to.include(data, 'Não conseguiu salvar os dados corretamente no banco de dados')
      })
  })
})

test.group('PATCH /api/categories/:id', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .patch(`/api/categories/1`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar um erro 404 se a categoria não existir', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .patch(`/api/categories/9999`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.NOT_FOUND)
  })

  test('Deve retornar um erro se um usuário tentar atualizar uma categoria de outro usuário', async () => {
    const user = await UserFactory.create()
    const otherUser = await UserFactory
      .with('categories', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const categoryToTryUpdate = otherUser.categories[0]

    await request(BASE_URL)
      .patch(`/api/categories/${categoryToTryUpdate.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.FORBIDDEN)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.contain('E_AUTHORIZATION_FAILURE')
      })
  })

  test('Deve retornar um erro se o usuário tentar mudar o campo "kind"', async () => {
    const user = await UserFactory
      .with('categories', 1, q => {
        q.merge({ kind: 'income' })
      })
      .create()
    const apiToken = await generateAnApiToken(user)
    const categoryToTryUpdate = user.categories[0]

    await request(BASE_URL)
      .patch(`/api/categories/${categoryToTryUpdate.id}`)
      .set('Authorization', apiToken)
      .send({
        kind: 'outgo'
      })
      .expect(StatusCodes.UNPROCESSABLE_ENTITY)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
        expect(res.body.errors[0]).to.have.property('rule', 'cannotDefine')
        expect(res.body.errors[0]).to.have.property('field', 'kind')
      })
  })

  test('Deve retornar um erro se houver algum campo inválido no body', async () => {
    const user = await UserFactory
      .with('categories', 1)
      .create()
    const apiToken = await generateAnApiToken(user)
    const categoryToTryUpdate = user.categories[0]

    await request(BASE_URL)
      .patch(`/api/categories/${categoryToTryUpdate.id}`)
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

  test('Deve conseguir atualizar os dados de uma categoria se estiver tudo ok', async () => {
    const user = await UserFactory.create()
    const apiToken = await generateAnApiToken(user)
    const categoryToUpdate = await CategoryFactory.merge({ userId: user.id }).create()

    const newData = {
      name: 'Salário',
      icon: 'bradesco',
      color: '#00cae4'
    }
    await request(BASE_URL)
      .patch(`/api/categories/${categoryToUpdate.id}`)
      .send(newData)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.not.have.property('errors')
      })

    await categoryToUpdate.refresh()

    expect(categoryToUpdate.toObject()).to.include(newData, 'Não conseguiu atualizar os dados corretamente no banco de dados')
  })
})

test.group('DELETE /api/categories/:id', (group) => {

  group.beforeEach(cleanUpDatabase)

  test('Deve retornar um erro se não houver um usuário logado', async () => {
    await request(BASE_URL)
      .delete(`/api/categories/1`)
      .expect(StatusCodes.UNAUTHORIZED)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('errors')
      })
  })

  test('Deve retornar um erro 404 se a categoria não existir', async () => {
    const apiToken = await generateAnApiToken()

    await request(BASE_URL)
      .delete(`/api/categories/9999`)
      .send({})
      .set('Authorization', apiToken)
      .expect(StatusCodes.NOT_FOUND)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.contain('E_ROW_NOT_FOUND')
      })
  })

  test('Deve retornar um erro se um usuário tentar deletar uma categoria de outro usuário', async () => {
    const user = await UserFactory.create()
    const otherUser = await UserFactory
      .with('categories', 2)
      .create()
    const apiToken = await generateAnApiToken(user)
    const categoryToTryDelete = otherUser.categories[0]

    await request(BASE_URL)
      .delete(`/api/categories/${categoryToTryDelete.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.FORBIDDEN)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.contain('E_AUTHORIZATION_FAILURE')
      })
  })

  test('Deve conseguir deletar uma categoria', async () => {
    const user = await UserFactory
      .with('categories', 2)
      .create()
    const categoryToDelete = user.categories[0]
    const apiToken = await generateAnApiToken(user)

    await request(BASE_URL)
      .delete(`/api/categories/${categoryToDelete.id}`)
      .set('Authorization', apiToken)
      .expect(StatusCodes.OK)

    const userCategories = await user.related('categories').query()

    expect(
      userCategories,
      'Não conseguiu deletar a categoria no banco de dados'
    ).to.be.an('array').with.lengthOf(1)
    expect(userCategories[0].name).to.not.equal(categoryToDelete.name)
  })
})
