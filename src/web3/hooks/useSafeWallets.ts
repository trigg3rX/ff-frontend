import { useState, useEffect, useCallback } from "react";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { ethers } from "ethers";
import { getSafeWalletFactoryAddress } from "@/web3/chains";
import TriggerXSafeFactoryArtifact from "../artifacts/SafeFactory.json";

export const useSafeWallets = () => {
  const { walletAddress, chainId, ethereumProvider } = usePrivyWallet();
  const [safeWallets, setSafeWallets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSafeWallets = useCallback(
    async (retryCount = 0) => {
      if (!walletAddress || !chainId || !ethereumProvider) {
        setSafeWallets([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use contract method to fetch Safe wallets
        const factoryAddress = getSafeWalletFactoryAddress(chainId);
        if (!factoryAddress) {
          throw new Error(
            "Safe Wallet Factory address not configured for this network",
          );
        }

        const provider = new ethers.BrowserProvider(ethereumProvider);
        const contract = new ethers.Contract(
          factoryAddress,
          TriggerXSafeFactoryArtifact.abi,
          provider,
        );

        const wallets = await contract.getSafeWallets(walletAddress);
        setSafeWallets(wallets);
      } catch (err) {
        // Retry logic for network issues
        if (retryCount < 2) {
          setTimeout(
            () => {
              fetchSafeWallets(retryCount + 1);
            },
            2000 * (retryCount + 1),
          );
          return;
        }

        setError(
          err instanceof Error ? err.message : "Failed to fetch Safe wallets",
        );
        setSafeWallets([]);
      } finally {
        setIsLoading(false);
      }
    },
    [walletAddress, chainId, ethereumProvider],
  );

  useEffect(() => {
    fetchSafeWallets();
  }, [fetchSafeWallets]);

  return { safeWallets, isLoading, error, refetch: fetchSafeWallets };
};
