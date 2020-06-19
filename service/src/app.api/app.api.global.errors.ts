
export const ErrPermissionDenied = Symbol.for('err.permission_denied')
export const ErrInvalidInput = Symbol.for('err.invalid_input')
export const ErrEntityNotFound = Symbol.for('err.entity_not_found')

export type PermissionDeniedError = MageError<typeof ErrPermissionDenied, PermissionDeniedErrorData>
export type InvalidInputError = MageError<typeof ErrInvalidInput, InvalidInputErrorData>
export type EntityNotFoundError = MageError<typeof ErrEntityNotFound, EntityNotFoundErrorData>

export class MageError<Code extends symbol, Data = null> extends Error {
  constructor(public readonly code: Code, readonly data: Data, message?: string) {
    super(message ? message : Symbol.keyFor(code))
  }
}

export interface PermissionDeniedErrorData {
  permission: string
  subject: string
}

export interface EntityNotFoundErrorData {
  readonly entityType: string
  readonly entityId: any
}

export type InvalidInputErrorData = string[]

export function permissionDenied(permission: string, subject: string): PermissionDeniedError {
  return new MageError(ErrPermissionDenied, { permission, subject }, `${subject} does not have permission ${permission}`)
}

export function entityNotFound(entityId: any, entityType: string): EntityNotFoundError {
  return new MageError(ErrEntityNotFound, { entityId, entityType }, `${entityType} not found; id: ${entityId}`)
}

export function invalidInput(...problems: string[]): InvalidInputError {
  return new MageError(ErrInvalidInput, problems, 'invalid input:\n  ' + problems.join('\n  '))
}