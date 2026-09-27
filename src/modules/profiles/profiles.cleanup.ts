import type { FastifyInstance } from 'fastify';

export const PENDING_AVATAR_CLEANUP_INTERVAL_MILLISECONDS =
  24 * 60 * 60 * 1_000;

export function startPendingAvatarCleanup(
  app: FastifyInstance,
  intervalMilliseconds = PENDING_AVATAR_CLEANUP_INTERVAL_MILLISECONDS,
): () => void {
  let running = false;

  const cleanup = async (): Promise<void> => {
    if (running) return;
    running = true;
    try {
      const deletedCount = await app.supabase.cleanupPendingProfileAvatars();
      if (deletedCount > 0) {
        app.log.info({ deletedCount }, 'Removed stale pending profile avatars');
      }
    } catch (cause) {
      app.log.warn({ cause }, 'Pending profile avatar cleanup failed');
    } finally {
      running = false;
    }
  };

  void cleanup();
  const timer = setInterval(() => {
    void cleanup();
  }, intervalMilliseconds);
  timer.unref();

  return () => {
    clearInterval(timer);
  };
}
