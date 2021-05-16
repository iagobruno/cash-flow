declare module '@ioc:Adonis/Core/Validator' {
  import { Rule } from '@ioc:Adonis/Core/Validator'

  export interface Rules {
    /** Prohibit the user defined/change a specific field. */
    cannotDefine(): Rule
  }
}
