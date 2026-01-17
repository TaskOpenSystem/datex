export default function FeaturesSection() {
  return (
    <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-12 text-center">
        <h2 className="font-display text-5xl md:text-6xl mb-4 uppercase">
          Your Shortcut to get <br className="md:hidden" />
          Data
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 bg-slush-yellow rounded-large border-4 border-black p-8 relative overflow-hidden group min-h-[400px]">
          <div className="relative z-10">
            <h3 className="font-display text-5xl md:text-6xl text-black uppercase leading-none mb-4">
              Explore
              <br />
              Data
              <br />
              Opportunities
            </h3>
            <p className="text-black font-semibold text-lg max-w-xs mb-8">
              Discover vetted datasets to put your algorithms to work through
              your next AI models.
            </p>
            <button className="bg-black text-white px-6 py-2 rounded-full font-bold text-sm uppercase group-hover:bg-white group-hover:text-black transition-colors">
              Start Now{" "}
              <span className="material-icons text-sm align-middle ml-1">
                arrow_forward
              </span>
            </button>
          </div>
          <div className="absolute -right-10 bottom-0 w-64 h-64 md:w-80 md:h-80">
            <img
              alt="Coins"
              className="w-full h-full object-cover rounded-full border-4 border-black transform rotate-12 group-hover:rotate-0 transition-transform duration-500"
              src="/walrus.svg"
            />
          </div>
        </div>
        <div className="md:col-span-5 bg-slush-purple rounded-large border-4 border-black p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="z-10">
            <h3 className="font-display text-4xl md:text-5xl text-white uppercase leading-none mb-4 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              Simple, Direct
              <br />
              Execution
            </h3>
            <p className="text-white font-medium">
              Buy and sell datasets in a few taps. Verify dataset with simple
              click.
            </p>
          </div>
          <div className="mt-8 relative h-48 bg-white rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {/* Animation Container */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              {/* Buy Button */}
              <button
                className="buy-button bg-black text-white px-8 py-3 rounded-full font-bold text-sm uppercase tracking-wide border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
              >
                Buy Now
                <span className="material-icons text-sm align-middle ml-2">shopping_cart</span>
              </button>

              {/* Animated Cursor */}
              <div className="cursor-animation absolute">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 2L4 18L8 14L12 22L14 21L10 13L16 13L4 2Z"
                    fill="black"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-12">
          {/* Header */}
          <div className="text-center mb-16 mt-20">
            {/* <div className="inline-block bg-slush-green px-3 py-1 rounded-full border border-black mb-4">
              <span className="font-bold text-xs uppercase text-black">
                Powered by Sui
              </span>
            </div> */}
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
      </div>
    </section>
  );
}
