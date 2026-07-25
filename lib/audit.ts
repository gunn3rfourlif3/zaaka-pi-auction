import { prisma } from './prisma';

export type AuditEvent = 'BID' | 'SETTLE' | 'PAYOUT' | 'CONFIRM' | 'REFUND';

export interface AuditEntry {
  eventType: AuditEvent;
  actor?: string | null;
  auctionId?: number | null;
  amount?: number | null;
  piPaymentId?: string | null;
  meta?: Record<string, unknown> | null;
}

/**
 * Append an immutable audit record for a money-affecting event. Best-effort:
 * never throws, so audit-write failures cannot roll back or break the primary
 * transaction. Pass a Prisma transaction client as `tx` to record inside the
 * same transaction where appropriate.
 */
export async function audit(entry: AuditEntry, tx: any = prisma): Promise<void> {
  try {
    await tx.audit_log.create({
      data: {
        event_type: entry.eventType,
        actor: entry.actor ?? null,
        auction_id: entry.auctionId ?? null,
        amount: entry.amount ?? null,
        pi_payment_id: entry.piPaymentId ?? null,
        meta: entry.meta ? JSON.stringify(entry.meta) : null,
      },
    });
  } catch (err) {
    console.error('audit() failed:', err);
  }
}
