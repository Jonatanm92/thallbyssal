# TASK_005_DEMO_AUDITION_PAGE

## Goal

Create an internal demo/audition HTML page that can list rendered clips when real renders exist. It must work with placeholders/dry-run now.

## Allowed Files

- `AMP_SIM_LAB/demo-site`
- `AMP_SIM_LAB/test-harness`
- `AMP_SIM_LAB/reports`
- Internal docs for demo/audition usage

## Forbidden Files

- DSP/core sound files
- Public launch or marketing deployment files
- Checkout, licensing, telemetry, auth, DRM, cloud sync, or analytics code
- Copyrighted audio, riffs, artist names, brand names, song names, or trademarked amp model names

## Explicit No-DSP Rule

Do not modify DSP/core sound files. The page is a viewer for existing render outputs only.

## Step-by-Step Instructions

1. Read existing render result JSON and report index scripts.
2. Design an internal-only static HTML page.
3. List render jobs, status, metrics, and available clip links.
4. Support placeholder rows when real renders do not exist.
5. Keep all references local and internal.
6. Add status text that avoids tone-quality claims.
7. Wire the page into report index only if safe and internal.

## Required Tests

- `npm run lab:audition`
- `npm run lab:report-index`
- `npm run lab:test`
- `npm test -- --run`
- `npm run build`

## Stop Condition

Stop if the page becomes public marketing, requires external services, or needs DSP/core changes.

## Summary Format

- files changed
- tests run
- pass/fail
- whether DSP/core was touched
- whether original DI files were changed
- blockers
- next recommended task
