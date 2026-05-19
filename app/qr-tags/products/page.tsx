'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const PRODUCTS = [
  { id: 1, name: 'iPhone 14 Pro', price: 129999, category: 'Electronics', sku: 'APL-IP14P', stock: 24, description: 'Apple flagship smartphone with Dynamic Island' },
  { id: 2, name: 'Samsung QLED TV 55"', price: 89999, category: 'Electronics', sku: 'SAM-TV55Q', stock: 8, description: 'Quantum dot technology smart LED TV' },
  { id: 3, name: 'Sony WH-1000XM5', price: 29999, category: 'Electronics', sku: 'SNY-WH5', stock: 31, description: 'Industry-leading noise cancelling headphones' },
  { id: 4, name: 'MacBook Air M2', price: 114999, category: 'Electronics', sku: 'APL-MBA-M2', stock: 12, description: 'Apple silicon powered ultra-thin laptop' },
  { id: 5, name: 'Running Shoes Pro', price: 5999, category: 'Footwear', sku: 'SHOE-RUN-P', stock: 56, description: 'Premium cushioned running shoes' },
  { id: 6, name: 'Yoga Mat Premium', price: 2499, category: 'Sports', sku: 'YOG-MAT-P', stock: 43, description: 'Non-slip TPE yoga mat 6mm thick' },
  { id: 7, name: 'Cotton Polo Shirt', price: 1299, category: 'Fashion', sku: 'POLO-CTN-M', stock: 120, description: '100% cotton premium polo shirt' },
  { id: 8, name: 'Leather Wallet', price: 1799, category: 'Fashion', sku: 'WALT-LTH-BK', stock: 67, description: 'Genuine leather bifold wallet' },
  { id: 9, name: 'Stainless Steel Bottle', price: 899, category: 'Kitchen', sku: 'BTTLE-SS-1L', stock: 88, description: 'Double-wall insulated water bottle 1L' },
  { id: 10, name: 'Aroma Diffuser', price: 2199, category: 'Home', sku: 'AROM-DIFF-W', stock: 29, description: 'Ultrasonic cool mist humidifier with LED' },
];

const CATEGORIES = [...new Set(PRODUCTS.map(p => p.category))];

const TEMPLATES = {
  modern: { label: 'Modern Dark', borderColor: '#111827', priceColor: '#111827', badgeBg: '#111827', badgeText: '#fff', brand: 'STORE', accent: '#111827' },
  blue: { label: 'Ocean Blue', borderColor: '#1d4ed8', priceColor: '#1d4ed8', badgeBg: '#dbeafe', badgeText: '#1e40af', brand: 'PEXIFLY', accent: '#1d4ed8' },
  amber: { label: 'Amber Gold', borderColor: '#d97706', priceColor: '#b45309', badgeBg: '#fef3c7', badgeText: '#92400e', brand: 'PREMIUM', accent: '#b45309' },
  emerald: { label: 'Fresh Green', borderColor: '#059669', priceColor: '#047857', badgeBg: '#d1fae5', badgeText: '#065f46', brand: 'BRAND', accent: '#047857' },
  rose: { label: 'Rose Red', borderColor: '#e11d48', priceColor: '#be123c', badgeBg: '#ffe4e6', badgeText: '#9f1239', brand: 'STYLE', accent: '#be123c' },
};

const LAYOUTS = ['top-qr', 'bottom-qr', 'side-qr'];

