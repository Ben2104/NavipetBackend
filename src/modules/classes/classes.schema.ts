import Type from 'typebox';

import { ErrorResponseSchema } from '../../common/errors/error-response.schema.js';

// Status contract (all routes require a bearer token -> 401; 422 validation; 429; 502 storage):
//   GET    /classes            200
//   POST   /classes            201 | 404 building/address | 409 time conflict or duplicate
//                              422 also when an in-person class has no building
//   PATCH  /classes/:classId   200 | 404 class or building | 409 time conflict or duplicate
//                              422 also when the result is an in-person class with no building
//   DELETE /classes/:classId   204 | 404

const UuidSchema = Type.String({
  pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
});

const ClassFieldsSchema = {
  courseCode: Type.String({ minLength: 1, maxLength: 30, example: 'CECS 491A' }),
  courseName: Type.String({ minLength: 1, maxLength: 100, example: 'Software Engineering Project' }),
  building: Type.String({
    maxLength: 100,
    example: 'VEC',
    description:
      'A CSULB building name or code (e.g. "VEC" or "Vivian Engineering Center") is resolved against the ' +
      'campus dataset. Anything else (a street address, another campus, an off-campus site) is forward-geocoded ' +
      'with Mapbox instead. Either way the stored class gets a resolved display name plus latitude/longitude. ' +
      'Required for in-person classes. Optional for online classes, where it is stored as sent (possibly empty) ' +
      'and never resolved.',
  }),
  room: Type.Optional(Type.String({ maxLength: 100, example: '3-3' })),
  weekdays: Type.Array(Type.Integer({ minimum: 1, maximum: 7 }), {
    maxItems: 7,
    example: [1, 3, 5],
    description: 'ISO weekdays the class meets: 1 = Monday ... 7 = Sunday.',
  }),
  isOnline: Type.Boolean({
    example: false,
    description:
      'An online class has no physical location: no building is required and no coordinates are stored. ' +
      'A synchronous online class still occupies its time slot for conflict checks.',
  }),
};

const CLOCK_TIME_PATTERN =
  '^(([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?|(0?[1-9]|1[0-2])(:[0-5][0-9])? ?[AaPp][Mm])$';

const StoredTimeSchema = Type.String({
  pattern: '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$',
  description: '24-hour local time as stored, "HH:MM:SS".',
});

// Request-only time fields. Either `time` (a CSULB schedule range) or
// `startTime` + `endTime`; the service rejects a mix of both with 422.
const ClassTimeInputSchema = {
  startTime: Type.Optional(Type.String({
    pattern: CLOCK_TIME_PATTERN,
    example: '11:00',
    description: 'Local start time: 24-hour "HH:MM" / "HH:MM:SS", or 12-hour "4:00 PM" / "4PM". Omit when sending `time`.',
  })),
  endTime: Type.Optional(Type.String({
    pattern: CLOCK_TIME_PATTERN,
    example: '12:15',
    description: 'Local end time, same formats as `startTime`. Must be later than `startTime`. Omit when sending `time`.',
  })),
  time: Type.Optional(Type.String({
    minLength: 1,
    maxLength: 40,
    example: '4-6:45PM',
    description:
      'A CSULB schedule time range such as "8-8:50AM", "12:30-3:15PM", "4-6:45PM", or "10:30AM-1:15PM". ' +
      'AM/PM written once applies to both ends unless the range crosses noon ("11-12:15PM" is 11:00 AM-12:15 PM). ' +
      'Replaces `startTime` + `endTime`. "NA/NA" (no scheduled time) is rejected with 422.',
  })),
};

const ClassInputSchema = {
  ...ClassFieldsSchema,
  building: Type.Optional(ClassFieldsSchema.building),
  isOnline: Type.Optional(ClassFieldsSchema.isOnline),
  ...ClassTimeInputSchema,
};

const ClassResponseSchema = Type.Object(
  {
    id: UuidSchema,
    ...ClassFieldsSchema,
    room: Type.String(),
    startTime: StoredTimeSchema,
    endTime: StoredTimeSchema,
    createdAt: Type.String(),
    updatedAt: Type.String(),
  },
  {
    $id: 'ClassResponse',
    additionalProperties: false,
    description: 'The stored class, with `building` resolved to its canonical display name.',
  },
);

const ClassConflictSchema = Type.Object(
  {
    existingClassId: UuidSchema,
    existingCourse: Type.String({ example: 'CECS 274' }),
    day: Type.String({ example: 'Tu', description: 'CSULB day label: M, Tu, W, Th, F, Sa, Su.' }),
    newTime: Type.String({ example: '4:00 PM-6:45 PM' }),
    existingTime: Type.String({ example: '4:00 PM-5:50 PM' }),
    location: Type.String({ example: 'Vivian Engineering Center 3-3' }),
  },
  { additionalProperties: false },
);

// Same envelope as ErrorResponseSchema, plus the optional detail fields the
// classes service attaches to its 409s. Declared here because response
// serialization drops any property the schema does not list.
const ClassScheduleConflictResponseSchema = Type.Object(
  {
    error: Type.Object({
      code: Type.String({ example: 'CLASS_TIME_CONFLICT' }),
      message: Type.String(),
      requestId: Type.String(),
      conflicts: Type.Optional(Type.Array(ClassConflictSchema)),
      existingClassId: Type.Optional(UuidSchema),
    }),
  },
  {
    description:
      '`CLASS_TIME_CONFLICT`: the schedule overlaps an existing class on at least one shared weekday; ' +
      '`conflicts` lists every overlapping class and day.\n\n' +
      '`DUPLICATE_CLASS`: the same course code with the same schedule is already on the schedule; ' +
      '`existingClassId` names it.',
  },
);

