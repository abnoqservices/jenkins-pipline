'use client';
import Link from 'next/link';

export default function QRHomePage() {
  return (
    <div className="p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-2">QR Code Tags Module</h1>
        <p className="text-xl text-gray-600 mb-12">Template-based QR tags for Products, Events &amp; Campaigns • A4 Print Ready</p>

        <div className="grid grid-cols-3 gap-6">
          <Link href="/qr-tags/products/generate" className="group">
            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-blue-200">
              <div className="text-6xl mb-6">📦</div>
              <h3 className="text-2xl font-semibold mb-2">Product QR Tags</h3>
              <p className="text-gray-600">Bulk generation • Category / Event / Single</p>
              <span className="inline-block mt-8 text-blue-600 font-medium group-hover:underline">Open →</span>
            </div>
          </Link>

          <Link href="/qr-tags/events/generate" className="group">
            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-blue-200">
              <div className="text-6xl mb-6">🎟️</div>
              <h3 className="text-2xl font-semibold mb-2">Event QR Tags</h3>
              <p className="text-gray-600">Single event tags with custom template</p>
              <span className="inline-block mt-8 text-blue-600 font-medium group-hover:underline">Open →</span>
            </div>
          </Link>

          <Link href="/qr-tags/campaigns/generate" className="group">
            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-blue-200">
              <div className="text-6xl mb-6">🚀</div>
              <h3 className="text-2xl font-semibold mb-2">Campaign QR Tags</h3>
              <p className="text-gray-600">Single campaign tags with offer &amp; validity</p>
              <span className="inline-block mt-8 text-blue-600 font-medium group-hover:underline">Open →</span>
            </div>
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-16">
          Use the sidebar to access Template Setup or Generate for any module.
        </p>
      </div>
    </div>
  );
}