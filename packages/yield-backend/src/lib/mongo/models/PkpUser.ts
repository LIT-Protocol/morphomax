import { Schema, model } from 'mongoose';

const pkpUserSchemaDefinition = {
  email: {
    required: false,
    type: String,
    validate: {
      message: '{VALUE} is not a valid email address',
      validator: (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    },
  },
  pkpAddress: {
    index: true,
    required: true,
    type: String,
    unique: true,
  },
  referralOtherDetails: {
    required: false,
    type: String,
  },
  referralSource: {
    enum: ['Telegram', 'X (Twitter)', 'Galxe', 'Blog', 'Other'],
    required: false,
    type: String,
  },
} as const;

const pkpUserSchema = new Schema(pkpUserSchemaDefinition, { timestamps: true });

export const PkpUser = model('PkpUser', pkpUserSchema);
