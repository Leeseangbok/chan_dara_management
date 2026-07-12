export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
      <defs>
        <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <g>
        <path fill="url(#brandGradient)" fillRule="evenodd" d="M376 304c0-66-54-120-120-120s-120 54-120 120c0 78 48 160 120 160s120-82 120-160zm-72 16h-28v28c0 8.8-7.2 16-16 16s-16-7.2-16-16v-28h-28c-8.8 0-16-7.2-16-16s7.2-16 16-16h28v-28c0-8.8 7.2-16 16-16s16 7.2 16 16v28h28c8.8 0 16 7.2 16 16s-7.2 16-16 16z"/>
        <ellipse fill="url(#brandGradient)" cx="128" cy="240" rx="44" ry="52" transform="rotate(-35 128 240)" />
        <ellipse fill="url(#brandGradient)" cx="192" cy="112" rx="48" ry="64" transform="rotate(-15 192 112)" />
        <ellipse fill="url(#brandGradient)" cx="320" cy="112" rx="48" ry="64" transform="rotate(15 320 112)" />
        <ellipse fill="url(#brandGradient)" cx="384" cy="240" rx="44" ry="52" transform="rotate(35 384 240)" />
      </g>
    </svg>
  );
}
