import Type from 'typebox';

import { ErrorResponseSchema } from '../../common/errors/error-response.schema.js';

export const ProfileRoleSchema = Type.Union([
  Type.Literal('student'),
  Type.Literal('professor'),
]);

export const GetProfileResponseSchema = Type.Object(
  {
    profile: Type.Object({
      displayName: Type.String(),
      email: Type.Union([Type.String(), Type.Null()]),
      role: Type.Union([ProfileRoleSchema, Type.Null()]),
      avatarUrl: Type.Union([Type.String({ format: 'uri' }), Type.Null()], {
        description:
          'Temporary signed avatar URL, valid for about one hour. `null` when ' +
          'the avatar cannot be served; show a local placeholder instead.',
      }),
    }),
  },
  {
    $id: 'GetProfileResponse',
    description: 'The authenticated user profile used by the profile screen.',
  },
);

export const GetProfileRouteSchema = {
  tags: ['Profiles'],
  summary: 'Get the authenticated user profile',
  description:
    'Returns the display name, email, and role for the currently logged-in ' +
    'user. Requires `Authorization: Bearer <access_token>`.\n\n' +
    '`avatarUrl` is a temporary signed URL that expires after approximately ' +
    'one hour, or `null` when no avatar can be served.',
  security: [{ bearerAuth: [] }],
  response: {
    200: GetProfileResponseSchema,
    401: ErrorResponseSchema('Access token is missing, invalid, or expired.'),
    404: ErrorResponseSchema('The authenticated profile does not exist.'),
    502: ErrorResponseSchema('Profile storage is unavailable.'),
  },
};

export const UpdateProfileBodySchema = Type.Object(
  {
    displayName: Type.Optional(Type.String({ minLength: 1, maxLength: 80 })),
    email: Type.Optional(Type.String({
      minLength: 1,
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    })),
    role: Type.Optional(ProfileRoleSchema),
    avatarUploadId: Type.Optional(Type.String({
      format: 'uuid',
      description:
        'The uploadId returned by POST /profiles/me/avatar. Supplying it ' +
        'commits that temporary avatar when the profile is saved.',
    })),
  },
  { additionalProperties: false, minProperties: 1 },
);

export const UploadAvatarResponseSchema = Type.Object({
  uploadId: Type.String({ format: 'uuid' }),
  avatarUrl: Type.String({ format: 'uri' }),
});

export const UploadAvatarRouteSchema = {
  tags: ['Profiles'],
  summary: 'Upload a temporary profile avatar',
  description:
    'Uploads one JPEG, PNG, or WebP image to temporary Storage. The returned ' +
    '`uploadId` must be included in PATCH /profiles/me to permanently save ' +
    'the avatar. If the user discards changes, call the DELETE endpoint instead. ' +
    'Maximum size: 5 MB. The multipart field must be named `avatar`. The ' +
    'returned preview URL is temporary and expires after approximately one hour.',
  security: [{ bearerAuth: [] }],
  consumes: ['multipart/form-data'],
  body: {
    type: 'object',
    required: ['avatar'],
    properties: {
      avatar: { type: 'string', format: 'binary', description: 'Avatar image file.' },
    },
  },
  response: {
    200: UploadAvatarResponseSchema,
    400: ErrorResponseSchema(
      'The multipart body is malformed, has no file, or does not use the ' +
      '`avatar` field.',
    ),
    401: ErrorResponseSchema('Access token is missing, invalid, or expired.'),
    413: ErrorResponseSchema('The image is larger than 5 MB.'),
    415: ErrorResponseSchema(
      'The request is not multipart/form-data, or the file is not a JPEG, ' +
      'PNG, or WebP image.',
    ),
    502: ErrorResponseSchema('Profile storage is unavailable.'),
    503: ErrorResponseSchema('Avatar storage is not configured on the server.'),
  },
};

export const DeleteAvatarRouteSchema = {
  tags: ['Profiles'],
  summary: 'Discard a temporary profile avatar upload',
  description:
    'Deletes a temporary avatar upload when the user cancels profile changes. ' +
    'This endpoint must not be called after the uploadId has been committed.',
  security: [{ bearerAuth: [] }],
  params: Type.Object({ uploadId: Type.String({ format: 'uuid' }) }),
  response: {
    204: { description: 'Temporary avatar deleted.' },
    401: ErrorResponseSchema('Access token is missing, invalid, or expired.'),
    404: ErrorResponseSchema('Temporary avatar not found.'),
    422: ErrorResponseSchema('The uploadId is not a UUID.'),
    502: ErrorResponseSchema('Profile storage is unavailable.'),
    503: ErrorResponseSchema('Avatar storage is not configured on the server.'),
  },
};

export const UpdateProfileRouteSchema = {
  tags: ['Profiles'],
  summary: 'Update the authenticated user profile',
  description:
    'Updates profile fields for the currently logged-in user. Requires ' +
    '`Authorization: Bearer <access_token>`. To save a new avatar, first call ' +
    'POST /profiles/me/avatar, then include its returned `uploadId` as ' +
    '`avatarUploadId` in this request. Omitted fields keep their existing values. ' +
    'The returned avatar URL is a temporary signed URL and expires after ' +
    'approximately one hour. In Swagger, delete fields you do not want to change ' +
    'before executing.',
  security: [{ bearerAuth: [] }],
  body: UpdateProfileBodySchema,
  response: {
    200: GetProfileResponseSchema,
    400: ErrorResponseSchema('Malformed JSON body.'),
    401: ErrorResponseSchema('Access token is missing, invalid, or expired.'),
    404: ErrorResponseSchema(
      'The authenticated profile, or the avatar upload named by ' +
      '`avatarUploadId`, does not exist.',
    ),
    422: ErrorResponseSchema('The request body failed validation.'),
    502: ErrorResponseSchema('Profile storage is unavailable.'),
    503: ErrorResponseSchema('Avatar storage is not configured on the server.'),
  },
};
