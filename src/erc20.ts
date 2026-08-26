import { Interface } from 'ethers';

export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function transfer(address,uint256) returns (bool)',
];

const iface = new Interface(ERC20_ABI);

export function encodeTransfer(to: string, amount: bigint) {
  return iface.encodeFunctionData('transfer', [to, amount]);
}

export function encodeApprove(spender: string, amount: bigint) {
  return iface.encodeFunctionData('approve', [spender, amount]);
}
