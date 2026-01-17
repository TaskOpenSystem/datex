export default function FeaturesSection() {
  return (
    <section className="py-10 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="md:col-span-12">
        {/* Header */}
        <div className="text-center mb-16 mt-20">
          <h3 className="font-display text-5xl md:text-6xl uppercase leading-none dark:text-white">
            Built for <br />
            Speed & Scale
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Left Column */}
          <div className="flex flex-col gap-8">
            {/* Walrus */}
            <div className="bg-slush-yellow p-6 rounded-large border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 mb-4 rounded-full border-2 border-black overflow-hidden bg-white">
                <img src="/walrus.svg" alt="Walrus" className="w-full h-full object-cover" />
              </div>
              <h4 className="font-display text-2xl uppercase mb-2 text-black">Walrus Storage</h4>
              <p className="text-black font-medium">
                Precise, censorship-resistant storage optimized for large datasets. Ensures your data is always available and secure at low cost.
              </p>
            </div>

            {/* Sui */}
            <div className="bg-primary p-6 rounded-large border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 mb-4 rounded-full border-2 border-black overflow-hidden bg-white flex items-center justify-center">
                <img src="/sui.svg" alt="Sui" className="w-8 h-8 object-contain" />
              </div>
              <h4 className="font-display text-2xl uppercase mb-2 text-white">Sui Layer 1</h4>
              <p className="text-white font-medium">
                High-performance blockchain with infinite horizontal scalability. Enables instant finality and ultra-low gas fees for seamless operations.
              </p>
            </div>

            {/* Enoki */}
            <div className="bg-slush-red p-6 rounded-large border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
              <div className="h-8 mb-4 flex items-center">
                <img src="/enoki.svg" alt="Enoki" className="h-full w-auto text-black" />
              </div>
              <div className="mt-4">
                <h4 className="font-display text-2xl uppercase mb-2 text-black">Frictionless UX</h4>
                <p className="text-black font-medium">
                  Seamless onboarding with zkLogin. Users sign in with Web2 credentials while maintaining full self-custody and security.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (Offset) */}
          <div className="flex flex-col gap-8 md:mt-24">
            {/* Seal */}
            <div className="bg-slush-purple p-6 rounded-large border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 mb-4 rounded-full border-2 border-black overflow-hidden bg-white flex items-center justify-center">
                <img src="/seal.svg" alt="Seal" className="w-8 h-8 object-contain" />
              </div>
              <h4 className="font-display text-2xl uppercase mb-2 text-black">Seal Encryption</h4>
              <p className="text-black font-medium">
                Protects data with threshold encryption and on-chain access control. Secures sensitive assets at rest and in transit.
              </p>
            </div>

            {/* Nautilus */}
            <div className="bg-slush-green p-6 rounded-large border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full border-2 border-black bg-white">
                <span className="material-icons text-black">visibility</span>
              </div>
              <h4 className="font-display text-2xl uppercase mb-2 text-black">Nautilus Compute</h4>
              <p className="text-black font-medium">
                Executes sensitive logic in Trusted Execution Environments (TEEs) with on-chain verification. Enables private, trustless dataset sample extraction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
