import { UserId } from '../entities/authn/entities.authn';
import { MageError, PermissionDeniedError } from './app.api.global.errors';

export interface AuthenticatedRequest  {
  user: UserId
}

export type AnyMageError = MageError<any, any>

export class AppResponse<Success, KnownErrors extends AnyMageError> {

  static success<Success, KnownErrors extends AnyMageError>(result: Success): AppResponse<Success, KnownErrors> {
    return new AppResponse<Success, KnownErrors>(result, null)
  }

  static error<Success, KnownErrors extends AnyMageError>(result: KnownErrors): AppResponse<Success, KnownErrors> {
    return new AppResponse<Success, KnownErrors>(null, result)
  }

  static async resultOf<Success, KnownErrors extends AnyMageError>(promise: Promise<Success | KnownErrors>): Promise<AppResponse<Success, KnownErrors>> {
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

export type AppOperation<Success, KnownErrors extends AnyMageError> = () => Promise<Success | KnownErrors>

export type PermittedOperation = {
  perform: <S, E extends AnyMageError>(op: AppOperation<S, E>) => Promise<AppResponse<S, E | PermissionDeniedError>>
}

export function withPermission(permissionCheck: Promise<PermissionDeniedError | null>): PermittedOperation {
  return {
    async perform<S, E extends AnyMageError>(op: AppOperation<S, E>): Promise<AppResponse<S, E | PermissionDeniedError>> {
      const denied = await permissionCheck
      if (denied) {
        return AppResponse.error(denied)
      }
      return await AppResponse.resultOf<S, E>(op())
    }
  }
}
