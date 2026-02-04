// Contract addresses (update after deployment)
export const SENDER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SENDER_CONTRACT_ADDRESS || "0x92DDd525e67b06557f4129fCb677Ec67DDEEdf90";
export const RECEIVER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_RECEIVER_CONTRACT_ADDRESS || "0xcdfFbcfF4C350d0B72A4319cfa3c4a36DBe7c439";

// Chain IDs
export const SEPOLIA_CHAIN_ID = 11155111;
export const AMOY_CHAIN_ID = 80002;

// Chainlink CCIP Router addresses
export const CCIP_SEPOLIA_ROUTER = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";
export const CCIP_AMOY_ROUTER = "0x1035CabC275068e0F4b745A29CEDf38E13aF41b1";

// Proof deadline (30 minutes in seconds)
export const PROOF_DEADLINE = 30 * 60;

// Contract ABIs - imported from compiled artifacts
import senderAbi from "./sender-abi.json";
import receiverAbi from "./receiver-abi.json";

export const SENDER_ABI = senderAbi;
export const RECEIVER_ABI = receiverAbi;

// Role enum values
export const Role = {
  NONE: 0,
  CREATOR: 1,
  DONOR: 2,
};
