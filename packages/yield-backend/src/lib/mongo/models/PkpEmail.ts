import { Schema, model } from 'mongoose';

const pkpEmailSchemaDefinition = {
  email: {
    required: true,
    type: String,
    validate: {
      message: '{VALUE} is not a valid email address',
      validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    },
  },
  pkpAddress: {
    index: true,
    required: true,
    type: String,
    unique: true,
  },
} as const;

const pkpEmailSchema = new Schema(pkpEmailSchemaDefinition, { timestamps: true });

export const PkpEmail = model('PkpEmail', pkpEmailSchema);
