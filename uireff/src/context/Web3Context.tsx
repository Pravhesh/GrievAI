"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider } from 'ethers';

interface Web3ContextProps {
  account: string | null;
  provider: BrowserProvider | null;
}

const Web3Context = createContext<Web3ContextProps | null>(null);

interface Web3ProviderProps {
  children: ReactNode;
}

declare global {
  interface Window {
    ethereum: any;
  }
}

export const Web3Provider = ({ children }: Web3ProviderProps) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  useEffect(() => {
    if ((window as any).ethereum) {
      const provider = new BrowserProvider((window as any).ethereum);
      setProvider(provider);
      provider.send('eth_requestAccounts', []).then((accounts: string[]) => {
        setAccount(accounts[0]);
      });
    } else {
      console.error('MetaMask not detected');
    }
  }, []);

  return (
    <Web3Context.Provider value={{ account, provider }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
