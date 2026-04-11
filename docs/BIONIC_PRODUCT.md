# BIONIC_PRODUCT

## Product
- Product name: `Bionic`
- Core runner: `Bionic Engine`

## Core Idea
A self-operating foundation for an individual developer or small team running multiple services.
AI observes, learns, and acts within defined boundaries.
Human audits, approves escalations, and expands AI authority over time.
Transparency is non-negotiable: every action is logged and explainable.

## Problem We Solve
For solo developers and small teams, the biggest bottleneck is operations, maintenance, and support:
- Bug reports need to be understood and acted upon
- Version changes create potential issues that need prediction
- Failures need to be detected and repaired
- The same problems keep recurring

## Three-Phase Vision

### Phase 1 (Now): Intelligent Secretary
- AI observes, classifies, and proposes actions
- Human approves with minimal friction
- All actions are recorded in an audit log
- Value: Answer "what actually needs me right now?" across all running services

### Phase 2 (6 months): Trust-Based Delegation
- Proven repair patterns are automated
- New patterns require approval
- Human handles exceptions only

### Phase 3 (1 year+): Autonomous Operations
- AI understands bug reports and proposes fixes
- AI predicts issues from version changes
- AI detects and repairs failures autonomously
- Human audits and handles critical decisions only
- Trust score dynamically expands automation boundaries

## Design Principles

### Two-Axis Alert Design
- Axis 1: Severity (critical / warning / info) → affects notification intensity
- Axis 2: Repair mode (automatic / approval_required / manual) → affects action taken
- These axes are independent

### Approval UX
- Notification: Discord (as a compatible messaging app) → awareness only
- Approval: CLI or Bionic App when starting work → natural workflow integration
- No timeout-based auto-approval

### Automation Boundaries
Auto-execute (safe, reversible):
- Notifications, alert creation, digest execution, job retry (idempotent only), cache clear

Approval required (side effects, risk):
- Deploy rollback, service restart, DB rollback, config changes, external API calls

Never auto-execute:
- Auth/secret changes, billing changes, user data deletion, permission changes

### Notification Policy
- Critical alerts: notify twice (immediate + 30min if unresolved)
- Quiet hours (23:00-07:00 JST): critical only (status=down or payment_failed)
- Stale approvals: re-notify at 24h, auto-cancel at 48h

## Initial Shape
- `Bionic Engine`: local independent background runner
- `@bionic/sdk`: thin integration client
- `Bionic CLI`: terminal operations + approval interface
- `Bionic App`: desktop-first UI, initially web-based

## Phase 1 Success
- Medini sends health events through the SDK
- Important research arrives as a weekly digest
- Alerts are visible in one screen
- All engine actions are recorded in audit log
- The system is worth checking daily even without self-repair
