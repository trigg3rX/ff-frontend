import { ethers } from "ethers";
import SafeArtifact from "../artifacts/Safe.json";

/**
 * Read Safe info with retry logic
 * Fetches threshold, owners, and checks if a specific module is enabled.
 */
export const readSafeInfo = async (
  safeAddress: string,
  moduleAddress: string,
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider,
): Promise<{
  threshold: number;
  owners: string[];
  isEnabled: boolean;
}> => {
  const safeProxy = new ethers.Contract(
    safeAddress,
    SafeArtifact.abi,
    provider,
  );
  let thresholdBig: bigint | undefined;
  let owners: string[] | undefined;
  let isEnabled: boolean | undefined;
  let retryCount = 0;
  const maxRetries = 5;

  while (retryCount < maxRetries) {
    try {
      const results = await Promise.all([
        safeProxy.getThreshold(),
        safeProxy.getOwners(),
        safeProxy.isModuleEnabled(moduleAddress),
      ]);
      thresholdBig = results[0];
      owners = results[1];
      isEnabled = results[2];
      break;
    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) {
        throw error;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, retryCount)),
      );
    }
  }

  if (!thresholdBig || !owners || isEnabled === undefined) {
    throw new Error("Failed to read Safe information after retries");
  }

  return {
    threshold: Number(thresholdBig),
    owners,
    isEnabled,
  };
};

/**
 * Helper to check if a module is enabled on a Safe
 */
export const getSafeModuleStatus = async (
  safeAddress: string,
  moduleAddress: string,
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider,
): Promise<boolean> => {
  try {
    const { isEnabled } = await readSafeInfo(
      safeAddress,
      moduleAddress,
      provider,
    );
    return isEnabled;
  } catch {
    // Failed to check module status
    return false;
  }
};