/* ─────────────────────────────────────────────
   PRODUCT TAG COMPONENT
───────────────────────────────────────────── */
function ProductTag({ product, template = 'modern', layout = 'top-qr', config = {}, printMode = false }) {
  const t = TEMPLATES[template] || TEMPLATES.modern;
  const qrVal = `SKU:${product.sku}|ID:${product.id}`;

  if (layout === 'side-qr') {
    return (
      <div style={{
        background: '#fff',
        border: `2px solid ${t.borderColor}`,
        borderRadius: 20,
        width: printMode ? '100%' : 400,
        height: printMode ? 'auto' : 220,
        display: 'flex',
        overflow: 'hidden',
        boxShadow: printMode ? 'none' : '0 4px 24px rgba(0,0,0,0.08)',
        pageBreakInside: 'avoid',
      }}>
        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: t.accent, marginBottom: 6 }}>{t.brand}</div>
          {config.showName !== false && <div style={{ fontWeight: 700, fontSize: 17, color: '#111', lineHeight: 1.2, marginBottom: 4 }}>{product.name}</div>}
          {config.showSku !== false && <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#888', marginBottom: 10 }}>SKU: {product.sku}</div>}
          {config.showPrice !== false && <div style={{ fontSize: 26, fontWeight: 800, color: t.priceColor }}>₹{product.price.toLocaleString('en-IN')}</div>}
          {config.showDescription !== false && <div style={{ fontSize: 11, color: '#666', marginTop: 6, lineHeight: 1.4 }}>{product.description}</div>}
        </div>
        <div style={{ width: 140, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${t.borderColor}20` }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 8 }}>
            <QRCodeSVG value={qrVal} size={110} level="H" />
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'bottom-qr') {
    return (
      <div style={{
        background: '#fff',
        border: `2px solid ${t.borderColor}`,
        borderRadius: 20,
        width: printMode ? '100%' : 300,
        padding: '20px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: printMode ? 'none' : '0 4px 24px rgba(0,0,0,0.08)',
        pageBreakInside: 'avoid',
      }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: t.accent }}>{t.brand}</div>
          <div style={{ fontSize: 9, padding: '3px 10px', borderRadius: 20, background: t.badgeBg, color: t.badgeText, fontWeight: 600 }}>SCAN</div>
        </div>
        {config.showName !== false && <div style={{ fontWeight: 700, fontSize: 16, color: '#111', textAlign: 'center', marginBottom: 2 }}>{product.name}</div>}
        {config.showSku !== false && <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#888', marginBottom: 10 }}>SKU: {product.sku}</div>}
        {config.showPrice !== false && <div style={{ fontSize: 28, fontWeight: 800, color: t.priceColor, marginBottom: 14, textAlign: 'center' }}>₹{product.price.toLocaleString('en-IN')}</div>}
        <div style={{ background: '#fff', borderRadius: 12, padding: 8, border: '1px solid #f0f0f0' }}>
          <QRCodeSVG value={qrVal} size={printMode ? 120 : 140} level="H" />
        </div>
        {config.showDescription !== false && <div style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 10, lineHeight: 1.4 }}>{product.description}</div>}
        <div style={{ marginTop: 10, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: t.accent }}>SCAN TO VIEW DETAILS</div>
      </div>
    );
  }

  // Default: top-qr
  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${t.borderColor}`,
      borderRadius: 20,
      width: printMode ? '100%' : 300,
      padding: '16px 20px 18px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: printMode ? 'none' : '0 4px 24px rgba(0,0,0,0.08)',
      pageBreakInside: 'avoid',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: t.accent }}>{t.brand}</div>
        <div style={{ fontSize: 9, padding: '3px 10px', borderRadius: 20, background: t.badgeBg, color: t.badgeText, fontWeight: 600 }}>PRODUCT</div>
      </div>
      {config.showName !== false && <div style={{ fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 2, lineHeight: 1.3 }}>{product.name}</div>}
      {config.showSku !== false && <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#888', marginBottom: 12 }}>SKU: {product.sku}</div>}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 12px' }}>
        <QRCodeSVG value={qrVal} size={printMode ? 120 : 145} level="H" />
      </div>
      {config.showPrice !== false && <div style={{ fontSize: 28, fontWeight: 800, color: t.priceColor, textAlign: 'center' }}>₹{product.price.toLocaleString('en-IN')}</div>}
      {config.showDescription !== false && <div style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 6, lineHeight: 1.4 }}>{product.description}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PRINT PREVIEW MODAL
───────────────────────────────────────────── */
function PrintPreviewModal({ tags, template, layout, config, onClose }) {
  const printRef = useRef<HTMLDivElement>(null);
  const t = TEMPLATES[template] || TEMPLATES.modern;
  const tagsPerPage = layout === 'side-qr' ? 6 : 8;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `QR_Tags_${new Date().toISOString().slice(0,10)}`,
  });

  const chunks = [];
  for (let i = 0; i < tags.length; i += tagsPerPage) {
    chunks.push(tags.slice(i, i + tagsPerPage));
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .a4-page { page-break-after: always; margin: 0; box-shadow: none; border: none; }
          @page { size: A4 portrait; margin: 8mm; }
        }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,14,23,0.95)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 40px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Print Preview — {tags.length} Tags</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: '#334155', color: '#fff', border: 'none' }}>Cancel</button>
            <button onClick={handlePrint} style={{ padding: '10px 28px', borderRadius: 10, background: '#f59e0b', color: '#111', fontWeight: 700, border: 'none' }}>↓ Save as PDF / Print</button>
          </div>
        </div>

        <div ref={printRef} className="print-area" style={{ flex: 1, overflowY: 'auto', padding: '30px', background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
          {chunks.map((chunk, pageIndex) => (
            <div key={pageIndex} className="a4-page" style={{ width: '794px', minHeight: '1123px', background: '#fff', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderRadius: '4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: layout === 'side-qr' ? '1fr' : 'repeat(2, 1fr)', gap: layout === 'side-qr' ? '20px' : '24px' }}>
                {chunk.map(product => (
                  <ProductTag key={product.id} product={product} template={template} layout={layout} config={config} printMode={true} />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '30px', color: '#94a3b8', fontSize: '12px' }}>Page {pageIndex + 1} of {chunks.length}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   TEMPLATES VIEW
───────────────────────────────────────────── */
function TemplatesView({ selectedTemplate, setSelectedTemplate, selectedLayout, setSelectedLayout, onProceed }) {
  const previewProduct = PRODUCTS[0];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>Choose Template</h1>
        <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Select style and layout for your QR tags</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* Left Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Layout Selection */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 14 }}>Template</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { key: 'top-qr', label: 'QR on Top', desc: 'Info → QR → Price' },
                { key: 'bottom-qr', label: 'QR on Bottom', desc: 'Price → QR → Details' },
                { key: 'side-qr', label: 'QR on Side', desc: 'Wide landscape card' },
              ].map(l => (
                <button key={l.key} onClick={() => setSelectedLayout(l.key)} style={{
                  padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                  border: `2px solid ${selectedLayout === l.key ? '#3b82f6' : '#f1f5f9'}`,
                  background: selectedLayout === l.key ? '#eff6ff' : '#fff',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{l.label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{l.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 14 }}>STYLE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(TEMPLATES).map(([key, t]) => (
                <button key={key} onClick={() => setSelectedTemplate(key)} style={{
                  padding: '12px 14px', borderRadius: 10, border: `2px solid ${selectedTemplate === key ? t.borderColor : '#f1f5f9'}`,
                  background: selectedTemplate === key ? '#f8fafc' : '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: t.borderColor, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{t.label}</div>
                  {selectedTemplate === key && <div style={{ marginLeft: 'auto', color: t.borderColor, fontSize: 16 }}>✓</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Proceed Button */}
          <button onClick={onProceed} style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: '#0f172a', color: '#fff', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', marginTop: 10
          }}>
            Continue to Generate Tags →
          </button>
        </div>

        {/* Live Preview */}
        <div style={{ background: '#f8fafc', borderRadius: 20, border: '1px dashed #e2e8f0', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 24 }}>LIVE PREVIEW</div>
          <ProductTag
            product={previewProduct}
            template={selectedTemplate}
            layout={selectedLayout}
            config={{ showName: true, showPrice: true, showDescription: true, showSku: true }}
          />
          <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 20 }}>
            {TEMPLATES[selectedTemplate]?.label} · {selectedLayout.replace('-', ' ')}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GENERATE VIEW
───────────────────────────────────────────── */
function GenerateView({ template, layout }) {
  const [filterType, setFilterType] = useState('all');
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [config, setConfig] = useState({ showName: true, showPrice: true, showDescription: true, showSku: true });
  const [generated, setGenerated] = useState([]);
  const [showPrint, setShowPrint] = useState(false);

  const handleGenerate = () => {
    let result = [...PRODUCTS];
    if (filterType === 'category') result = PRODUCTS.filter(p => p.category === selectedCat);
    else if (filterType === 'custom') result = PRODUCTS.filter(p => selectedIds.includes(p.id));
    setGenerated(result);
  };

  const toggleId = id => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleConfig = key => setConfig(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      {showPrint && (
        <PrintPreviewModal
          tags={generated}
          template={template}
          layout={layout}
          config={config}
          onClose={() => setShowPrint(false)}
        />
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111' }}>Generate QR Tags</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>
          Using: <strong>{TEMPLATES[template]?.label}</strong> · {layout.replace('-', ' ')} layout
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Left Panel - Filters & Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Product Selection */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>PRODUCT SELECTION</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['all', 'All Products', `${PRODUCTS.length} products`], ['category', 'By Category', 'Filter by category'], ['custom', 'Custom Selection', 'Pick individual products']].map(([v, l, d]) => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${filterType === v ? '#3b82f6' : '#f1f5f9'}`, background: filterType === v ? '#eff6ff' : 'transparent' }}>
                  <input type="radio" checked={filterType === v} onChange={() => setFilterType(v)} style={{ accentColor: '#3b82f6' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{l}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{d}</div>
                  </div>
                </label>
              ))}
            </div>

            {filterType === 'category' && (
              <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} style={{ width: '100%', marginTop: 14, padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            {filterType === 'custom' && (
              <div style={{ marginTop: 14, maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {PRODUCTS.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: selectedIds.includes(p.id) ? '#eff6ff' : 'transparent' }}>
                    <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleId(p.id)} style={{ accentColor: '#3b82f6' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{p.sku}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>₹{p.price.toLocaleString('en-IN')}</div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Tag Content Config */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>TAG CONTENT</div>
            {[['showName', 'Product Name'], ['showPrice', 'Price (₹)'], ['showSku', 'SKU Code'], ['showDescription', 'Description']].map(([k, l]) => (
              <label key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}>
                <span style={{ fontSize: 13, color: '#374151' }}>{l}</span>
                <div onClick={() => toggleConfig(k)} style={{ width: 40, height: 22, borderRadius: 11, background: config[k] ? '#3b82f6' : '#e2e8f0', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', top: 3, left: config[k] ? 20 : 3, width: 16, height: 16, borderRadius: 8, background: '#fff', transition: 'left 0.2s' }} />
                </div>
              </label>
            ))}
          </div>

          <button onClick={handleGenerate} disabled={filterType === 'custom' && selectedIds.length === 0} style={{ width: '100%', padding: '14px', borderRadius: 14, background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 14 }}>
            Generate QR Tags
          </button>
        </div>

        {/* Right Panel - Preview */}
        <div>
          {generated.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 20, border: '2px dashed #e2e8f0', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ fontSize: 48, opacity: 0.15 }}>◎</div>
              <div style={{ fontSize: 15, color: '#94a3b8' }}>Select products and click Generate</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div><strong>{generated.length}</strong> tags ready</div>
                <button onClick={() => setShowPrint(true)} style={{ padding: '12px 24px', borderRadius: 12, background: '#f59e0b', color: '#111', fontWeight: 700 }}>Print Preview (A4)</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: layout === 'side-qr' ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {generated.map(p => <ProductTag key={p.id} product={p} template={template} layout={layout} config={config} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function ProductQRApp() {
  const [activeTab, setActiveTab] = useState<'templates' | 'generate'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [selectedLayout, setSelectedLayout] = useState('top-qr');

  const handleProceedToGenerate = () => {
    setActiveTab('generate');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top Navigation */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 40px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => setActiveTab('templates')}
          style={{
            padding: '10px 24px',
            borderRadius: 9999,
            background: activeTab === 'templates' ? '#0f172a' : '#f1f5f9',
            color: activeTab === 'templates' ? '#fff' : '#64748b',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          style={{
            padding: '10px 24px',
            borderRadius: 9999,
            background: activeTab === 'generate' ? '#0f172a' : '#f1f5f9',
            color: activeTab === 'generate' ? '#fff' : '#64748b',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Generate
        </button>
      </div>

      <main style={{ padding: '40px' }}>
        {activeTab === 'templates' && (
          <TemplatesView
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            selectedLayout={selectedLayout}
            setSelectedLayout={setSelectedLayout}
            onProceed={handleProceedToGenerate}
          />
        )}

        {activeTab === 'generate' && (
          <GenerateView template={selectedTemplate} layout={selectedLayout} />
        )}
      </main>
    </div>
  );
}