import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

// Deposit address configuration (replace with actual company wallet)
const COMPANY_DEPOSIT_ADDRESS = '0xb04DeC4eDA0F1f20113dc57e23C9D3475E3ce15c';

// Asset deposit types
const SUPPORTED_ASSETS = [
  { 
    symbol: 'NRK', 
    name: 'Nordek', 
    decimals: 18,
    contractAddress: null // Native token
  }
];

// ERC-20 ABI for token transfers
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) public view returns (uint256)",
  "function decimals() public view returns (uint8)"
];

const AssetDepositApp: React.FC = () => {
  // Wallet connection state
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  // Deposit state
  const [selectedAsset, setSelectedAsset] = useState(SUPPORTED_ASSETS[0]);
  const [depositAmount, setDepositAmount] = useState('');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [balance, setBalance] = useState('0');
  const [depositStatus, setDepositStatus] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        alert('Please install MetaMask or another Web3 wallet!');
        return;
      }
      const ethereum = (window as any).ethereum;

      const desiredChainId = "0x13c91"; 
      const currentChainId = await ethereum.request({ method: 'eth_chainId' });
      console.log(currentChainId)
      if (currentChainId !== desiredChainId) {
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: desiredChainId }],
          });
        } catch (switchError:any) {
          if (switchError.code === 4902) {
            alert('The desired network is not available in your wallet.');
          } else {
            console.error('Failed to switch network', switchError);
            alert('Failed to switch to the desired network. Please try again.');
            return;
          }
        }
      }

      // Request account access
      // const accounts = await (window as any).ethereum.request({ 
      //   method: 'eth_requestAccounts' 
      // });

      // Create provider
      const ethersProvider = new ethers.BrowserProvider((window as any).ethereum);
      
      // Get signer and address
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      
      // Update state
      setWalletAddress(address);
      setIsConnected(true);
      setProvider(ethersProvider);

      // Fetch initial balance
      await fetchBalance(ethersProvider, selectedAsset);
    } catch (error) {
      console.error('Wallet connection failed', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  // Fetch token balance
  const fetchBalance = async (
    ethersProvider: ethers.BrowserProvider, 
    asset: typeof SUPPORTED_ASSETS[0]
  ) => {
    try {
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();

      if (asset.contractAddress) {
        // ERC-20 token balance
        const tokenContract = new ethers.Contract(
          asset.contractAddress, 
          ERC20_ABI, 
          signer
        );
        const balance = await tokenContract.balanceOf(address);
        setBalance(ethers.formatUnits(balance, asset.decimals));
      } else {
        // Native token (ETH) balance
        const balance = await ethersProvider.getBalance(address);
        setBalance(ethers.formatEther(balance));
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0');
    }
  };

  // Deposit assets
  const depositAsset = async () => {
    if (!provider || !isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setDepositStatus({ status: 'processing', message: 'Processing deposit...' });

      const signer = await provider.getSigner();
      const amount = ethers.parseUnits(depositAmount, selectedAsset.decimals);
      let tx;
      if (selectedAsset.contractAddress) {
        // ERC-20 Token Transfer
        const tokenContract = new ethers.Contract(
          selectedAsset.contractAddress, 
          ERC20_ABI, 
          signer
        );

        // Approve and transfer
        const approveTx = await tokenContract.approve(
          COMPANY_DEPOSIT_ADDRESS, 
          amount
        );
        await approveTx.wait();

        const transferTx = await tokenContract.transfer(
          COMPANY_DEPOSIT_ADDRESS, 
          amount
        );
        await transferTx.wait();
      } else {
        // Native token (ETH) transfer
        tx = await signer.sendTransaction({
          to: COMPANY_DEPOSIT_ADDRESS,
          value: amount
        });
        await tx.wait();
      }

      // Optional: Send deposit details to backend
      await axios.post('/api/deposits', {
        walletAddress,
        asset: selectedAsset.symbol,
        amount: depositAmount,
        transactionHash: tx?.hash
      });

      // Update status and refresh balance
      setDepositStatus({ 
        status: 'success', 
        message: `Successfully deposited ${depositAmount} ${selectedAsset.symbol}` 
      });
      await fetchBalance(provider, selectedAsset);
      setDepositAmount('');
    } catch (error) {
      console.error('Deposit failed:', error);
      setDepositStatus({ 
        status: 'error', 
        message: 'Deposit failed. Please try again.' 
      });
    }
  };

  // Change selected asset
  const handleAssetChange = (asset: typeof SUPPORTED_ASSETS[0]) => {
    if (provider) {
      setSelectedAsset(asset);
      fetchBalance(provider, asset);
    } else {
      setSelectedAsset(asset);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">
            NRK Deposit Portal
          </h2>

          {/* Wallet Connection */}
          <div className="mb-4">
            {!isConnected ? (
              <button 
                onClick={connectWallet}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="bg-green-100 p-3 rounded">
                <p className="text-green-800">
                  Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
            )}
          </div>

          {/* Asset Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Select Asset</label>
            <div className="flex space-x-2">
              {SUPPORTED_ASSETS.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => handleAssetChange(asset)}
                  className={`px-4 py-2 rounded ${
                    selectedAsset.symbol === asset.symbol 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {asset.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Balance Display */}
          {isConnected && (
            <div className="mb-4">
              <p className="text-gray-600">
                Balance: {balance} {selectedAsset.symbol}
              </p>
            </div>
          )}

          {/* Deposit Input */}
          <div className="mb-4">
            <label htmlFor="deposit-amount" className="block text-gray-700 mb-2">
              Deposit Amount
            </label>
            <input
              id="deposit-amount"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={!isConnected}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter ${selectedAsset.symbol} amount`}
              min="0"
              step="0.000001"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="deposit-amount" className="block text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="fullname"
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              disabled={!isConnected}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter Your Full Name`}
             
            />
          </div>
          <div className="mb-4">
            <label htmlFor="deposit-amount" className="block text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isConnected}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter Your Email`}
             
            />
          </div>
          <div className="mb-4">
            <label htmlFor="deposit-amount" className="block text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!isConnected}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter Your Phone Number`}
             
            />
          </div>
          <div className="mb-4">
            <label htmlFor="deposit-amount" className="block text-gray-700 mb-2">
              Source of Funds
            </label>
            <input
              id="source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={!isConnected}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Your Source of Funds`}
             
            />
          </div>
         

          {/* Deposit Button */}
          <button
            onClick={depositAsset}
            disabled={!isConnected || !depositAmount}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition disabled:opacity-50"
          >
            Deposit {selectedAsset.symbol}
          </button>

          {/* Deposit Status */}
          {depositStatus.message && (
            <div 
              className={`mt-4 p-3 rounded ${
                depositStatus.status === 'success' 
                  ? 'bg-green-100 text-green-800'
                  : depositStatus.status === 'processing'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {depositStatus.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetDepositApp;