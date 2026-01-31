// Handles on-chain module verification with retry logic

import { ethers } from "ethers";
import SafeArtifact from "@/web3/artifacts/Safe.json";
import { getSafeModuleAddress } from "@/web3/chains";

/**
 * Verify that module is enabled for a Safe (with retry logic)
 * @param safeAddress - Safe wallet address
 * @param chainId - Chain ID
 * @param provider - Ethereum provider
 * @param maxRetries - Maximum number of retries (default 3)
 * @param delayMs - Delay between retries in ms (default 2000)
 * @returns true if module is enabled, false otherwise
 */
export async function verifyModuleEnabled(
  safeAddress: string,
  chainId: number,
  provider: ethers.Eip1193Provider,
  maxRetries: number = 3,
  delayMs: number = 2000,
): Promise<boolean> {
  const moduleAddress = getSafeModuleAddress(chainId);

  if (!moduleAddress) {
    throw new Error(`Module address not configured for chain ${chainId}`);
  }

  const ethersProvider = new ethers.BrowserProvider(provider);
  const safeContract = new ethers.Contract(
    safeAddress,
    SafeArtifact.abi,
    ethersProvider,
  );

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const isEnabled: boolean =
        await safeContract.isModuleEnabled(moduleAddress);
      return isEnabled;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If not the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * Math.pow(1.5, attempt)),
        );
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to verify module status after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`,
  );
}
