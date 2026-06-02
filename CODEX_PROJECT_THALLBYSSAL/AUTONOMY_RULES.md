# Agent Autonomy Rules

Safe assigned tasks are pre-approved.

If an agent stays inside the allowed paths for its task packet and does not hit a stop condition, it should implement, test, and report without asking the founder for permission.

## Do Not Ask For Approval For

- docs edits
- report/index polish
- validator hardening
- test-harness improvements
- beta packet templates
- market validation docs
- task packet edits
- internal-only demo/audition page work
- small bug fixes inside explicitly allowed safe paths
- command output summaries
- formatting or clarity improvements in safe docs

## Must Stop And Ask Founder First

Ask only when the task would require:

- DSP/core sound changes
- tone behavior changes
- gain staging, cab/IR, saturation, transpose, tone stack, limiter, oversampling, or preset value changes
- destructive file operations
- overwriting original DI/reference/IR/user files
- GUI automation
- fake render behavior
- checkout, licensing, DRM, telemetry, analytics, cloud sync, auth, or public launch code
- external or paid APIs
- copyrighted riffs, samples, proprietary assets, trademarked/brand/artist/song claims
- editing outside assigned allowed paths
- resolving a conflict with another agent's files

## If Unsure

If uncertainty is low risk and inside allowed paths, make a conservative choice and continue.

If uncertainty could change sound, damage files, create legal/commercial risk, or conflict with another agent, stop and write a short founder approval request.

## Required Behavior

Each agent should:

- read `AGENTS.md`
- read this file
- read its task packet
- stay inside allowed paths
- implement the task
- run required validation
- report results

Do not pause just because the task is imperfect, boring, or could be improved later. Finish the assigned safe task and recommend the next task.

