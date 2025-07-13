import React from 'react';
import { useWeb3 } from '../context/Web3Context';

const Header = () => {
  const { account } = useWeb3();

  return (
    <header className="flex justify-between items-center p-4 bg-gray-800 text-white">
      <h1 className="text-xl font-bold">GrievAI</h1>
      {account ? (
        <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
      ) : (
        <button
          onClick={() => window.ethereum?.request({ method: 'eth_requestAccounts' })}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Connect Wallet
        </button>
      )}
    </header>
  );
};

export default Header;
