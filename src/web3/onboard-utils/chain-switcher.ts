/**
 * Chain Switcher Module
 * Handles automatic chain switching
 */

import type { ConnectedWallet } from "@privy-io/react-auth";

/**
 * Ensure wallet is on the target chain, switch if needed
 */
export async function ensureChainSelected(
  embeddedWallet: ConnectedWallet | null,
  targetChainId: number,
): Promise<void> {
  if (!embeddedWallet) {
    throw new Error("Embedded wallet not available");
  }

  try {
    await embeddedWallet.switchChain(targetChainId);
  } catch (error) {
    // Enhance error message
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to switch to chain ${targetChainId}: ${message}`);
  }
}

/**
 * Wait for chain to be active (with timeout)
 */
export async function waitForChain(
  getCurrentChainId: () => number | null,
  targetChainId: number,
  timeoutMs: number = 5000,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const currentChainId = getCurrentChainId();

    if (currentChainId === targetChainId) {
      return;
    }

    // Wait 100ms before checking again
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(
    `Timeout waiting for chain ${targetChainId} to become active`,
  );
}
