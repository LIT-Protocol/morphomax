import { BigNumber } from 'ethers';
import mongoose, { Schema, model } from 'mongoose';

const decimalBigInt = (extra: Partial<Record<string, any>> = {}) => ({
  get(value: string) {
    return BigNumber.from(value);
  },
  required: true,
  set(value: BigNumber | string | number) {
    if (BigNumber.isBigNumber(value)) return value.toString();
    if (typeof value === 'number') return value.toLocaleString('en-US', { useGrouping: false });
    return value;
  },
  type: String,
  validate: {
    message: '{VALUE} is not a valid decimal string',
    validator: (v: string) => /^\d+$/.test(v),
  },
  ...extra,
});

const approvalBaseSchema = new Schema(
  {
    amount: { required: true, type: String },
    status: { enum: ['success', 'error'], required: true, type: String },
    tokenAddress: { required: true, type: String },
  },
  { _id: false, discriminatorKey: 'status', strict: true }
);

const approvalSuccessSchema = new Schema(
  {
    spenderAddress: { required: true, type: String },
    transaction: { type: String }, // tx won't be sent if current allowance is enough
    userop: { type: String },
  },
  { _id: false, strict: true }
);

const approvalErrorSchema = new Schema(
  {
    error: { required: true, type: String },
  },
  { _id: false, strict: true }
);

const depositBaseSchema = new Schema(
  {
    amount: { required: true, type: String },
    status: { enum: ['success', 'error'], required: true, type: String },
    vaultAddress: { required: true, type: String },
  },
  { _id: false, discriminatorKey: 'status', strict: true }
);

const depositSuccessSchema = new Schema(
  {
    transaction: { required: true, type: String },
    userop: { type: String },
  },
  { _id: false, strict: true }
);

const depositErrorSchema = new Schema(
  {
    error: { required: true, type: String },
  },
  { _id: false, strict: true }
);

const redeemBaseSchema = new Schema(
  {
    amount: { required: true, type: String },
    status: { enum: ['success', 'error'], required: true, type: String },
    vaultAddress: { required: true, type: String },
  },
  { _id: false, discriminatorKey: 'status', strict: true }
);

const redeemSuccessSchema = new Schema(
  {
    transaction: { required: true, type: String },
    userop: { type: String },
  },
  { _id: false, strict: true }
);

const redeemErrorSchema = new Schema(
  {
    error: { required: true, type: String },
  },
  { _id: false, strict: true }
);

const depositSchema = new Schema(
  {
    approval: { required: true, type: approvalBaseSchema },
    deposit: { required: true, type: depositBaseSchema },
  },
  { _id: false }
);
const approvalSubdocument = depositSchema.path(
  'approval'
) as unknown as mongoose.Schema.Types.Subdocument<any>;
approvalSubdocument.discriminator('success', approvalSuccessSchema);
approvalSubdocument.discriminator('error', approvalErrorSchema);

const depositSubdocument = depositSchema.path(
  'deposit'
) as unknown as mongoose.Schema.Types.Subdocument<any>;
depositSubdocument.discriminator('success', depositSuccessSchema);
depositSubdocument.discriminator('error', depositErrorSchema);

const redeemsArrayItem = redeemBaseSchema;

const userPositionsSchema = new Schema(
  {
    address: { required: true, type: String },
    assets: decimalBigInt(),
    shares: decimalBigInt(),
  },
  {
    _id: false,
  }
);

const vaultAssetSchema = new Schema(
  {
    address: { required: true, type: String },
    decimals: { required: true, type: Number },
    name: { required: true, type: String },
    symbol: { required: true, type: String },
  },
  {
    _id: false,
  }
);

const vaultStateSchema = new Schema(
  {
    apy: { required: true, type: Number },
    avgApy: { required: true, type: Number },
    avgNetApy: { required: true, type: Number },
    netApy: { required: true, type: Number },
  },
  {
    _id: false,
  }
);

const vaultSchema = new Schema(
  {
    address: { required: true, type: String },
    asset: { required: true, type: vaultAssetSchema },
    chain: {
      id: { required: true, type: Number },
      network: { required: true, type: String },
    },
    id: { required: true, type: String },
    name: { required: true, type: String },
    state: { required: true, type: vaultStateSchema },
    symbol: { required: true, type: String },
    whitelisted: { required: true, type: Boolean },
  },
  {
    _id: false,
  }
);

const tokenBalanceSchema = new Schema(
  {
    address: { required: true, type: String },
    balance: decimalBigInt(),
    decimals: { required: true, type: Number },
  },
  {
    _id: false,
  }
);

// Swap operations are all arrays to be prepared to support multiple tokens and chains
const yieldSwapSchemaDefinition = {
  deposits: { default: [], required: true, type: [depositSchema] },
  pkpInfo: {
    required: true,
    type: {
      ethAddress: { required: true, type: String },
      publicKey: { required: true, type: String },
      tokenId: { required: true, type: String },
    },
  },
  redeems: { default: [], required: false, type: [redeemsArrayItem] },
  scheduleId: {
    index: true,
    required: true,
    type: Schema.Types.ObjectId,
  },
  success: { required: true, type: Boolean },
  topVault: { required: false, type: vaultSchema },
  userPositions: { default: [], required: false, type: [userPositionsSchema] },
  userTokenBalances: { default: [], required: true, type: [tokenBalanceSchema] },
} as const;

const yieldSwapSchema = new Schema(yieldSwapSchemaDefinition, { timestamps: true });

const redeemsSubdocument = yieldSwapSchema.path(
  'redeems'
) as unknown as mongoose.Schema.Types.DocumentArray;
redeemsSubdocument.discriminator('success', redeemSuccessSchema);
redeemsSubdocument.discriminator('error', redeemErrorSchema);

// Create compound indices for common query patterns
yieldSwapSchema.index({ createdAt: 1, scheduleId: 1 });

export const YieldSwap = model('MorphoSwap', yieldSwapSchema); // TODO https://linear.app/litprotocol/issue/DREL-996/heroku-vercel-db-migration
