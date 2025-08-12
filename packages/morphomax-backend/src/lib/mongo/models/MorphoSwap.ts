import { BigNumber } from 'ethers';
import { Schema, model } from 'mongoose';

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

const depositSchema = new Schema(
  {
    approval: {
      approvalTxHash: { required: false, type: String }, // tx won't be sent if current allowance is enough
      approvedAmount: { required: true, type: String },
      spenderAddress: { required: true, type: String },
      tokenAddress: { required: true, type: String },
      tokenDecimals: { required: true, type: Number },
    },
    deposit: {
      amount: { required: true, type: String },
      operation: { required: true, type: String },
      timestamp: { required: true, type: Number },
      txHash: { required: true, type: String },
      vaultAddress: { required: true, type: String },
    },
  },
  {
    _id: false,
  }
);

const redeemSchema = new Schema(
  {
    amount: { required: true, type: String },
    operation: { required: true, type: String },
    timestamp: { required: true, type: Number },
    txHash: { required: true, type: String },
    vaultAddress: { required: true, type: String },
  },
  {
    _id: false,
  }
);

const transferSchema = new Schema(
  {
    amount: { required: true, type: String },
    timestamp: { required: true, type: Number },
    to: { required: true, type: String },
    tokenAddress: { required: true, type: String },
    txHash: { required: true, type: String },
  },
  {
    _id: false,
  }
);

const vaultPositionsSchema = new Schema(
  {
    __typename: { required: true, type: String },
    state: {
      __typename: { required: true, type: String },
      assets: decimalBigInt(),
      assetsUsd: { required: true, type: Number },
      id: { required: true, type: String },
      pnl: decimalBigInt(),
      pnlUsd: { required: true, type: Number },
      roe: { required: true, type: Number },
      roeUsd: { required: true, type: Number },
      shares: decimalBigInt(),
      timestamp: decimalBigInt(),
    },
    vault: {
      __typename: { required: true, type: String },
      address: { required: true, type: String },
      asset: {
        __typename: { required: true, type: String },
        address: { required: true, type: String },
        decimals: { required: true, type: Number },
        name: { required: true, type: String },
        symbol: { required: true, type: String },
      },
      id: { required: true, type: String },
      name: { required: true, type: String },
      state: {
        __typename: { required: true, type: String },
        apy: { required: true, type: Number },
        avgApy: { required: true, type: Number },
        avgNetApy: { required: true, type: Number },
        netApy: { required: true, type: Number },
      },
      symbol: { required: true, type: String },
      whitelisted: { required: true, type: Boolean },
    },
  },
  {
    _id: false,
  }
);
const userPositionsSchema = new Schema(
  {
    __typename: { required: true, type: String },
    id: { required: true, type: String },
    user: {
      __typename: { required: true, type: String },
      vaultPositions: { default: [], required: true, type: [vaultPositionsSchema] },
    },
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
const morphoSwapSchemaDefinition = {
  deposits: { default: [], required: true, type: [depositSchema] },
  pkpInfo: {
    required: true,
    type: {
      ethAddress: { required: true, type: String },
      publicKey: { required: true, type: String },
      tokenId: { required: true, type: String },
    },
  },
  redeems: { default: [], required: false, type: [redeemSchema] },
  scheduleId: {
    index: true,
    required: true,
    type: Schema.Types.ObjectId,
  },
  success: { required: true, type: Boolean },
  topVault: { required: false, type: vaultSchema },
  transfers: {
    default: [],
    required: false,
    type: [transferSchema],
  },
  userPositions: { default: [], required: false, type: [userPositionsSchema] },
  userTokenBalances: { default: [], required: true, type: [tokenBalanceSchema] },
} as const;

const MorphoSwapSchema = new Schema(morphoSwapSchemaDefinition, { timestamps: true });

// Create compound indices for common query patterns
MorphoSwapSchema.index({ createdAt: 1, scheduleId: 1 });

export const MorphoSwap = model('MorphoSwap', MorphoSwapSchema);
