"use client";

import { useState, useEffect } from "react";
import { useContract, useContractRead, useContractWrite, useAddress } from "@thirdweb-dev/react";
import { SENDER_CONTRACT_ADDRESS, SENDER_ABI, Role } from "@/constants";
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

export default function CampaignsPage() {
  const address = useAddress();
  const [donationAmount, setDonationAmount] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [isDonating, setIsDonating] = useState({});
  const [isClaimingRefund, setIsClaimingRefund] = useState({});
  
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

  const { contract } = useContract(SENDER_CONTRACT_ADDRESS, SENDER_ABI);
  const { data: campaignCount } = useContractRead(contract, "campaignCounter");
  const { data: userRoleData } = useContractRead(contract, "userRoles", [address]);

  // Fetch user role
  useEffect(() => {
    if (userRoleData !== undefined) {
      setUserRole(Number(userRoleData));
    }
  }, [userRoleData]);

  const CampaignCard = ({ campaignId }) => {
    const { data: campaign } = useContractRead(contract, "getCampaign", [campaignId]);
    const { data: donations } = useContractRead(contract, "getCampaignDonations", [campaignId]);
    const { data: canRefund } = useContractRead(contract, "canClaimRefund", [campaignId]);
    const { data: timeUntilRefund } = useContractRead(contract, "getTimeUntilRefund", [campaignId]);
    
    const { mutateAsync: donate } = useContractWrite(contract, "donate");
    const { mutateAsync: claimRefund } = useContractWrite(contract, "claimRefund");

    if (!campaign) return null;

    const progress = campaign.goal > 0 
      ? (Number(campaign.raised) / Number(campaign.goal)) * 100 
      : 0;
    const isCompleted = Number(campaign.raised) >= Number(campaign.goal);
    const deadlinePassed = canRefund && !campaign.proofUploaded;
    const timeRemaining = timeUntilRefund ? Number(timeUntilRefund) : 0;
    const minutesRemaining = Math.floor(timeRemaining / 60);
    const secondsRemaining = timeRemaining % 60;

    const handleDonate = async () => {
      if (!donationAmount[campaignId] || donationAmount[campaignId] <= 0) {
        showModal("Invalid Input", "Please enter a valid donation amount", "warning");
        return;
      }
      setIsDonating({ ...isDonating, [campaignId]: true });
      try {
        showModal("Processing", "Processing donation...", "info");
        const receipt = await donate({
          args: [campaignId],
          overrides: {
            value: ethers.utils.parseEther(donationAmount[campaignId].toString()),
          },
        });
        setDonationAmount({ ...donationAmount, [campaignId]: "" });
        closeModal();
        
        // Get transaction hash from receipt
        const txHash = receipt?.receipt?.transactionHash || receipt?.transactionHash || receipt?.hash || "Unknown";
        
        let successMessage = "✅ Donation successful!\n\n";
        successMessage += `Transaction Hash:\n${txHash}\n\n`;
        successMessage += `View on Etherscan:\n`;
        successMessage += `https://sepolia.etherscan.io/tx/${txHash}\n\n`;
        successMessage += `⏱️ CCIP cross-chain message will be delivered in 1-5 minutes.\n`;
        successMessage += `Check audit ledger after a few minutes.`;
        
        showModal("Donation Successful", successMessage, "success");
      } catch (error) {
        const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
        closeModal();
        showModal("Donation Failed", `Donation failed: ${errorMessage}`, "error");
      } finally {
        setIsDonating({ ...isDonating, [campaignId]: false });
      }
    };

    const parseRefundError = (error) => {
      const errorStr = error?.message || error?.toString() || "";
      const errorLower = errorStr.toLowerCase();
      
      // Parse common refund error messages
      if (errorLower.includes("goal not reached") || errorLower.includes("goal not met")) {
        return "The campaign goal has not been reached yet. Refunds are only available after the goal is reached and the proof deadline passes.";
      }
      if (errorLower.includes("campaign not completed") || errorLower.includes("completion time")) {
        return "The campaign has not been completed yet. Refunds are only available after the goal is reached.";
      }
      if (errorLower.includes("proof deadline not passed") || errorLower.includes("deadline not passed")) {
        return "The proof deadline has not passed yet. The creator still has time to upload proof. Please wait until the deadline expires.";
      }
      if (errorLower.includes("proof already uploaded") || errorLower.includes("proof uploaded")) {
        return "The creator has already uploaded proof for this campaign. Refunds are no longer available.";
      }
      if (errorLower.includes("no donation to refund") || errorLower.includes("no donation")) {
        return "You don't have any donations to this campaign that are eligible for refund.";
      }
      if (errorLower.includes("refund already claimed") || errorLower.includes("already claimed")) {
        return "You have already claimed your refund for this campaign.";
      }
      if (errorLower.includes("campaign does not exist")) {
        return "This campaign does not exist.";
      }
      if (errorLower.includes("refund transfer failed")) {
        return "The refund transaction failed. Please try again or contact support.";
      }
      
      // Return original error if no match
      return errorStr || "Unknown error occurred. Please check the campaign status and try again.";
    };

    const handleRefund = async () => {
      setIsClaimingRefund({ ...isClaimingRefund, [campaignId]: true });
      try {
        await claimRefund({ args: [campaignId] });
        showModal("Success", "Refund claimed successfully! Your funds will be returned to your wallet.", "success");
      } catch (error) {
        const friendlyMessage = parseRefundError(error);
        showModal("Refund Failed", friendlyMessage, "error");
      } finally {
        setIsClaimingRefund({ ...isClaimingRefund, [campaignId]: false });
      }
    };

    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              Campaign #{campaignId}
            </h3>
            <p className="text-slate-400 text-sm">
              Creator: {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
            </p>
          </div>
          {isCompleted && (
            <span className={`px-3 py-1 rounded text-sm font-semibold ${
              campaign.proofUploaded 
                ? "bg-green-500/20 text-green-400" 
                : deadlinePassed
                ? "bg-red-500/20 text-red-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}>
              {campaign.proofUploaded 
                ? "Proof Uploaded" 
                : deadlinePassed
                ? "Refund Available"
                : "Awaiting Proof"}
            </span>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">
              {ethers.utils.formatEther(campaign.raised)} ETH
            </span>
            <span className="text-slate-400">
              of {ethers.utils.formatEther(campaign.goal)} ETH
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {isCompleted && !campaign.proofUploaded && !deadlinePassed && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
            <p className="text-yellow-400 text-sm">
              ⏰ Proof deadline: {minutesRemaining}m {secondsRemaining}s remaining
            </p>
          </div>
        )}

        {campaign.proofUploaded && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
            <p className="text-green-400 text-sm">
              ✓ Proof uploaded: {campaign.ipfsHash.slice(0, 20)}...
            </p>
          </div>
        )}

        {userRole === Role.DONOR && (
          <div className="space-y-3">
            {!isCompleted && (
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  placeholder="Amount (ETH)"
                  value={donationAmount[campaignId] || ""}
                  onChange={(e) =>
                    setDonationAmount({
                      ...donationAmount,
                      [campaignId]: e.target.value,
                    })
                  }
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                />
                <button
                  onClick={handleDonate}
                  disabled={isDonating[campaignId]}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded transition flex items-center gap-2"
                >
                  {isDonating[campaignId] && <LoadingSpinner size="w-4 h-4" />}
                  {isDonating[campaignId] ? "Donating..." : "Donate"}
                </button>
              </div>
            )}
            {deadlinePassed && (
              <button
                onClick={handleRefund}
                disabled={isClaimingRefund[campaignId]}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded transition flex items-center justify-center gap-2"
              >
                {isClaimingRefund[campaignId] && <LoadingSpinner size="w-4 h-4" />}
                {isClaimingRefund[campaignId] ? "Claiming..." : "Claim Refund"}
              </button>
            )}
          </div>
        )}

        {donations && donations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-2">
              {donations.length} donation{donations.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    );
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
              href="/dashboard"
              className="text-slate-300 hover:text-emerald-500 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/audit"
              className="text-slate-300 hover:text-emerald-500 transition"
            >
              Audit
            </Link>
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Campaigns</h1>

        {!address && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-300 mb-4">Please connect your wallet to view campaigns</p>
            <ConnectWallet />
          </div>
        )}

        {address && campaignCount && (
          <div className="grid gap-6">
            {Array.from({ length: Number(campaignCount) }, (_, i) => Number(campaignCount) - i)
              .map((campaignId) => (
                <CampaignCard key={campaignId} campaignId={campaignId} />
              ))}
          </div>
        )}

        {address && campaignCount === 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-300">No campaigns yet. Create one from your dashboard!</p>
          </div>
        )}
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
