"use client";

import Link from "next/link";
import { ConnectWallet } from "@thirdweb-dev/react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-emerald-500">
            PhilanthroCross
          </h1>
          <ConnectWallet />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 text-white">
            Cross-Chain Philanthropy Platform
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Blockchain-Enabled Cross-Chain Philanthropy: Smart-Contract Allocation
            of Social Impact and Decentralized Audit for Transparent Giving
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/campaigns"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition"
            >
              Browse Campaigns
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 font-semibold rounded-lg transition"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Architecture Explanation */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-2xl font-bold text-emerald-500 mb-4">
              Ethereum Sepolia
            </h3>
            <p className="text-slate-300 mb-4">
              Source chain where campaigns are created and donations are made.
              All fund execution logic runs here.
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2">
              <li>Campaign creation</li>
              <li>Donation processing</li>
              <li>Proof submission</li>
              <li>Refund claims</li>
            </ul>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-2xl font-bold text-emerald-500 mb-4">
              Polygon Amoy
            </h3>
            <p className="text-slate-300 mb-4">
              Audit chain that maintains an immutable Global Audit Ledger.
              All donations are mirrored here via Chainlink CCIP.
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-2">
              <li>Immutable audit entries</li>
              <li>Cross-chain verification</li>
              <li>Transparent tracking</li>
              <li>Read-only ledger</li>
            </ul>
          </div>
        </div>

        {/* Cross-Chain Flow */}
        <div className="max-w-4xl mx-auto bg-slate-800 p-8 rounded-lg border border-slate-700">
          <h3 className="text-2xl font-bold text-emerald-500 mb-6 text-center">
            How Cross-Chain Flow Works
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <p className="text-slate-300">
                Donor makes a donation on Ethereum Sepolia
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <p className="text-slate-300">
                Chainlink CCIP sends cross-chain message to Polygon Amoy
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <p className="text-slate-300">
                PhilanthroReceiver appends immutable audit entry
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <p className="text-slate-300">
                Global Audit Ledger updated - transparent and verifiable
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <Link
            href="/audit"
            className="text-emerald-500 hover:text-emerald-400 underline"
          >
            View Global Audit History →
          </Link>
        </div>
      </main>
    </div>
  );
}
