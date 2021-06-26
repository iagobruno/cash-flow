import type { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class AppProvider {
  constructor (protected app: ApplicationContract) {
  }

  public register () {
    // Register your own bindings
  }

  public async boot () {
    // IoC container is ready
    const { BaseModel } = await import('@ioc:Adonis/Lucid/Orm')
    const { default: Database } = await import('@ioc:Adonis/Lucid/Database')
    const { default: CamelCaseNamingStrategy } = await import('App/Services/OrmNamingStrategy')

    BaseModel.namingStrategy = new CamelCaseNamingStrategy()
    Database.SimplePaginator.namingStrategy = new CamelCaseNamingStrategy()
  }

  public async ready () {
    // App is ready
  }

  public async shutdown () {
    // Cleanup, since app is going down
  }
}

// run github action 5
