import mongoose from "mongoose";

const pageContentSchema = mongoose.Schema(
  {
    pageKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    // Key/value store for allowed UI text overrides (titles, button labels, placeholders, etc.)
    fields: {
      type: Map,
      of: String,
      default: {},
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

let PageContent = mongoose.model("PageContent", pageContentSchema);

export default PageContent;
