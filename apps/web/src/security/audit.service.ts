import { supabase } from "../services/supabase";

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

const getLocalAuditLogs = (): AuditLogEntry[] => {
  const stored = localStorage.getItem("trademind_audit_logs");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through
    }
  }
  return [];
};

const saveLocalAuditLogs = (logs: AuditLogEntry[]) => {
  localStorage.setItem("trademind_audit_logs", JSON.stringify(logs));
};

export const auditService = {
  /**
   * Log a security or trading action to audit trails.
   */
  async logAction(
    action: string,
    resourceType: string | null = null,
    resourceId: string | null = null,
    metadata: Record<string, any> | null = null
  ): Promise<AuditLogEntry> {
    
    // Retrieve current auth user ID
    let userId = "mock-user-id";
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      } else {
        // Check if bypassed
        if (localStorage.getItem("bypass_auth") === "true") {
          userId = "mock-user-id";
        }
      }
    } catch {
      // Fail silently
    }

    const ipAddress = "192.168.1.42"; // Mock local IP for developer environment
    const newLog: AuditLogEntry = {
      id: `aud-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      ip_address: ipAddress,
      metadata,
      created_at: new Date().toISOString()
    };

    // Try Supabase operations
    try {
      const { error } = await supabase
        .from("audit_logs")
        .insert({
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          ip_address: ipAddress,
          metadata
        });
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase audit logging failed; syncing locally.", err);
    }

    // Sync Local Storage fallback
    const localLogs = getLocalAuditLogs();
    localLogs.unshift(newLog);
    // Limit to latest 100 logs
    saveLocalAuditLogs(localLogs.slice(0, 100));

    return newLog;
  },

  /**
   * Fetch audit logs (restricted by RLS policies on database to admin users).
   */
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data && data.length > 0) return data as AuditLogEntry[];
    } catch (err) {
      console.warn("Supabase audit logs fetch failed; using local storage.", err);
    }
    return getLocalAuditLogs().slice(0, 50);
  }
};

export default auditService;
