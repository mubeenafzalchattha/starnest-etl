import React, { useState ,useEffect} from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import BackgroundParticles from './components/BackgroundParticles';
import toast, { Toaster } from 'react-hot-toast';

// Deposit address configuration (replace with actual company wallet)
const COMPANY_DEPOSIT_ADDRESS = '0xe75E04e40291c205Dc2Ff872Fe74e2f4fF26efe7';

// Asset deposit types
const SUPPORTED_ASSETS = [
  // { 
  //   symbol: 'NRK', 
  //   name: 'Nordek', 
  //   decimals: 18,
  //   contractAddress: null // Native token
  // }
  { 
    symbol: 'SNT', 
    name: 'Starnest', 
    decimals: 18,
    contractAddress: '0xe3deAA063803C6F4d7B9fEcF346dd8CeEE115Db3' // Native token
  }
];

// ERC-20 ABI for token transfers
const ERC20_ABI = [
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "initialOwner",
              "type": "address"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "owner",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "spender",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
          }
      ],
      "name": "Approval",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "account",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          }
      ],
      "name": "Burned",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "account",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          }
      ],
      "name": "Minted",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "previousOwner",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
          }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "Paused",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "from",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "to",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
          }
      ],
      "name": "Transfer",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "Unpaused",
      "type": "event"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "owner",
              "type": "address"
          },
          {
              "internalType": "address",
              "name": "spender",
              "type": "address"
          }
      ],
      "name": "allowance",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "spender",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          }
      ],
      "name": "approve",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "balanceOf",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "account",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          }
      ],
      "name": "burn",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "decimals",
      "outputs": [
          {
              "internalType": "uint8",
              "name": "",
              "type": "uint8"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "spender",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "subtractedValue",
              "type": "uint256"
          }
      ],
      "name": "decreaseAllowance",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "spender",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "addedValue",
              "type": "uint256"
          }
      ],
      "name": "increaseAllowance",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "account",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          }
      ],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "name",
      "outputs": [
          {
              "internalType": "string",
              "name": "",
              "type": "string"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "owner",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "pause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "paused",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "symbol",
      "outputs": [
          {
              "internalType": "string",
              "name": "",
              "type": "string"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "to",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          }
      ],
      "name": "transfer",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "from",
              "type": "address"
          },
          {
              "internalType": "address",
              "name": "to",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          }
      ],
      "name": "transferFrom",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
          }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "unpause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "tokenAddress",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          }
      ],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  }
]

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
  // const [source, setSource] = useState('');
  const [balance, setBalance] = useState('0');
  const [errorMessage, setErrorMessage] = useState('');
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
        handleAssetChange(asset)
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

      if (!fullname || !email || !phone) {
        toast('Please provide all information');
        return;
      }

      
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
        console.log('approveTx:',approveTx);

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
      await axios.post('https://etl.nordek.io/api/deposits/starnest', {
        walletAddress,
        asset: selectedAsset.symbol,
        amount: depositAmount,
        fullname: fullname,
        email: email,
        phone: phone,
        transactionHash: tx?.hash ?? 'Could not get'
      });

      // Update status and refresh balance
      setDepositStatus({ 
        status: 'success', 
        message: `Successfully deposited ${depositAmount} ${selectedAsset.symbol}` 
      });
      toast(`Thank you for depositing ${depositAmount} ${selectedAsset.symbol}`)
      toast('Soon you will be able to claim these NRK in new blockchain')
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

  const disconnectWallet = async () => {
    try {
      // Reset states
      setWalletAddress('');
      setIsConnected(false);
      setBalance('0');
      setProvider(null);

      // Remove event listeners
      (window as any).ethereum?.removeAllListeners('accountsChanged');
      (window as any).ethereum?.removeAllListeners('chainChanged');
    } catch (error) {
      console.error('Disconnection error', error);
    }
  };

  useEffect(() => {
    // Parse depositAmount as a float to compare it with balance (which is a number)
    const depositAmountValue = parseFloat(depositAmount);
    const intBalance = parseFloat(balance);
  
    // Check if depositAmountValue is a valid number and if it exceeds the balance
    if (!isNaN(depositAmountValue) && depositAmountValue > intBalance && depositAmount !== '') {
      setErrorMessage('Deposit amount cannot exceed balance.');
      setTimeout(() => {
        setDepositAmount(''); // Clear the deposit amount field after showing the message
        setErrorMessage(''); // Clear the error message
      }, 3000); // Keep the error message for 3 seconds before clearing
    }
  }, [depositAmount, balance]);

  return (
    <div className="p-6">
    <Toaster
    position="top-right"
    reverseOrder={true}
    toastOptions={{
      className: '',
      style: {
        border: '1px solid #713200',
        padding: '16px',
        color: '#713200',
      },
    }}
    />
       <BackgroundParticles />
       <div className=" z-10">
        <div className="max-w-md mx-auto rounded-xl shadow-md overflow-hidden">
          <div className="p-6 bg-white">
            <h2 className="text-2xl  font-bold mb-4 text-center">
              Starnest Migration Portal
            </h2>

            {/* Wallet Connection */}
            <div className="mb-4">
              {!isConnected ? (
                <button 
                  onClick={connectWallet}
                  className="w-full bg-purple-500 text-white py-2 rounded hover:bg-blue-600 transition"
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
            {/* <div className="mb-4">
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
            </div> */}

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
                required
              />
               {errorMessage && (
                <p className="text-red-500 text-sm">{errorMessage}</p>
              )}
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
                required
              
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
                required
              
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
                required
              
              />
            </div>
            {/* <div className="mb-4">
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
                required
              
              />
            </div> */}
          

            {/* Deposit Button */}
            <button
              onClick={depositAsset}
              disabled={!isConnected || !depositAmount || depositStatus.status === 'processing'}
              className="w-full bg-green-500 text-white pb-2 py-2 rounded hover:bg-green-600 transition disabled:opacity-50"
            >
              Deposit {selectedAsset.symbol}
            </button>
            {isConnected ? (
              <div className="p-5 rounded">
              <button 
              onClick={disconnectWallet}
              className="w-full bg-red-500 text-white pt-3 py-2 rounded hover:bg-red-600 transition disabled:opacity-50"
              >
              Disconnect
              </button>
              </div>
            ):''}
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
    </div>
  );
};

export default AssetDepositApp;