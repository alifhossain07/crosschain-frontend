"use client";

import { useState, useEffect } from "react";
import { useSwitchChain, useChainId, useAddress } from "@thirdweb-dev/react";
import { RECEIVER_CONTRACT_ADDRESS, RECEIVER_ABI, AMOY_CHAIN_ID, SENDER_CONTRACT_ADDRESS, SENDER_ABI, SEPOLIA_CHAIN_ID } from "@/constants";
import Link from "next/link";
import { ConnectWallet } from "@thirdweb-dev/react";
import { ethers } from "ethers";
import Modal from "@/components/Modal";

// Loading Spinner Component
const LoadingSpinner = ({ size = "w-5 h-5" }) => (
  <svg
    className={`animate-spin ${size} text-white`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export default function AuditPage() {
  const switchChain = useSwitchChain();
  const chainId = useChainId();
  const address = useAddress();
  const [totalEntries, setTotalEntries] = useState(0);
  const [recentEntries, setRecentEntries] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignEntries, setCampaignEntries] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingCampaignEntries, setIsLoadingCampaignEntries] = useState(false);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [diagnostics, setDiagnostics] = useState({
    receiverSet: null,
    senderBalance: null,
    receiverBalance: null,
    isLoading: false,
  });
  
  const isOnCorrectNetwork = chainId === AMOY_CHAIN_ID;
  
  // Modal state
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  
  const showModal = (title, message, type = "info") => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
    });
  };
  
  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  // Fetch data using ethers directly when on correct network
  useEffect(() => {
    if (isOnCorrectNetwork) {
      setIsLoadingData(true);
      const fetchData = async () => {
        try {
          // Get provider from window.ethereum (MetaMask) or use JsonRpcProvider
          let provider;
          if (typeof window !== "undefined" && window.ethereum) {
            provider = new ethers.providers.Web3Provider(window.ethereum);
          } else {
            // Fallback to public RPC
            provider = new ethers.providers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
          }

          // Create contract instance with ethers directly
          const contractInstance = new ethers.Contract(
            RECEIVER_CONTRACT_ADDRESS,
            RECEIVER_ABI,
            provider
          );

          // Call contract functions directly
          const total = await contractInstance.getTotalEntries();
          setTotalEntries(Number(total));

          const recent = await contractInstance.getRecentEntries(20);
          if (Array.isArray(recent)) {
            setRecentEntries(recent.map((entry) => ({
              campaignId: Number(entry.campaignId),
              donor: entry.donor,
              amount: entry.amount,
              timestamp: Number(entry.timestamp),
              sourceChainId: Number(entry.sourceChainId),
              entryIndex: Number(entry.entryIndex),
            })));
          } else {
            setRecentEntries([]);
          }
        } catch (error) {
          const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
          const errorLower = errorMessage.toLowerCase();
          
          if (errorLower.includes("call revert") || errorLower.includes("call_exception") || errorLower.includes("execution reverted")) {
            showModal(
              "Contract Connection Error",
              `Unable to read from the audit contract.\n\nContract Address: ${RECEIVER_CONTRACT_ADDRESS}\nNetwork: Polygon Amoy (${chainId})\n\nTroubleshooting:\n1. Refresh the page (Ctrl+R / Cmd+R)\n2. Disconnect and reconnect your wallet\n3. Ensure you're on Polygon Amoy network\n4. Check contract on Polygonscan: https://amoy.polygonscan.com/address/${RECEIVER_CONTRACT_ADDRESS}\n\nIf the contract is verified on Polygonscan, this might be a temporary network issue. Please try refreshing.\n\nError: ${errorMessage.substring(0, 200)}`,
              "error"
            );
          } else if (!errorMessage.includes("No entries") && !errorMessage.includes("does not exist") && !errorMessage.includes("user rejected")) {
            showModal("Error", `Error fetching audit data: ${errorMessage}`, "error");
          }
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    } else {
      setIsLoadingData(false);
      setTotalEntries(0);
      setRecentEntries([]);
    }
  }, [isOnCorrectNetwork, chainId]);


  // Fetch campaign entries using ethers directly
  useEffect(() => {
    if (isOnCorrectNetwork && selectedCampaign) {
      setIsLoadingCampaignEntries(true);
      const fetchCampaignEntries = async () => {
        try {
          // Get provider from window.ethereum (MetaMask) or use JsonRpcProvider
          let provider;
          if (typeof window !== "undefined" && window.ethereum) {
            provider = new ethers.providers.Web3Provider(window.ethereum);
          } else {
            // Fallback to public RPC
            provider = new ethers.providers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
          }

          const contractInstance = new ethers.Contract(
            RECEIVER_CONTRACT_ADDRESS,
            RECEIVER_ABI,
            provider
          );

          const entries = await contractInstance.getCampaignAuditEntries(selectedCampaign);
          if (Array.isArray(entries)) {
            setCampaignEntries(entries.map((entry) => ({
              campaignId: Number(entry.campaignId),
              donor: entry.donor,
              amount: entry.amount,
              timestamp: Number(entry.timestamp),
              sourceChainId: Number(entry.sourceChainId),
              entryIndex: Number(entry.entryIndex),
            })));
          } else {
            setCampaignEntries([]);
          }
        } catch (error) {
          const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
          const errorLower = errorMessage.toLowerCase();
          
          if (errorLower.includes("call revert") || errorLower.includes("call_exception") || errorLower.includes("network")) {
            showModal(
              "Network Error", 
              "Unable to fetch campaign entries. Please ensure you are connected to Polygon Amoy network.",
              "error"
            );
          } else if (!errorMessage.includes("No entries") && !errorMessage.includes("does not exist")) {
            showModal("Error", `Error fetching campaign entries: ${errorMessage}`, "error");
          } else {
            setCampaignEntries([]);
          }
        } finally {
          setIsLoadingCampaignEntries(false);
        }
      };
      fetchCampaignEntries();
    } else if (!selectedCampaign || !isOnCorrectNetwork) {
      setCampaignEntries([]);
      setIsLoadingCampaignEntries(false);
    }
  }, [selectedCampaign, isOnCorrectNetwork]);

  const handleSwitchToAmoy = async () => {
    setIsSwitchingChain(true);
    try {
      if (switchChain) {
        showModal("Switching Network", "Switching to Polygon Amoy network...", "info");
        await switchChain(AMOY_CHAIN_ID);
        closeModal();
        showModal("Success", "Successfully switched to Polygon Amoy!", "success");
      } else {
        showModal("Network Switch Required", "Please switch to Polygon Amoy network in your wallet to view the audit ledger", "warning");
      }
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
      closeModal();
      showModal("Network Switch Failed", `Error switching chain: ${errorMessage}\n\nPlease switch to Polygon Amoy network in your wallet manually`, "error");
    } finally {
      setIsSwitchingChain(false);
    }
  };

  // Check cross-chain setup diagnostics
  const checkDiagnostics = async () => {
    setDiagnostics({ ...diagnostics, isLoading: true });
    try {
      // Always use Sepolia RPC directly (not wallet network) to check sender contract
      // This works regardless of what network the user's wallet is connected to
      // Try multiple RPC endpoints for reliability
      const sepoliaRpcUrls = [
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://rpc.sepolia.org",
        "https://sepolia.gateway.tenderly.co",
      ];
      
      let sepoliaProvider;
      let lastError;
      
      // Try each RPC endpoint until one works
      for (const rpcUrl of sepoliaRpcUrls) {
        try {
          sepoliaProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
          // Test the connection by getting network info
          await sepoliaProvider.getNetwork();
          break; // Success, use this provider
        } catch (err) {
          lastError = err;
          continue; // Try next RPC
        }
      }
      
      if (!sepoliaProvider) {
        throw new Error(`Failed to connect to Sepolia network. Tried ${sepoliaRpcUrls.length} RPC endpoints.`);
      }

      // Get Polygon Amoy provider for receiver contract check
      let amoyProvider;
      if (typeof window !== "undefined" && window.ethereum) {
        amoyProvider = new ethers.providers.Web3Provider(window.ethereum);
      } else {
        amoyProvider = new ethers.providers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
      }

      const senderContract = new ethers.Contract(SENDER_CONTRACT_ADDRESS, SENDER_ABI, sepoliaProvider);
      
      // Check if receiver is set
      const receiverAddress = await senderContract.receiverContract();
      const receiverSet = receiverAddress !== ethers.constants.AddressZero;
      
      // Check sender contract balance (Sepolia)
      const senderBalance = await sepoliaProvider.getBalance(SENDER_CONTRACT_ADDRESS);
      const senderBalanceInEth = ethers.utils.formatEther(senderBalance);
      
      // Check receiver contract balance (Polygon Amoy)
      let receiverBalanceInMatic = "0";
      let receiverBalanceStatus = "unknown";
      try {
        const receiverBalance = await amoyProvider.getBalance(RECEIVER_CONTRACT_ADDRESS);
        receiverBalanceInMatic = ethers.utils.formatEther(receiverBalance);
        // Receiver needs minimal balance for gas (0.01 MATIC should be enough)
        if (parseFloat(receiverBalanceInMatic) < 0.01) {
          receiverBalanceStatus = "low";
        } else {
          receiverBalanceStatus = "sufficient";
        }
      } catch (receiverError) {
        console.log("Could not check receiver balance:", receiverError);
        receiverBalanceStatus = "error";
      }
      
      setDiagnostics({
        receiverSet,
        receiverAddress: receiverSet ? receiverAddress : null,
        senderBalance: senderBalanceInEth,
        receiverBalance: receiverBalanceInMatic,
        isLoading: false,
      });

      // Show diagnostic results
      let message = "Cross-Chain Setup Diagnostics:\n\n";
      message += `📋 Contract Addresses:\n`;
      message += `✓ Sender Contract: ${SENDER_CONTRACT_ADDRESS}\n`;
      message += `✓ Receiver Contract: ${RECEIVER_CONTRACT_ADDRESS}\n\n`;
      
      // Receiver configuration check
      message += `🔗 Receiver Configuration:\n`;
      if (receiverSet) {
        message += `✅ Receiver Address Set: ${receiverAddress}\n`;
        if (receiverAddress.toLowerCase() !== RECEIVER_CONTRACT_ADDRESS.toLowerCase()) {
          message += `⚠️ WARNING: Set address doesn't match expected receiver!\n`;
        }
      } else {
        message += `❌ Receiver Address NOT Set!\n`;
        message += `\nTo fix: Call setReceiverContract(${RECEIVER_CONTRACT_ADDRESS}) on sender contract\n`;
      }
      
      // Sender balance check
      message += `\n💰 Sender Contract Balance (Ethereum Sepolia):\n`;
      message += `   Balance: ${senderBalanceInEth} ETH\n`;
      const senderBalanceSufficient = parseFloat(senderBalanceInEth) >= 0.01;
      if (senderBalanceSufficient) {
        message += `   Status: ✅ Sufficient for CCIP fees\n`;
      } else {
        message += `   Status: ⚠️ LOW BALANCE - Insufficient for CCIP fees\n`;
        message += `   Recommended: Send 0.1-0.5 ETH to ${SENDER_CONTRACT_ADDRESS}\n`;
      }
      
      // Receiver balance check
      message += `\n💰 Receiver Contract Balance (Polygon Amoy):\n`;
      if (receiverBalanceStatus === "error") {
        message += `   Balance: Unable to check\n`;
        message += `   Status: ⚠️ Could not verify balance\n`;
      } else {
        message += `   Balance: ${receiverBalanceInMatic} MATIC\n`;
        if (receiverBalanceStatus === "sufficient") {
          message += `   Status: ✅ Sufficient for gas fees\n`;
        } else {
          message += `   Status: ⚠️ LOW BALANCE - May cause out-of-gas errors\n`;
          message += `   Recommended: Send 0.1-1 MATIC to ${RECEIVER_CONTRACT_ADDRESS}\n`;
        }
      }
      
      // Automatic execution status
      message += `\n⚡ Automatic Execution Status:\n`;
      const canExecuteAutomatically = receiverSet && senderBalanceSufficient && receiverBalanceStatus === "sufficient";
      if (canExecuteAutomatically) {
        message += `   ✅ Transactions will execute AUTOMATICALLY\n`;
        message += `   • Sender has sufficient ETH for CCIP fees\n`;
        message += `   • Receiver has sufficient MATIC for gas\n`;
        message += `   • Receiver address is properly configured\n`;
      } else {
        message += `   ⚠️ Transactions may require MANUAL execution\n`;
        if (!receiverSet) {
          message += `   • Receiver address not set\n`;
        }
        if (!senderBalanceSufficient) {
          message += `   • Sender balance too low for CCIP fees\n`;
        }
        if (receiverBalanceStatus !== "sufficient") {
          message += `   • Receiver balance may be insufficient for gas\n`;
        }
      }

      // Check recent CCIP messages sent
      try {
        const filter = senderContract.filters.CrossChainMessageSent();
        const events = await senderContract.queryFilter(filter, -1000); // Last 1000 blocks
        const recentEvents = events.slice(-5).reverse(); // Last 5 events
        
        if (recentEvents.length > 0) {
          message += `\n\n📨 Recent CCIP Messages Sent: ${recentEvents.length}\n`;
          recentEvents.forEach((event, idx) => {
            const args = event.args;
            message += `${idx + 1}. Campaign ${args.campaignId}, Amount: ${ethers.utils.formatEther(args.amount)} ETH\n`;
            // Format Message ID on separate line to ensure it wraps properly
            const messageId = args.messageId.toString();
            message += `   Message ID:\n   ${messageId}\n`;
            message += `   Block: ${event.blockNumber}\n`;
          });
          message += `\n⏱️ CCIP messages can take 1-5 minutes to be delivered.\n`;
          message += `Check message status: https://ccip.chain.link/\n`;
        } else {
          message += `\n\n⚠️ No recent CCIP messages found.\n`;
          message += `This means no donations have triggered cross-chain messages yet.\n`;
          message += `Or messages were sent more than ~1000 blocks ago.\n`;
        }
      } catch (eventError) {
        // Ignore event query errors
        console.log("Could not query events:", eventError);
      }

      // Add troubleshooting tips
      if (canExecuteAutomatically) {
        message += `\n\n✅ Setup is correct! If donations aren't appearing:\n`;
        message += `1. Wait 1-5 minutes for CCIP message delivery\n`;
        message += `2. Refresh the audit page\n`;
        message += `3. Check your donation transaction on Etherscan for CrossChainMessageSent event\n`;
        message += `4. Verify message delivery: https://ccip.chain.link/`;
        showModal("Setup Complete", message, "success");
      } else {
        message += `\n\n📝 Next Steps:\n`;
        if (!receiverSet) {
          message += `1. Set receiver contract address on sender contract\n`;
        }
        if (!senderBalanceSufficient) {
          message += `2. Send ETH to sender contract for CCIP fees\n`;
        }
        if (receiverBalanceStatus !== "sufficient") {
          message += `3. Send MATIC to receiver contract for gas fees\n`;
        }
        message += `\nAfter fixing these issues, transactions will execute automatically.`;
        showModal("Setup Required", message, "warning");
      }
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
      const errorLower = errorMessage.toLowerCase();
      
      let detailedMessage = `Error checking setup: ${errorMessage}\n\n`;
      
      if (errorLower.includes("network") || errorLower.includes("noNetwork") || errorLower.includes("network_error")) {
        detailedMessage += "Network Connection Issue:\n";
        detailedMessage += "• Unable to connect to Sepolia RPC endpoints\n";
        detailedMessage += "• This might be a temporary network issue\n\n";
        detailedMessage += "Try:\n";
        detailedMessage += "1. Check your internet connection\n";
        detailedMessage += "2. Wait a moment and try again\n";
        detailedMessage += "3. Verify sender contract manually:\n";
        detailedMessage += `   https://sepolia.etherscan.io/address/${SENDER_CONTRACT_ADDRESS}\n\n`;
        detailedMessage += "Manual Check:\n";
        detailedMessage += `• Call receiverContract() on: ${SENDER_CONTRACT_ADDRESS}\n`;
        detailedMessage += `• Check balance of: ${SENDER_CONTRACT_ADDRESS}`;
      } else if (errorLower.includes("call revert") || errorLower.includes("call_exception")) {
        detailedMessage += "Possible issues:\n";
        detailedMessage += "• Sender contract not deployed at this address\n";
        detailedMessage += "• Contract ABI mismatch\n";
        detailedMessage += "• Network/RPC connection issue\n\n";
        detailedMessage += `Verify sender contract exists:\n`;
        detailedMessage += `https://sepolia.etherscan.io/address/${SENDER_CONTRACT_ADDRESS}`;
      } else {
        detailedMessage += "Please check:\n";
        detailedMessage += "• Sender contract is deployed on Sepolia\n";
        detailedMessage += "• Contract address is correct in .env.local\n";
        detailedMessage += `• Verify: https://sepolia.etherscan.io/address/${SENDER_CONTRACT_ADDRESS}`;
      }
      
      showModal("Diagnostic Error", detailedMessage, "error");
      setDiagnostics({ ...diagnostics, isLoading: false });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-emerald-500">
            PhilanthroCross
          </Link>
          <div className="flex gap-4 items-center">
            <Link
              href="/campaigns"
              className="text-slate-300 hover:text-emerald-500 transition"
            >
              Campaigns
            </Link>
            <Link
              href="/dashboard"
              className="text-slate-300 hover:text-emerald-500 transition"
            >
              Dashboard
            </Link>
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Global Audit Ledger</h1>
          <p className="text-slate-400">
            Immutable cross-chain audit trail on Polygon Amoy
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          {!isOnCorrectNetwork && (
            <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <p className="text-yellow-400 text-sm">
                ⚠️ You are not connected to Polygon Amoy network. Please switch to Polygon Amoy to view the audit ledger.
              </p>
            </div>
          )}
          {isOnCorrectNetwork && totalEntries === 0 && (
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded">
              <p className="text-blue-400 text-sm mb-2">
                ℹ️ No audit entries found. This could mean:
              </p>
              <ul className="text-blue-300 text-xs list-disc list-inside space-y-1 mb-3">
                <li>No donations have been made yet</li>
                <li>CCIP messages are still being delivered (can take 1-5 minutes)</li>
                <li>Cross-chain messages aren't being sent (check setup)</li>
                <li>Receiver contract address not set in sender contract</li>
                <li>Sender contract doesn't have ETH for CCIP fees</li>
              </ul>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded transition"
                >
                  🔄 Refresh Page
                </button>
                <button
                  onClick={checkDiagnostics}
                  disabled={diagnostics.isLoading || !address}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded transition flex items-center gap-2"
                >
                  {diagnostics.isLoading && <LoadingSpinner size="w-4 h-4" />}
                  {diagnostics.isLoading ? "Checking..." : "Check Cross-Chain Setup"}
                </button>
              </div>
            </div>
          )}
          {isOnCorrectNetwork && (
            <div className="mb-4 p-3 bg-slate-700/50 rounded text-xs text-slate-400">
              <p>Contract Address: <span className="font-mono text-slate-300">{RECEIVER_CONTRACT_ADDRESS}</span></p>
              <p className="mt-1">
                <a 
                  href={`https://amoy.polygonscan.com/address/${RECEIVER_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 underline"
                >
                  View on Polygonscan →
                </a>
              </p>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Audit Statistics</h2>
              <p className="text-slate-400 mt-1">
                Total entries: {isOnCorrectNetwork ? totalEntries : "N/A"}
                {!isOnCorrectNetwork && " (Switch to Polygon Amoy)"}
              </p>
            </div>
            <div className="flex gap-2">
              {isOnCorrectNetwork && totalEntries === 0 && address && (
                <button
                  onClick={checkDiagnostics}
                  disabled={diagnostics.isLoading}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded transition flex items-center gap-2"
                >
                  {diagnostics.isLoading && <LoadingSpinner size="w-4 h-4" />}
                  {diagnostics.isLoading ? "Checking..." : "Check Setup"}
                </button>
              )}
              <button
                onClick={handleSwitchToAmoy}
                disabled={isSwitchingChain || isOnCorrectNetwork}
                className={`px-4 py-2 ${
                  isOnCorrectNetwork 
                    ? "bg-green-500 hover:bg-green-600" 
                    : "bg-emerald-500 hover:bg-emerald-600"
                } disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded transition flex items-center gap-2`}
              >
                {isSwitchingChain && <LoadingSpinner size="w-4 h-4" />}
                {isOnCorrectNetwork ? "✓ Connected to Polygon Amoy" : isSwitchingChain ? "Switching..." : "Switch to Polygon Amoy"}
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-700 p-4 rounded">
              <p className="text-slate-400 text-sm">Total Entries</p>
              <p className="text-2xl font-bold text-white">{totalEntries}</p>
            </div>
            <div className="bg-slate-700 p-4 rounded">
              <p className="text-slate-400 text-sm">Chain</p>
              <p className="text-2xl font-bold text-emerald-500">Polygon Amoy</p>
            </div>
            <div className="bg-slate-700 p-4 rounded">
              <p className="text-slate-400 text-sm">Status</p>
              <p className="text-2xl font-bold text-green-400">Active</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Recent Entries</h2>
            <div className="space-y-3">
              {isLoadingData ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="w-8 h-8" />
                  <span className="ml-3 text-slate-400">Loading audit data...</span>
                </div>
              ) : recentEntries.length === 0 ? (
                <p className="text-slate-400">No audit entries yet</p>
              ) : (
                recentEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-4 cursor-pointer hover:border-emerald-500 transition"
                    onClick={() => setSelectedCampaign(entry.campaignId)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-semibold">Campaign #{entry.campaignId}</p>
                        <p className="text-slate-400 text-sm">
                          {entry.donor.slice(0, 6)}...{entry.donor.slice(-4)}
                        </p>
                      </div>
                      <span className="text-emerald-500 font-semibold">
                        {ethers.utils.formatEther(entry.amount)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Entry #{entry.entryIndex}</span>
                      <span>{new Date(entry.timestamp * 1000).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-700">
                      <span className="text-xs text-slate-500">
                        Source Chain: {entry.sourceChainId === 11155111 ? "Ethereum Sepolia" : `Chain ${entry.sourceChainId}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              {selectedCampaign ? `Campaign #${selectedCampaign} Entries` : "Select a Campaign"}
            </h2>
            {selectedCampaign ? (
              <div className="space-y-3">
                {isLoadingCampaignEntries ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="w-8 h-8" />
                    <span className="ml-3 text-slate-400">Loading campaign entries...</span>
                  </div>
                ) : campaignEntries.length === 0 ? (
                  <p className="text-slate-400">No entries for this campaign</p>
                ) : (
                  <>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-2">Total Entries</p>
                      <p className="text-2xl font-bold text-white">{campaignEntries.length}</p>
                    </div>
                    {campaignEntries.map((entry, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-white font-semibold">
                              Entry #{entry.entryIndex}
                            </p>
                            <p className="text-slate-400 text-sm">
                              {entry.donor.slice(0, 6)}...{entry.donor.slice(-4)}
                            </p>
                          </div>
                          <span className="text-emerald-500 font-semibold">
                            {ethers.utils.formatEther(entry.amount)} ETH
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-2">
                          <p>Timestamp: {new Date(entry.timestamp * 1000).toLocaleString()}</p>
                          <p>Source Chain: {entry.sourceChainId === 11155111 ? "Ethereum Sepolia" : `Chain ${entry.sourceChainId}`}</p>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setSelectedCampaign(null)}
                      className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded transition"
                    >
                      Clear Selection
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                <p className="text-slate-400">
                  Click on a campaign entry to view all entries for that campaign
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">About the Global Audit Ledger</h3>
          <div className="space-y-2 text-slate-300">
            <p>
              The Global Audit Ledger is an immutable record of all donations made on the PhilanthroCross platform.
            </p>
            <p>
              • All donations from Ethereum Sepolia are automatically mirrored here via Chainlink CCIP
            </p>
            <p>
              • Once written, entries cannot be modified or deleted
            </p>
            <p>
              • This provides transparent, verifiable proof of all cross-chain donations
            </p>
            <p>
              • The ledger is read-only and serves as the single source of truth for audit purposes
            </p>
          </div>
        </div>
      </main>
      
      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
}
