export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-auto">
      <div className="max-w-screen-xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="font-light text-white">
            Resonant
          </div>
          <a
            href="https://kaufman.io"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-40 hover:opacity-70 transition-opacity"
            aria-label="Built by Henry Kaufman"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 128 128"
              className="w-5 h-5"
            >
              <rect width="128" height="128" rx="24" fill="white" />
              <text
                x="64"
                y="88"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="56"
                fontWeight="700"
                textAnchor="middle"
                fill="#0f172a"
              >
                HK
              </text>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