const scheduleConflictDescription =
  '### Schedule conflicts\n\n' +
  'Two classes conflict when they share a weekday and their times overlap.\n\n' +
  'Back-to-back classes are allowed: one ending at 10:00 and one starting at 10:00 do not conflict.\n\n' +
  'A class with an empty `weekdays` list is asynchronous and never conflicts.\n\n' +
  'A conflicting or duplicate class is rejected with 409 and nothing is saved.';

const ClassIdParamsSchema = Type.Object({ classId: UuidSchema }, { additionalProperties: false });

const commonErrors = {
  401: ErrorResponseSchema('Authentication is required.'),
  422: ErrorResponseSchema('Request input failed validation.'),
  429: ErrorResponseSchema('Too many requests.'),
  502: ErrorResponseSchema('Class storage is unavailable.'),
};

export const ListClassesRouteSchema = {
  tags: ['Classes'], summary: 'List the authenticated user classes', security: [{ bearerAuth: [] }],
  description:
    "Returns every class on the authenticated user's schedule, oldest " +
    'first.\n\n' +
    'Requires `Authorization: Bearer <access_token>`, using the ' +
    '`access_token` from `POST /auth/login`.\n\n' +
    'In Swagger UI, paste the token into the "Authorize" button; it is ' +
    'then sent with every request on this page.\n\n' +
    'A user with no classes gets an empty array.',
  response: {
    200: Type.Object(
      { classes: Type.Array(ClassResponseSchema) },
      { description: "The authenticated user's classes." },
    ),
    ...commonErrors,
  },
};

export const CreateClassRouteSchema = {
  tags: ['Classes'], summary: 'Add a class to the authenticated user schedule', security: [{ bearerAuth: [] }],
  description:
    "Adds one class to the authenticated user's schedule.\n\n" +
    'Requires `Authorization: Bearer <access_token>`. The example request ' +
    'body below works as sent.\n\n' +
    '### Location\n\n' +
    '`building` accepts a CSULB building name or code, or a plain street ' +
    'address.\n\n' +
    'Either way the saved class gets a resolved display name and ' +
    'coordinates, used later for class-aware navigation. A building or ' +
    'address that cannot be found returns 404.\n\n' +
    'Set `isOnline: true` for an online class; `building` may then be ' +
    'omitted or empty.\n\n' +
    'An in-person class with no `building` returns 422.\n\n' +
    '### Time\n\n' +
    'Send the time one of two ways: `time` as a CSULB range such as ' +
    '"4-6:45PM", or `startTime` with `endTime`.\n\n' +
    '---\n\n' +
    'Sending both forms, neither form, or a time that cannot be read ' +
    'returns 422.\n\n' +
    'An end time that is not later than the start time returns 422.\n\n' +
    scheduleConflictDescription,
  body: Type.Object(ClassInputSchema, { additionalProperties: false }),
  response: {
    201: Type.Object(
      { class: ClassResponseSchema },
      { description: 'The class was created.' },
    ),
    404: ErrorResponseSchema('Building or address not found.'),
    409: ClassScheduleConflictResponseSchema,
    ...commonErrors,
  },
};

export const UpdateClassRouteSchema = {
  tags: ['Classes'], summary: 'Update one authenticated user class', security: [{ bearerAuth: [] }],
  description:
    "Changes one class on the authenticated user's schedule.\n\n" +
    'Requires `Authorization: Bearer <access_token>`.\n\n' +
    'Send only the fields being changed. An empty body returns 422.\n\n' +
    '### Location\n\n' +
    'Omitting `building` leaves the stored location untouched.\n\n' +
    'Sending `building` resolves it again, the same way ' +
    '`POST /classes` does.\n\n' +
    '---\n\n' +
    'Setting `isOnline: true` clears the stored coordinates.\n\n' +
    'Setting `isOnline: false` resolves `building` — the one sent, else ' +
    'the stored one. An empty building returns 422.\n\n' +
    '### Time\n\n' +
    '`time` replaces both `startTime` and `endTime` and cannot be ' +
    'combined with either.\n\n' +
    '---\n\n' +
    'Changing `weekdays`, `time`, `startTime`, `endTime`, or ' +
    '`courseCode` re-checks the whole class.\n\n' +
    '---\n\n' +
    'The end time must stay later than the start time (422), and the ' +
    'class must not conflict with another class on the schedule (409).\n\n' +
    scheduleConflictDescription,
  params: ClassIdParamsSchema,
  body: Type.Partial(Type.Object(ClassInputSchema, { additionalProperties: false })),
  response: {
    200: Type.Object(
      { class: ClassResponseSchema },
      { description: 'The class was updated.' },
    ),
    404: ErrorResponseSchema('Class not found, or building/address not found.'),
    409: ClassScheduleConflictResponseSchema,
    ...commonErrors,
  },
};

export const DeleteClassRouteSchema = {
  tags: ['Classes'], summary: 'Delete one authenticated user class', security: [{ bearerAuth: [] }],
  description:
    "Permanently removes one class from the authenticated user's schedule.\n\n" +
    'Requires `Authorization: Bearer <access_token>`. Takes no request body.\n\n' +
    "A `classId` that is not on the authenticated user's schedule returns 404.",
  params: ClassIdParamsSchema,
  response: { 204: { description: 'Class deleted. No response body.' }, 404: ErrorResponseSchema('Class not found.'), ...commonErrors },
};
