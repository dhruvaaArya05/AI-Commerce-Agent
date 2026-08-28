import auditLog from "../models/auditLog.js";

export async function createAuditLog({
  userId = null,
  action,
  entityType = null,
  entityId = null,
  details = {}
}) {
  try {
    await auditLog.create({
      userId,
      action,
      entityType,
      entityId,
      details
    });

    return {
      success: true
    };
  } catch (error) {
    console.error(
      "Audit log error:",
      error
    );

    // Audit logging should never break
    // the actual shopping operation.
    return {
      success: false
    };
  }
}

