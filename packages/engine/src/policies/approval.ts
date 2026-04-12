const AUTO_CANCEL_HOURS = 48

export interface ApprovalPolicyInput {
  createdAt: string
  now: Date
}

export interface ApprovalPolicyDecision {
  shouldAutoCancel: boolean
  reason: string
}

export function evaluateApprovalLifecycle(
  input: ApprovalPolicyInput
): ApprovalPolicyDecision {
  const hoursSinceCreated =
    (input.now.getTime() - new Date(input.createdAt).getTime()) / 3600000

  if (hoursSinceCreated >= AUTO_CANCEL_HOURS) {
    return {
      shouldAutoCancel: true,
      reason: `approval pending for ${Math.round(hoursSinceCreated)} hours (auto-cancel threshold: ${AUTO_CANCEL_HOURS}h)`,
    }
  }

  return {
    shouldAutoCancel: false,
    reason: `${Math.round(AUTO_CANCEL_HOURS - hoursSinceCreated)} hours until auto-cancel`,
  }
}
