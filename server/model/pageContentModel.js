import mongoose from "mongoose";

const pageContentSchema = new mongoose.Schema(
  {
    pageKey: { type: String, required: true, unique: true, index: true },
    fields: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("PageContent", pageContentSchema);
