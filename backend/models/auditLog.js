import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false
    },

    action: {
      type: String,
      required: true
    },

    entityType: {
      type: String,
      required: false
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const auditLog = mongoose.model(
  "auditLog",
  auditLogSchema
);

export default auditLog;
