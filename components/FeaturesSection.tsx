export default function FeaturesSection() {
  return (
    <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-12 text-center">
        <h2 className="font-display text-5xl md:text-6xl mb-4 uppercase">
          Your Shortcut to <br className="md:hidden" />
          DeFi Data
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
              Sui DeFi protocols.
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
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0ai7XTEmyvO7ZQveNlfdjDqYAhddnABupzbxi4502f7gVEece6Rz4v3iehcoVnpIaHflkAILb-JJnHBJv6xbI00gskh0JKb6i6XUHI-pgiM9fUtr2TY2xhte0jk1yE_M_qtg-mNb_pgCGv8Hz348JMHm2FOqFMyiHnCeiAILzq4lsaD6_M2BzPHNfuCr_otmnG-p8huS_mYpMv3PpqeYkCox-grWR4VVyhFFwQiCbx8Dhpb9VjB-k82GNdjvOUYVRWf2AIBJVIeQ"
            />
          </div>
          <div className="absolute top-10 right-10 text-black text-6xl animate-bounce hidden md:block">
            <span className="material-icons">monetization_on</span>
          </div>
        </div>
        <div className="md:col-span-5 bg-slush-purple rounded-large border-4 border-black p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="z-10">
            <div className="bg-white border-2 border-black w-12 h-12 rounded-full flex items-center justify-center mb-6">
              <span className="material-icons text-black">touch_app</span>
            </div>
            <h3 className="font-display text-4xl md:text-5xl text-white uppercase leading-none mb-4 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              Simple, Direct
              <br />
              Execution
            </h3>
            <p className="text-white font-medium">
              Buy and sell insights in a few taps. Withdraw rewards in the
              asset you choose.
            </p>
          </div>
          <div className="mt-8 relative h-48 bg-white rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <img
              alt="Dashboard UI"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKex8a_e-zMsWgED0P_d6wr-VKsWiQ2ZgrAmzMrDUKoanS5rsZeuWOzWyp4BXNFbHuGzdDNj4G9FQEVZdNZP6YLmDF_VT0VV4Zm9_jyvOzW8_QGPs2nJL7gMWPzan9FILt9SUF-rnhGnxa8Rt-1IKb6nmvK8NNqDr5L_Zo5cpzB55YzwsmC_8AxN_Of29qguqaQGbSPGqFX-UFqM4q1KN_guIGvW5TZhU8mkgMfyRQWc9oYvXFz6jdR8ME-mPMu6wfNApTiFc8Eq8"
            />
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              <button className="bg-slush-yellow text-black border-2 border-black px-6 py-2 font-display text-2xl uppercase transform -rotate-3 hover:rotate-0 transition-transform">
                EARN!
              </button>
            </div>
          </div>
        </div>
        <div className="md:col-span-12 bg-background-light dark:bg-gray-900 rounded-large border-4 border-black dark:border-gray-700 p-8 md:p-12 relative overflow-hidden">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-block bg-slush-green px-3 py-1 rounded-full border border-black mb-4">
                <span className="font-bold text-xs uppercase text-black">
                  Powered by Sui
                </span>
              </div>
              <h3 className="font-display text-5xl md:text-6xl uppercase leading-none mb-6 dark:text-white">
                Built for <br />
                Speed & Scale
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-md">
                Leveraging the power of Nautilus for transaction speed, Walrus
                for decentralized storage, and Seal for top-tier encryption.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700">
                  <span className="material-icons text-blue-500">water</span>
                  <span className="font-bold dark:text-white">Walrus</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700">
                  <span className="material-icons text-purple-500">
                    verified_user
                  </span>
                  <span className="font-bold dark:text-white">Seal</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700">
                  <span className="material-icons text-orange-500">
                    rocket_launch
                  </span>
                  <span className="font-bold dark:text-white">Nautilus</span>
                </div>
              </div>
            </div>
            <div className="relative h-64 md:h-full min-h-[300px]">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full blur-2xl opacity-50"></div>
              <div className="relative z-10 grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transform rotate-3">
                  <span className="material-icons text-4xl mb-2 text-blue-500">
                    cloud_queue
                  </span>
                  <p className="font-display text-xl uppercase dark:text-white">
                    Storage
                  </p>
                </div>
                <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transform -rotate-2 mt-8">
                  <span className="material-icons text-4xl mb-2 text-purple-500">
                    enhanced_encryption
                  </span>
                  <p className="font-display text-xl uppercase dark:text-white">
                    Security
                  </p>
                </div>
                <div className="col-span-2 bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transform rotate-1 w-2/3 mx-auto">
                  <span className="material-icons text-4xl mb-2 text-orange-500">
                    bolt
                  </span>
                  <p className="font-display text-xl uppercase dark:text-white">
                    Speed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
