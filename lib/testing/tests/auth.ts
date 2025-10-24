import { relativeFetch } from '../http';
import { TestCase, TestContext, TestResult } from '../types';

export const authSessionTest: TestCase = {
  id: 'auth.session',
  name: 'Auth: session is valid (Supabase cookies)',
  async run(ctx: TestContext): Promise<TestResult> {
    const start = Date.now();
    try {
      const res = await relativeFetch<{ email?: string; id?: string }>(ctx, '/api/auth/user');
      const durationMs = Date.now() - start;
      if (res.status === 200 && res.data) {
        return {
          id: 'auth.session',
          name: 'Auth: session is valid (Supabase cookies)',
          status: 'pass',
          durationMs,
          details: { user: res.data },
        };
      }
      return {
        id: 'auth.session',
        name: 'Auth: session is valid (Supabase cookies)',
        status: 'fail',
        durationMs,
        error: `Expected 200 from /api/auth/user but got ${res.status}. Body: ${res.text}`,
      };
    } catch (err: any) {
      return {
        id: 'auth.session',
        name: 'Auth: session is valid (Supabase cookies)',
        status: 'fail',
        durationMs: Date.now() - start,
        error: err?.message || String(err),
      };
    }
  },
};

export const authSuite = {
  name: 'auth',
  cases: [authSessionTest],
};
