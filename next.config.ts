/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  // This suppresses favicon 404 warnings
  async generateBuildId() {
    return 'build'
  },
}

export default nextConfig