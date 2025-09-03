export type Hex = `0x${string}`;

export const isHex = (value: string): value is Hex => {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
};

export const shortenHex = (hex: string) => {
  return `${hex.slice(0, 6)}...${hex.slice(-4)}`;
};
