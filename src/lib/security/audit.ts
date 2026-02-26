import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type AuditInput = {
  familyId: string | null;
  actorProfileId: string | null;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditInput) {
  const admin = getSupabaseAdminClient();
  await admin.from("audit_logs").insert({
    family_id: input.familyId,
    actor_profile_id: input.actorProfileId,
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata_json: input.metadata ?? {},
  });
}
