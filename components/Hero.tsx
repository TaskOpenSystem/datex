export default function Hero() {
  return (
    <header className="relative min-h-screen flex flex-col items-center justify-center pt-24 overflow-hidden">
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-90">
        <img
          alt="Abstract 3D Blue Fluid Shape"
          className="w-[800px] h-[800px] object-cover rounded-full blur-sm animate-float mix-blend-multiply dark:mix-blend-lighten opacity-60"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxGDQ2raWYTkZUV_t_AysmSYYrV93tcGjNFWumodabC8O6V43V-KOhHQEhnW6oxhNMZQcm-lEgmlS4kN3BOifSNOm_bvoXS-iT83bVY8ulZCI_pudlabVHhEmq99LHVkZ6WxLvSLcjjGCCS7P8ggXzrgVthsfvnAUkn8MynriHtCwYG_36Wezl9IIL9XcONsdTyQQjlbEQYb1hJAtYGLzJPpmPQWwlxjc2zC_RcNqCHuph-8UiKdzqEVRyfag0T_m_v-zSFMqe-a0"
        />
      </div>
      <div
        className="absolute top-1/4 left-10 md:left-20 animate-float"
        style={{ animationDelay: "1s" }}
      >
        <div className="bg-slush-yellow w-16 h-16 md:w-24 md:h-24 rounded-2xl border-4 border-black dark:border-white flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transform -rotate-12">
          <span className="material-icons text-4xl md:text-5xl text-black">
            storage
          </span>
        </div>
      </div>
      <div
        className="absolute bottom-1/3 right-10 md:right-24 animate-float"
        style={{ animationDelay: "2s" }}
      >
        <div className="bg-slush-purple w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-black dark:border-white flex items-center justify-center shadow-[-8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[-8px_8px_0px_0px_rgba(255,255,255,1)] transform rotate-12">
          <span className="material-icons text-4xl md:text-6xl text-white">
            lock
          </span>
        </div>
      </div>
      {/* Data Icon */}
      <div
        className="absolute top-32 right-12 md:right-32 animate-float"
        style={{ animationDelay: "1.5s" }}
      >
        <div className="bg-primary w-14 h-14 md:w-20 md:h-20 rounded-xl border-4 border-black dark:border-white flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transform rotate-6">
          <span className="material-icons text-3xl md:text-5xl text-white">
            dns
          </span>
        </div>
      </div>
      {/* Encryption Icon */}
      <div
        className="absolute bottom-20 left-12 md:left-32 animate-float"
        style={{ animationDelay: "2.5s" }}
      >
        <div className="bg-slush-orange w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-black dark:border-white flex items-center justify-center shadow-[-6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[-6px_6px_0px_0px_rgba(255,255,255,1)] transform -rotate-6">
          <span className="material-icons text-3xl md:text-5xl text-white">
            enhanced_encryption
          </span>
        </div>
      </div>
      {/* Decentralize Icon */}
      <div
        className="absolute bottom-24 right-8 md:right-20 animate-float"
        style={{ animationDelay: "3s" }}
      >
        <div className="bg-slush-green w-12 h-12 md:w-18 md:h-18 rounded-lg border-4 border-black dark:border-white flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transform rotate-12">
          <span className="material-icons text-2xl md:text-4xl text-black">
            hub
          </span>
        </div>
      </div>
      <div className="relative z-10 text-center max-w-5xl px-4 flex flex-col items-center">
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-black/50 border border-black dark:border-white rounded-full backdrop-blur-sm">
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-bold tracking-widest uppercase">
            Powered by Sui Ecosystem
          </span>
        </div>
        <h1 className="font-display text-[5rem] md:text-[9rem] leading-[0.85] tracking-tighter uppercase mb-6 transform -rotate-1">
          <span className="block">Data</span>
          <span className="block text-primary">Exchange</span>
          <span className="block text-outline-light dark:text-outline-dark">
            Unlocked
          </span>
        </h1>
        <p className="text-lg md:text-xl font-medium max-w-xl mx-auto mb-10 text-gray-700 dark:text-gray-300">
          Monetize your data securely. Built on Walrus, Seal, and Nautilus
          for unstoppable decentralized data trading.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          <button className="bg-black dark:bg-white text-white dark:text-black text-lg px-8 py-4 rounded-full font-bold uppercase tracking-wide hover:scale-105 transition-transform shadow-lg">
            Start Monetizing Data
          </button>
          <button className="bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white text-lg px-8 py-4 rounded-full font-bold uppercase tracking-wide hover:scale-105 transition-transform shadow-lg">
            Learn More
          </button>
        </div>
      </div>
    </header>
  );
}
