export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0A]">
      <div className="border-2 border-[#2A2A2A] p-10 max-w-md w-full mx-4 text-center">
        <p className="font-['JetBrains_Mono'] text-[#FF6B00] text-xs tracking-widest uppercase mb-6">404</p>
        <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-[#888888] text-sm mb-8">The page you are looking for does not exist.</p>
        <a href="/" className="btn-primary">Back to Home</a>
      </div>
    </div>
  );
}
