import { UserId } from '../entities/authn/entities.authn';
import { MageError, PermissionDeniedError, permissionDenied, InvalidInputError } from './app.api.global.errors';


export interface AuthenticatedRequest  {
  user: UserId
}

/**
 * This type simply maps a union of types only if the types extend from MageError.
 */
export type AnyMageError<KnownErrors> = KnownErrors extends MageError<infer Code, infer Data> ? MageError<Code, Data> : never

export class AppResponse<Success, KnownErrors> {

  static success<Success, KnownErrors>(result: Success): AppResponse<Success, AnyMageError<KnownErrors>> {
    return new AppResponse<Success, AnyMageError<KnownErrors>>(result, null)
  }

  static error<Success, KnownErrors>(result: AnyMageError<KnownErrors>): AppResponse<Success, AnyMageError<KnownErrors>> {
    return new AppResponse<Success, AnyMageError<KnownErrors>>(null, result)
  }

  static resultOf<Success, KnownErrors>(promise: Promise<Success | AnyMageError<KnownErrors>>): Promise<AppResponse<Success, AnyMageError<KnownErrors>>> {
    return promise.then(
      successOrKnownError => {
        if (successOrKnownError instanceof MageError) {
          return AppResponse.error(successOrKnownError)
        }
        return AppResponse.success(successOrKnownError)
      })
  }

  private constructor(readonly success: Success | null, readonly error: KnownErrors | null) {}
}

/**
 * This type provides a shorthand to map the given operation type argument to
 * its known, checked errors that its Promise might resolve in an [AppResponse].
 */
export type KnownErrorsOf<T> = T extends (...args: any[]) => Promise<AppResponse<infer Success, infer KnownErrors>> ?
  Success extends MageError<any, any> ? never :
  KnownErrors extends MageError<any, any> ? KnownErrors :
  never : never

/**
 * Wait for the given permission check to resolve.  If the permission check
 * succeeds, perform the given operation and return the result as an
 * [AppResponse].  If the permission check fails, return an error [AppResponse]
 * with a [PermissionDeniedError]  This function provides a simple way to always
 * return the appropriate [AppResponse] an app operation requires.
 *
 * @param permissionCheck a Promise that resolves to a permission result
 * @param op the operation to perform if the permission check succeeds
 */
export async function withPermission<Success, KnownErrors>(
  permissionCheck: Promise<PermissionDeniedError | null>,
  op: (...args: any[]) => Promise<Success | AnyMageError<KnownErrors>>): Promise<AppResponse<Success, AnyMageError<KnownErrors | PermissionDeniedError>>> {
  const denied = await permissionCheck
  if (denied) {
    return AppResponse.error<Success, PermissionDeniedError>(denied)
  }
  return await AppResponse.resultOf<Success, KnownErrors>(op())
}
