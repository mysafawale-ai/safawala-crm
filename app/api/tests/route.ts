import { NextRequest, NextResponse } from 'next/server';
import { getSuites, runSuites } from '@/lib/testing/runner';
import { TestContext } from '@/lib/testing/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin;
  const suiteParams = url.searchParams.getAll('suite');
  const suitesRequested = suiteParams.length ? suiteParams : ['auth'];

  const customerId = url.searchParams.get('customerId') || undefined;

  const ctx: TestContext = {
    baseUrl: origin,
    headers: req.headers,
    request: req,
    params: { customerId },
  };

  const suites = getSuites(suitesRequested);
  const results = await runSuites(ctx, suites);

  return NextResponse.json(results, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
