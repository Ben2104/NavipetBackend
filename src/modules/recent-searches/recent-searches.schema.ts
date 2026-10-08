import Type from 'typebox';

import { ErrorResponseSchema } from '../../common/errors/error-response.schema.js';
import { PublicCampusResultSchema } from '../campus/campus.schema.js';

const PlaceIdSchema = Type.Object(
  {
    placeId: Type.String({
      pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
    }),
  },
  { additionalProperties: false },
);

const RecentSearchSchema = Type.Object(
  {
    ...PublicCampusResultSchema.properties,
    searchedAt: Type.String(),
  },
  { additionalProperties: false },
);

const RecentSearchResponseSchema = Type.Object({
  recentSearch: PublicCampusResultSchema,
});

const RecentSearchesResponseSchema = Type.Object({
  recentSearches: Type.Array(RecentSearchSchema),
});

const RecentSearchesQuerySchema = Type.Object(
  { limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 20 })) },
  { additionalProperties: false },
);

const commonErrors = {
  401: ErrorResponseSchema('Authentication is required.'),
  422: ErrorResponseSchema('Request input failed validation.'),
  429: ErrorResponseSchema('Too many requests.'),
  502: ErrorResponseSchema('Recent search storage is unavailable.'),
};

export const CreateRecentSearchRouteSchema = {
  tags: ['Recent searches'],
  summary: 'Save a selected campus place',
  description:
    'Records that the authenticated user picked a campus place, so it ' +
    'appears in `GET /recent-searches`.\n\n' +
    'Requires `Authorization: Bearer <access_token>`. Each user can read ' +
    'and write only their own list.\n\n' +
    '---\n\n' +
    'Send the `id` of a campus result from `GET /autocomplete` as ' +
    '`placeId`.\n\n' +
    'The place is looked up again on the server; the stored copy comes ' +
    'from the database, not from the request.\n\n' +
    'Saving a place that is already in the list refreshes its timestamp ' +
    'instead of adding a duplicate, so the call is safe to repeat.\n\n' +
    'A well-formed UUID with no matching place returns 404.\n\n' +
    'A temporary Mapbox result (`mapbox:` prefixed `id`) cannot be saved ' +
    'and returns 422.',
  security: [{ bearerAuth: [] }],
  body: PlaceIdSchema,
  response: { 201: RecentSearchResponseSchema, 404: ErrorResponseSchema('Campus place not found.'), ...commonErrors },
};

export const ListRecentSearchesRouteSchema = {
  tags: ['Recent searches'],
  summary: 'Get recent selected campus places',
  description:
    "Returns the authenticated user's saved places, most recently " +
    'searched first.\n\n' +
    'Requires `Authorization: Bearer <access_token>`. Each user sees only ' +
    'their own list.\n\n' +
    'Each entry carries the place fields plus a `searchedAt` timestamp.\n\n' +
    '`limit` defaults to 10 and is capped at 20.\n\n' +
    'A user with no history gets an empty array, not a 404.',
  security: [{ bearerAuth: [] }],
  querystring: RecentSearchesQuerySchema,
  response: { 200: RecentSearchesResponseSchema, ...commonErrors },
};

export const ClearRecentSearchesRouteSchema = {
  tags: ['Recent searches'],
  summary: 'Clear all recent selected campus places',
  description:
    'Deletes every recent search that belongs to the authenticated ' +
    'user.\n\n' +
    'Requires `Authorization: Bearer <access_token>`. Takes no request ' +
    "body, and never touches another user's history.\n\n" +
    'There is no per-entry delete.\n\n' +
    'Clearing an already-empty history also returns 204.\n\n' +
    '`DELETE /recent-searches` and `DELETE /all-recent-searches` behave ' +
    'identically.',
  security: [{ bearerAuth: [] }],
  response: {
    204: { description: 'Recent searches cleared. No response body.' },
    ...commonErrors,
  },
};
