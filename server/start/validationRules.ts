import { validator } from '@ioc:Adonis/Core/Validator'

validator.rule('cannotDefine', (value, _, { errorReporter, pointer, arrayExpressionPointer }) => {
  if (typeof value !== undefined) {
    errorReporter.report(pointer, 'cannotDefine', 'You cannot define this field', arrayExpressionPointer)
    return
  }
})
