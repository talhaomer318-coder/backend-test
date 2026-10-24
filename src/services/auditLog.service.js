import AuditLog from "../Model/auditLog.model.js";
export const createAuditLog = async ({
  actor,
  action,
  entity,
  entityId,
  before = null,
  after = null,
}) => {
  return AuditLog.create({
    actor,
    action,
    entity,
    entityId,
    before,
    after,
  });
};