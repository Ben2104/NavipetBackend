import {
  TypeBoxValidatorCompiler,
  type FastifyPluginCallbackTypebox,
} from '@fastify/type-provider-typebox';

import { AppError } from '../../common/errors/app-error.js';
import { ErrorCode } from '../../common/errors/error-codes.js';
import {
  GetProfileRouteSchema,
  DeleteAvatarRouteSchema,
  UploadAvatarRouteSchema,
  UpdateProfileRouteSchema,
} from './profiles.schema.js';
import type { UpdateProfileInput } from './profiles.types.js';

const profilesRoutes: FastifyPluginCallbackTypebox = (fastify, _options, done) => {
  fastify.post('/profiles/me/avatar', {
    preHandler: fastify.authenticate,
    bodyLimit: 5 * 1024 * 1024,
    validatorCompiler: ({ schema, httpPart }) => {
      if (httpPart === 'body') return () => ({ value: true });
      return TypeBoxValidatorCompiler({
        schema,
        httpPart: httpPart ?? 'body',
        method: 'POST',
        url: '/profiles/me/avatar',
      });
    },
    schema: UploadAvatarRouteSchema,
  }, async (request) => {
    const file = await request.file();
    if (file === undefined) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        message: 'An image file is required.',
      });
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 415,
        message: 'Only JPEG, PNG, and WebP images are supported.',
      });
    }
    try {
      const upload = await fastify.supabase.uploadProfileAvatar(
        request.accessToken as string,
        request.user?.id as string,
        file.mimetype,
        await file.toBuffer(),
      );
      return upload;
    } catch (cause) {
      if (cause instanceof AppError) throw cause;
      if (cause instanceof Error && cause.name === 'RequestFileTooLargeError') {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 413,
          message: 'Avatar image must be 5 MB or smaller.',
          cause,
        });
      }
      throw new AppError({
        code: ErrorCode.UPSTREAM_ERROR,
        statusCode: 502,
        message: 'Profile storage unavailable.',
        cause,
      });
    }
  });

  fastify.delete('/profiles/me/avatar/:uploadId', {
    preHandler: fastify.authenticate,
    schema: DeleteAvatarRouteSchema,
  }, async (request, reply) => {
    try {
      const deleted = await fastify.supabase.discardProfileAvatar(
        request.accessToken as string,
        request.user?.id as string,
        request.params.uploadId,
      );
      if (!deleted) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          statusCode: 404,
          message: 'Temporary avatar not found.',
        });
      }
      reply.code(204).send();
      return;
    } catch (cause) {
      if (cause instanceof AppError) throw cause;
      throw new AppError({
        code: ErrorCode.UPSTREAM_ERROR,
        statusCode: 502,
        message: 'Profile storage unavailable.',
        cause,
      });
    }
  });

  fastify.get('/profiles/me', {
    preHandler: fastify.authenticate,
    schema: GetProfileRouteSchema,
  }, async (request) => {
    try {
      const profile = await fastify.supabase.getProfileByUserId(
        request.accessToken as string,
      );
      if (profile === null) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          statusCode: 404,
          message: 'Profile not found.',
        });
      }
      return { profile };
    } catch (cause) {
      if (cause instanceof AppError) throw cause;
      throw new AppError({
        code: ErrorCode.UPSTREAM_ERROR,
        statusCode: 502,
        message: 'Profile storage unavailable.',
        cause,
      });
    }
  });

  fastify.patch('/profiles/me', {
    preHandler: fastify.authenticate,
    schema: UpdateProfileRouteSchema,
  }, async (request) => {
    const input: UpdateProfileInput = {};
    if (request.body.displayName !== undefined) {
      const displayName = request.body.displayName.trim();
      if (displayName.length === 0) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 422,
          message: 'Display name cannot be blank.',
        });
      }
      input.displayName = displayName;
    }
    if (request.body.email !== undefined) {
      input.email = request.body.email.trim().toLowerCase();
    }
    if (request.body.role !== undefined) input.role = request.body.role;
    if (request.body.avatarUploadId !== undefined) input.avatarUploadId = request.body.avatarUploadId;

    try {
      const profile = await fastify.supabase.updateProfile(
        request.accessToken as string,
        request.user?.id as string,
        input,
      );
      if (profile === null) {
        throw new AppError({
          code: ErrorCode.NOT_FOUND,
          statusCode: 404,
          message: 'Profile not found.',
        });
      }
      return { profile };
    } catch (cause) {
      if (cause instanceof AppError) throw cause;
      throw new AppError({
        code: ErrorCode.UPSTREAM_ERROR,
        statusCode: 502,
        message: 'Profile storage unavailable.',
        cause,
      });
    }
  });

  done();
};

export default profilesRoutes;
