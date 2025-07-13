import React from 'react';
import { Web3Provider } from '../context/Web3Context';

const Providers = ({ children }) => {
  return <Web3Provider>{children}</Web3Provider>;
};

export default Providers;
