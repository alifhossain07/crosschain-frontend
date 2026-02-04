"use client";

import { useState, useEffect } from "react";
import { useContract, useContractRead, useContractWrite, useAddress, useChainId } from "@thirdweb-dev/react";
import { SENDER_CONTRACT_ADDRESS, SENDER_ABI, Role, SEPOLIA_CHAIN_ID } from "@/constants";
import Link from "next/link";
import { ConnectWallet, useSwitchChain } from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { useStorageUpload } from "@thirdweb-dev/react";
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

export default function DashboardPage() {
  const address = useAddress();
  const chainId = useChainId();
  const [userRole, setUserRole] = useState(null);
  const [campaignGoal, setCampaignGoal] = useState("");
  const [proofHash, setProofHash] = useState({});
  const [proofFile, setProofFile] = useState({});
  const [uploadingProof, setUploadingProof] = useState({});
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [isClaimingRefund, setIsClaimingRefund] = useState({});
  
  // Modal state
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    showConfirm: false,
    onConfirm: null,
  });
  
  const showModal = (title, message, type = "info", showConfirm = false, onConfirmCallback = null) => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      showConfirm,
      onConfirm: onConfirmCallback,
    });
  };
  
  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };
  
  const { mutateAsync: uploadToIPFS } = useStorageUpload();

  const { contract } = useContract(SENDER_CONTRACT_ADDRESS, SENDER_ABI);
  const { data: campaignCount } = useContractRead(contract, "campaignCounter");
  const { mutateAsync: register } = useContractWrite(contract, "register");
  const { mutateAsync: createCampaign } = useContractWrite(contract, "createCampaign");
  const { mutateAsync: uploadProof } = useContractWrite(contract, "uploadProof");
  const { mutateAsync: claimRefund } = useContractWrite(contract, "claimRefund");

  // Fetch user role using useContractRead hook
  const { data: userRoleData, isLoading: isLoadingRoleData } = useContractRead(
    contract,
    "userRoles",
    address ? [address] : []
  );

  useEffect(() => {
    if (userRoleData !== undefined) {
      const roleNum = Number(userRoleData);
      setUserRole(roleNum);
      setShowRoleSelector(roleNum === Role.NONE);
      setIsLoadingRole(false);
    } else if (address && !isLoadingRoleData) {
      // If address exists but no role data, show selector
      setShowRoleSelector(true);
      setIsLoadingRole(false);
    }
  }, [userRoleData, address, isLoadingRoleData]);

  // Note: User should manually switch to Sepolia if needed

  const handleRegister = async (role) => {
    setIsRegistering(true);
    try {
      await register({ args: [role] });
      setUserRole(role);
      setShowRoleSelector(false);
      showModal("Success", "Role registered successfully!", "success");
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
      showModal("Registration Failed", `Registration failed: ${errorMessage}`, "error");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignGoal || campaignGoal <= 0) {
      showModal("Invalid Input", "Please enter a valid goal amount", "warning");
      return;
    }
    setIsCreatingCampaign(true);
    try {
      await createCampaign({
        args: [ethers.utils.parseEther(campaignGoal.toString())],
      });
      setCampaignGoal("");
      showModal("Success", "Campaign created successfully!", "success");
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
      showModal("Campaign Creation Failed", `Campaign creation failed: ${errorMessage}`, "error");
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleFileSelect = (campaignId, event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        showModal("Invalid File Type", "Please upload an image (JPEG, PNG, GIF, WebP) or PDF file", "warning");
        return;
      }
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showModal("File Too Large", "File size must be less than 10MB", "warning");
        return;
      }
      setProofFile({ ...proofFile, [campaignId]: file });
    }
  };

  const handleUploadProof = async (campaignId) => {
    const file = proofFile[campaignId];
    const hash = proofHash[campaignId];
    
    // If file is selected, upload to IPFS first
    if (file) {
      setUploadingProof({ ...uploadingProof, [campaignId]: true });
      try {
        showModal("Uploading", "Uploading file to IPFS...", "info");
        const uploadUrl = await uploadToIPFS({ data: [file] });
        // uploadUrl is an array, get the first item
        const ipfsHash = uploadUrl[0];
        // Extract just the IPFS hash (remove ipfs:// prefix if present)
        const hashValue = ipfsHash.replace('ipfs://', '');
        
        closeModal();
        showModal("Submitting", "Submitting proof to blockchain...", "info");
        await uploadProof({ args: [campaignId, hashValue] });
        setProofHash({ ...proofHash, [campaignId]: "" });
        setProofFile({ ...proofFile, [campaignId]: null });
        closeModal();
        showModal("Success", "Proof uploaded successfully!", "success");
      } catch (error) {
        const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
        await showModal("Upload Failed", `Proof upload failed: ${errorMessage}`, "error");
      } finally {
        setUploadingProof({ ...uploadingProof, [campaignId]: false });
      }
    } else if (hash && hash.trim() !== "") {
      // Use manual IPFS hash if provided
      setUploadingProof({ ...uploadingProof, [campaignId]: true });
      try {
        await uploadProof({ args: [campaignId, hash.trim()] });
        setProofHash({ ...proofHash, [campaignId]: "" });
        showModal("Success", "Proof uploaded successfully!", "success");
      } catch (error) {
        const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
        showModal("Upload Failed", `Proof upload failed: ${errorMessage}`, "error");
      } finally {
        setUploadingProof({ ...uploadingProof, [campaignId]: false });
      }
    } else {
      showModal("Missing Input", "Please select a file or enter an IPFS hash", "warning");
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

  const handleRefund = async (campaignId) => {
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

  const CreatorDashboard = () => {
    const [myCampaigns, setMyCampaigns] = useState([]);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

    useEffect(() => {
      if (contract && campaignCount && address) {
        setIsLoadingCampaigns(true);
        const fetchCampaigns = async () => {
          const campaigns = [];
          const count = Number(campaignCount);
          for (let i = 1; i <= count; i++) {
            try {
              // Use thirdweb's call method to read from contract
              const campaign = await contract.call("getCampaign", [i]);
              // Campaign is returned as an array: [id, creator, goal, raised, completionTime, proofUploaded, ipfsHash]
              if (campaign && campaign.length >= 7) {
                const campaignData = {
                  id: Number(campaign[0]),
                  creator: campaign[1],
                  goal: campaign[2],
                  raised: campaign[3],
                  completionTime: campaign[4],
                  proofUploaded: campaign[5],
                  ipfsHash: campaign[6],
                };
                // Check if campaign exists and belongs to this creator
                if (campaignData.creator && campaignData.creator.toLowerCase() === address.toLowerCase()) {
                  campaigns.push(campaignData);
                }
              }
            } catch (error) {
              // Campaign doesn't exist or error fetching - skip it silently
              // Only show modal for unexpected errors
              if (error.message && !error.message.includes("Campaign does not exist")) {
                showModal("Error", `Error fetching campaign ${i}: ${error.message}`, "error");
              }
            }
          }
          // Sort campaigns by ID in descending order (latest first)
          campaigns.sort((a, b) => b.id - a.id);
          setMyCampaigns(campaigns);
          setIsLoadingCampaigns(false);
        };
        fetchCampaigns();
      } else if (!address) {
        setMyCampaigns([]);
      }
    }, [contract, campaignCount, address]);

    return (
      <div className="space-y-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Create Campaign</h2>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.001"
              placeholder="Goal (ETH)"
              value={campaignGoal}
              onChange={(e) => setCampaignGoal(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
            <button
              onClick={handleCreateCampaign}
              disabled={isCreatingCampaign}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded transition flex items-center gap-2"
            >
              {isCreatingCampaign && <LoadingSpinner size="w-4 h-4" />}
              {isCreatingCampaign ? "Creating..." : "Create"}
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-4">My Campaigns</h2>
          {isLoadingCampaigns ? (
            <p className="text-slate-400">Loading campaigns...</p>
          ) : myCampaigns.length === 0 ? (
            <p className="text-slate-400">No campaigns created yet. Create your first campaign above!</p>
          ) : (
            <div className="space-y-4">
              {myCampaigns.map((campaign) => {
                const progress = campaign.goal > 0 
                  ? (Number(campaign.raised) / Number(campaign.goal)) * 100 
                  : 0;
                const isCompleted = Number(campaign.raised) >= Number(campaign.goal);
                const timeUntilRefund = campaign.completionTime 
                  ? Math.max(0, Number(campaign.completionTime) + 30 * 60 - Math.floor(Date.now() / 1000))
                  : 0;
                const canUploadProof = isCompleted && !campaign.proofUploaded && timeUntilRefund > 0;

                return (
                  <div key={campaign.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">Campaign #{campaign.id}</h3>
                        <p className="text-slate-400 text-sm">
                          {ethers.utils.formatEther(campaign.raised)} / {ethers.utils.formatEther(campaign.goal)} ETH
                        </p>
                      </div>
                      {isCompleted && (
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${
                          campaign.proofUploaded 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {campaign.proofUploaded ? "Proof Uploaded" : "Awaiting Proof"}
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div
                          className="bg-emerald-500 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {canUploadProof && (
                      <div className="space-y-3">
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                          <p className="text-yellow-400 text-sm mb-2">
                            ⏰ Upload proof within {Math.floor(timeUntilRefund / 60)}m {timeUntilRefund % 60}s
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileSelect(campaign.id, e)}
                              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600"
                            />
                          </div>
                          {proofFile[campaign.id] && (
                            <p className="text-sm text-slate-300">
                              Selected: {proofFile[campaign.id].name} ({(proofFile[campaign.id].size / 1024).toFixed(2)} KB)
                            </p>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Or enter IPFS Hash manually"
                              value={proofHash[campaign.id] || ""}
                              onChange={(e) =>
                                setProofHash({
                                  ...proofHash,
                                  [campaign.id]: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                            />
                            <button
                              onClick={() => handleUploadProof(campaign.id)}
                              disabled={uploadingProof[campaign.id]}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded transition flex items-center gap-2"
                            >
                              {uploadingProof[campaign.id] && <LoadingSpinner size="w-4 h-4" />}
                              {uploadingProof[campaign.id] ? "Uploading..." : "Upload Proof"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {campaign.proofUploaded && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                        <p className="text-green-400 text-sm">
                          ✓ Proof: {campaign.ipfsHash}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const DonorDashboard = () => {
    const [myDonations, setMyDonations] = useState([]);
    const [isLoadingDonations, setIsLoadingDonations] = useState(false);

    useEffect(() => {
      if (contract && campaignCount && address) {
        setIsLoadingDonations(true);
        const fetchDonations = async () => {
          const donations = [];
          const count = Number(campaignCount);
          for (let i = 1; i <= count; i++) {
            try {
              // Use thirdweb's call method to read from contract
              const campaign = await contract.call("getCampaign", [i]);
              const campaignDonations = await contract.call("getCampaignDonations", [i]);
              
              // Campaign is returned as an array: [id, creator, goal, raised, completionTime, proofUploaded, ipfsHash]
              const campaignData = campaign && campaign.length >= 7 ? {
                id: Number(campaign[0]),
                creator: campaign[1],
                goal: campaign[2],
                raised: campaign[3],
                completionTime: campaign[4],
                proofUploaded: campaign[5],
                ipfsHash: campaign[6],
              } : null;
              
              // Filter donations for this donor
              const myDons = Array.isArray(campaignDonations) ? campaignDonations.filter(
                (don) => don.donor && don.donor.toLowerCase() === address.toLowerCase()
              ) : [];
              
              if (myDons.length > 0 && campaignData) {
                // Check if refund is available for this donor
                let canRefund = false;
                try {
                  canRefund = await contract.call("canClaimRefund", [i]);
                  // Also check if user has contributions
                  const hasContributions = myDons.some(don => !don.refunded);
                  canRefund = Boolean(canRefund) && hasContributions;
                } catch (error) {
                  // If canClaimRefund fails, assume refund not available
                  canRefund = false;
                }
                
                donations.push({
                  campaignId: i,
                  campaign: campaignData,
                  donations: myDons,
                  canRefund: canRefund,
                });
              }
            } catch (error) {
              // Campaign doesn't exist or error fetching - skip it silently
              // Only show modal for unexpected errors
              if (error.message && !error.message.includes("Campaign does not exist")) {
                showModal("Error", `Error fetching donations for campaign ${i}: ${error.message}`, "error");
              }
            }
          }
          // Sort donations by campaign ID in descending order (latest first)
          donations.sort((a, b) => b.campaignId - a.campaignId);
          setMyDonations(donations);
          setIsLoadingDonations(false);
        };
        fetchDonations();
      } else if (!address) {
        setMyDonations([]);
      }
    }, [contract, campaignCount, address]);

    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">My Donations</h2>
        {isLoadingDonations ? (
          <p className="text-slate-400">Loading donation history...</p>
        ) : myDonations.length === 0 ? (
          <p className="text-slate-400">No donations yet. <Link href="/campaigns" className="text-emerald-500 hover:underline">Browse campaigns</Link></p>
        ) : (
          <div className="space-y-4">
            {myDonations.map((item) => (
              <div key={item.campaignId} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Campaign #{item.campaignId}</h3>
                    <p className="text-slate-400 text-sm">
                      Total donated: {ethers.utils.formatEther(
                        item.donations.reduce((sum, don) => sum + BigInt(don.amount), 0n)
                      )} ETH
                    </p>
                  </div>
                  {item.canRefund && (
                    <button
                      onClick={() => handleRefund(item.campaignId)}
                      disabled={isClaimingRefund[item.campaignId]}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded transition flex items-center gap-2"
                    >
                      {isClaimingRefund[item.campaignId] && <LoadingSpinner size="w-4 h-4" />}
                      {isClaimingRefund[item.campaignId] ? "Claiming..." : "Claim Refund"}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {item.donations.map((donation, idx) => (
                    <div key={idx} className="text-sm text-slate-300">
                      {ethers.utils.formatEther(donation.amount)} ETH - {new Date(Number(donation.timestamp) * 1000).toLocaleString()}
                      {donation.refunded && <span className="text-red-400 ml-2">(Refunded)</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
              href="/campaigns"
              className="text-slate-300 hover:text-emerald-500 transition"
            >
              Campaigns
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
        <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>

        {!address && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-300 mb-4">Please connect your wallet</p>
            <ConnectWallet />
          </div>
        )}

        {address && !contract && (
          <div className="bg-yellow-800/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
            <p className="text-yellow-400">⚠️ Contract not loaded. Check contract address: {SENDER_CONTRACT_ADDRESS}</p>
          </div>
        )}

        {address && (isLoadingRole || isLoadingRoleData) && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-300">Loading your role...</p>
          </div>
        )}

        {address && showRoleSelector && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Select Your Role</h2>
            <p className="text-slate-300 mb-6">Choose your role to get started. This cannot be changed later.</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleRegister(Role.CREATOR)}
                disabled={isRegistering}
                className="flex-1 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex flex-col items-center justify-center"
              >
                {isRegistering ? (
                  <>
                    <LoadingSpinner size="w-5 h-5" />
                    <p className="text-sm mt-2 opacity-90">Registering...</p>
                  </>
                ) : (
                  <>
                    Creator
                    <p className="text-sm mt-2 opacity-90">Create and manage campaigns</p>
                  </>
                )}
              </button>
              <button
                onClick={() => handleRegister(Role.DONOR)}
                disabled={isRegistering}
                className="flex-1 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex flex-col items-center justify-center"
              >
                {isRegistering ? (
                  <>
                    <LoadingSpinner size="w-5 h-5" />
                    <p className="text-sm mt-2 opacity-90">Registering...</p>
                  </>
                ) : (
                  <>
                    Donor
                    <p className="text-sm mt-2 opacity-90">Donate to campaigns</p>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {address && userRole === Role.CREATOR && <CreatorDashboard />}
        {address && userRole === Role.DONOR && <DonorDashboard />}
        {address && userRole === Role.NONE && !showRoleSelector && (
          <p className="text-slate-400">Please select a role above</p>
        )}
        {address && userRole === null && !isLoadingRole && !showRoleSelector && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-300 mb-4">Unable to load your role. Please try refreshing or select a role.</p>
            <button
              onClick={() => setShowRoleSelector(true)}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded transition"
            >
              Select Role
            </button>
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
        showConfirm={modal.showConfirm}
        onConfirm={modal.onConfirm || closeModal}
      />
    </div>
  );
}
