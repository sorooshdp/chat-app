/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevents site from being framed (clickjacking protection)
          },,
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevents the browser from guessing the content type
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Controls how much referrer info is passed
          }
        ]
      },
    ];
  },
};

export default nextConfig;
