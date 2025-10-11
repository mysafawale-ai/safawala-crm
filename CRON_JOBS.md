# Scheduled Cleanup Jobs

This project uses Vercel Cron to permanently remove customers that were soft-deleted more than 30 days ago and have no related records.

## Endpoint

- Path: `/api/cron/cleanup-customers`
- Method: `GET`
- Auth: provide header `X-Cron-Secret: <secret>`

Set the environment variable `CRON_SECRET` in your Vercel project.

## Vercel Cron Configuration

In Vercel dashboard → Project → Settings → Cron Jobs, add a job:

- Schedule: `0 3 * * *` (daily at 03:00 UTC)
- Target: `Production`
- Path: `/api/cron/cleanup-customers`
- Headers:
  - `X-Cron-Secret: <your-secret>`

## How it works

1. Users delete a customer → API sets `deleted_at`, `deleted_by`, optional `delete_reason`.
2. List and detail APIs exclude records where `deleted_at` is not null.
3. The cron job finds customers where `deleted_at <= now() - 30 days`.
4. If no bookings exist for a customer, it performs a hard delete. Otherwise, it skips.

## Optional Enhancements

- Add similar soft-delete pattern to other entities.
- Provide a restore endpoint (`PATCH /api/customers/:id/restore`) clearing `deleted_at`.
- Show a Recycle Bin view filtered by `deleted_at IS NOT NULL`.
