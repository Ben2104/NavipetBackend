import Type from 'typebox';

export const HealthResponseSchema = Type.Object(
  { status: Type.Literal('ok') },
  { $id: 'HealthResponse' },
);

export const HealthRouteSchema = {
  tags: ['Health'],
  summary: 'Check API process liveness',
  description:
    'Liveness probe used as the hosting platform health check.\n\n' +
    'Public — no bearer token is needed, and it is exempt from rate ' +
    'limiting.\n\n' +
    'It reports only that this process is accepting requests. It does ' +
    'not call Supabase or MultiSet, so a 200 says nothing about their ' +
    'health.',
  response: {
    200: HealthResponseSchema,
  },
};
