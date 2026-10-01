/**
 * Standalone Session Bootstrap — no health checks needed in offline local mode.
 */

export async function pingServer(_timeoutMs = 6000): Promise<boolean> {
  return true;
}
