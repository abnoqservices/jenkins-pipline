'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type Ref } from 'react';
import { useReactToPrint } from 'react-to-print';
import axiosClient from '@/lib/axiosClient';
import { showToast } from '@/lib/showToast';
import { TEMPLATE_LIBRARY } from '@/lib/qr-tag-templates';
import '@/lib/qr-tag-templates/tagstyle.css';
import type {
  Align,
  FieldKey,
  Orientation,
  Product,
  TagConfig,
  TemplateDef,
} from '@/lib/qr-tag-templates/types';
import { usePermissions } from "@/lib/usePermissions";
import {
  PermissionRestrictedButton,
  PermissionRestrictedMenuItem,
} from "@/components/PermissionRestrictedButton";
type FilterType = 'all' | 'event' | 'category';

type PrintGridStyle = CSSProperties & {
  '--print-columns'?: number;
  '--print-rows'?: number;
  '--generated-columns'?: number;
};

const DEFAULT_CONFIG: TagConfig = {
  showName: true,
  showPrice: true,
  showDescription: true,
  showSku: true,
  showQr: true,
  showLogo: true,
  align: 'left',
  tagBackground: '#ffffff',
  textColor: '#111827',
  borderColor: '#111827',
  qrPanelBackground: '#f6f7f9',
  accentColor: '#3b82f6',
  borderRadius: 20,
};

const DEFAULT_PRINT_LAYOUT: Record<Orientation, { columns: number; rows: number }> = {
  landscape: { columns: 2, rows: 3 },
  portrait: { columns: 3, rows: 3 },
};

function extractProducts(payload: unknown): Product[] {
  if (Array.isArray(payload)) return payload as Product[];

  if (payload && typeof payload === 'object') {
    const data = payload as { data?: unknown };
    if (Array.isArray(data.data)) return data.data as Product[];

    if (data.data && typeof data.data === 'object') {
      const nested = data.data as { data?: unknown };
      if (Array.isArray(nested.data)) return nested.data as Product[];
    }
  }
  return [];
}

function getCategoryName(product: Product) {
  return typeof product.category === 'object' ? product.category?.name : product.category;
}

function buildPageStyle(orientation: Orientation) {
  return `
    @page { size: A4 ${orientation}; margin: 0; }
    html, body {
      margin: 0 !important; padding: 0 !important; background: #fff !important;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
  `;
}

function ProductTag({
  product,
  template,
  config,
  logo,
  printMode = false,
  exportRef,
}: {
  product?: Product | null;
  template: TemplateDef;
  config: TagConfig;
  logo: string | null;
  printMode?: boolean;
  exportRef?: Ref<HTMLDivElement>;
}) {
  if (!product) {
    return (
      <div className="product-tag flex h-[220px] items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 text-gray-400">
        No product data
      </div>
    );
  }

  const TemplateComponent = template.Component;
  return <TemplateComponent product={product} template={template} config={config} logo={logo} printMode={printMode} exportRef={exportRef} />;
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="switch-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  );
}

function TemplateSlider({
  templates,
  selectedId,
  onSelect,
}: {
  templates: TemplateDef[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const selectedIndex = templates.findIndex((t) => t.id === selectedId);

  useEffect(() => {
    if (selectedIndex === -1) return;
    setCurrentIndex(selectedIndex);
    const timer = setTimeout(() => {
      const slider = sliderRef.current;
      if (!slider) return;
      const cardWidth = 254;
      const scrollPosition = selectedIndex * cardWidth - (slider.offsetWidth - cardWidth) / 2;
      slider.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedIndex]);

  const scrollToCard = (index: number) => {
    const slider = sliderRef.current;
    if (!slider) return;
    const cardWidth = 254;
    const scrollPosition = index * cardWidth - (slider.offsetWidth - cardWidth) / 2;
    slider.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
  };

  const goToPrev = () => {
    const next = Math.max(0, currentIndex - 1);
    setCurrentIndex(next);
    onSelect(templates[next].id);
    scrollToCard(next);
  };

  const goToNext = () => {
    const next = Math.min(templates.length - 1, currentIndex + 1);
    setCurrentIndex(next);
    onSelect(templates[next].id);
    scrollToCard(next);
  };

  return (
    <div className="template-slider-wrapper">
      <div className="slider-header">
        <div className="slider-nav">
          <button type="button" onClick={goToPrev} disabled={currentIndex === 0} className="nav-btn">Prev</button>
          <button type="button" onClick={goToNext} disabled={currentIndex === templates.length - 1} className="nav-btn">Next</button>
        </div>
      </div>

      <div ref={sliderRef} className="template-slider">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={`template-card ${selectedId === template.id ? 'selected' : ''}`}
          >
            <div className={`mini-template-preview ${template.orientation}`}>
              {template.previewImage ? (
                <img src={template.previewImage} alt={template.name} className="template-preview-image" />
              ) : (
                <div className={`mini-template ${template.orientation} ${template.structure}`}>
                  <span>Details</span><i>QR</i>
                  {template.structure === 'details-qr-details' && <span>Details</span>}
                  {template.structure === 'image-details-qr' && <span>Image</span>}
                </div>
              )}
            </div>
            <strong>{template.name}</strong>
            <small>{template.description}</small>
          </button>
        ))}
      </div>

      <div className="slider-dots">
        {templates.map((t, i) => (
          <button key={t.id} type="button" className={`dot ${i === selectedIndex ? 'active' : ''}`} onClick={() => onSelect(t.id)} />
        ))}
      </div>
    </div>
  );
}

function PrintPreviewModal({ tags, template, config, logo, onClose }: {
  tags: Product[]; template: TemplateDef; config: TagConfig; logo: string | null; onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const layout = DEFAULT_PRINT_LAYOUT[template.orientation];
  const tagsPerPage = layout.columns * layout.rows;
  const chunks: Product[][] = [];
  for (let i = 0; i < tags.length; i += tagsPerPage) chunks.push(tags.slice(i, i + tagsPerPage));

  const printGridStyle: PrintGridStyle = { '--print-columns': layout.columns, '--print-rows': layout.rows };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `QR_Tags_${new Date().toISOString().slice(0, 10)}`,
    pageStyle: buildPageStyle(template.orientation),
  });

  return (
    <div className="modal-backdrop">
      <div className="modal-bar">
        <div>
          <strong>Print Preview</strong>
          <span>{tags.length} tags • {chunks.length} page{chunks.length > 1 ? 's' : ''}</span>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" className="primary amber" onClick={handlePrint}>Save PDF / Print</button>
        </div>
      </div>

      <div ref={printRef} className="print-area">
        {chunks.map((chunk, idx) => (
          <div key={idx} className={`a4-page ${template.orientation}`}>
            <div className={`print-grid ${template.orientation}`} style={printGridStyle}>
              {chunk.map((p) => (
                <div key={p.id} className="print-tag-cell">
                  <ProductTag product={p} template={template} config={config} logo={logo} printMode />
                </div>
              ))}
            </div>
            <div className="page-count">Page {idx + 1} of {chunks.length}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductQRApp() {
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATE_LIBRARY.landscape[0].id);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [config, setConfig] = useState<TagConfig>(DEFAULT_CONFIG);
  const [logo, setLogo] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Product[]>([]);
  const [showPrint, setShowPrint] = useState(false);
  const [tabshow, setTabshow] = useState(true);
  const [tabgenshow, setgenTabshow] = useState(false);

  const [events, setEvents] = useState<Array<{ id: number; name: string }>>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [eventProducts, setEventProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);
  const templates = TEMPLATE_LIBRARY[orientation];
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const previewProduct = allProducts.find((p) => p.id === selectedProductId) ||
    allProducts.find((p) => selectedProductIds.includes(p.id)) || allProducts[0];

  const activePrintLayout = DEFAULT_PRINT_LAYOUT[orientation];
  const generatedGridStyle: PrintGridStyle = { '--generated-columns': activePrintLayout.columns };
  const { hasPermission } = usePermissions();
  // ==================== DATA LOADING ====================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [eventsRes, productsRes] = await Promise.all([
          axiosClient.get('/events'),
          axiosClient.get('/products?per_page=100'),
        ]);
        const eventsData = eventsRes.data.data || [];
        const products = extractProducts(productsRes.data);

        setEvents(eventsData);
        setAllProducts(products);
        if (products.length) setSelectedProductId(products[0].id);
        if (eventsData.length) setSelectedEventId(eventsData[0].id);
      } catch {
        showToast('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setSelectedTemplateId(TEMPLATE_LIBRARY[orientation][0].id);
  }, [orientation]);

  const categories = useMemo(() => {
    return Array.from(new Set(allProducts.map(getCategoryName).filter((c): c is string => Boolean(c))));
  }, [allProducts]);

  // ==================== FILTERING ====================
  const filteredProducts = useMemo(() => {
    if (filterType === 'event') return eventProducts;
    if (filterType === 'category') {
      if (!selectedCategory) return [];
      return allProducts.filter((p) => getCategoryName(p) === selectedCategory);
    }
    return allProducts;
  }, [allProducts, eventProducts, filterType, selectedCategory]);

  const filteredAndSearchedProducts = useMemo(() => {
    if (!searchTerm.trim()) return filteredProducts;

    const term = searchTerm.toLowerCase().trim();
    return filteredProducts.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(term);
      const skuMatch = product.sku?.toLowerCase().includes(term);
      return nameMatch || skuMatch;
    });
  }, [filteredProducts, searchTerm]);

  // ==================== DEFAULT SELECT ALL ====================
  useEffect(() => {
    if (filteredAndSearchedProducts.length > 0) {
      const allIds = filteredAndSearchedProducts.map((p) => p.id);
      setSelectedProductIds(allIds);
      if (allIds.length > 0) setSelectedProductId(allIds[0]);
    } else {
      setSelectedProductIds([]);
    }
  }, [filteredAndSearchedProducts]);

  const selectedIdSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds]);
  const selectedFilteredCount = filteredAndSearchedProducts.filter((p) => selectedIdSet.has(p.id)).length;
  const allFilteredAndSearchedSelected = filteredAndSearchedProducts.length > 0 && 
    selectedFilteredCount === filteredAndSearchedProducts.length;

  // ==================== EVENT PRODUCTS ====================
  useEffect(() => {
    if (filterType !== 'event' || !selectedEventId) {
      setEventProducts([]);
      setFilterLoading(false);
      return;
    }

    let active = true;
    const loadEventProducts = async () => {
      setFilterLoading(true);
      try {
        const response = await axiosClient.get(`/events/${selectedEventId}/products`);
      
        if (active) setEventProducts(extractProducts(response.data));
      } catch {
        if (active) {
          setEventProducts([]);
          showToast('Failed to load event products', 'error');
        }
      } finally {
        if (active) setFilterLoading(false);
      }
    };
    loadEventProducts();
    return () => { active = false; };
  }, [filterType, selectedEventId]);

  // ==================== HANDLERS ====================
  const toggleField = (key: FieldKey) => setConfig((c) => ({ ...c, [key]: !c[key] }));

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleProductSelection = (productId: number) => {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
    setSelectedProductId(productId);
  };

  const handleToggleSelectAll = () => {
    if (allFilteredAndSearchedSelected) {
      setSelectedProductIds((current) =>
        current.filter((id) => !filteredAndSearchedProducts.some((p) => p.id === id))
      );
    } else {
      const newIds = [...new Set([...selectedProductIds, ...filteredAndSearchedProducts.map((p) => p.id)])];
      setSelectedProductIds(newIds);
      if (newIds.length) setSelectedProductId(newIds[0]);
    }
  };

  const handleGenerate = () => {
    if (filterLoading) {
      showToast('Products are still loading...', 'error');
      return;
    }
    if (!selectedProductIds.length) {
      showToast('Select at least one product', 'error');
      return;
    }

    const result = filteredProducts.filter((p) => selectedIdSet.has(p.id));
    setGenerated(result);
    showToast(`${result.length} QR tags generated`, 'success');
  };

  return (
    <div className="qr-builder">
      {showPrint && (
        <PrintPreviewModal tags={generated} template={selectedTemplate} config={config} logo={logo} onClose={() => setShowPrint(false)} />
      )}

      <main className="builder-shell">
        <aside className="controls">
          {tabshow && (
            <>
              <section className="panel">
                <h2>Layout Type</h2>
                <div className="segmented">
                  {(['landscape', 'portrait'] as Orientation[]).map((item) => (
                    <button key={item} type="button" className={orientation === item ? 'active' : ''} onClick={() => setOrientation(item)}>
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel">
                <h2>Templates</h2>
                <TemplateSlider templates={templates} selectedId={selectedTemplateId} onSelect={setSelectedTemplateId} />
              </section>
            </>
          )}

          {tabgenshow && (
            <section className="panel">
              <h2>Step 1: Select Products</h2>
              <p style={{ color: '#64748b', fontSize: 13 }}>Filter products first, then choose items from the list.</p>

              <label style={{ marginTop: 12, display: 'block', fontWeight: 500 }}>Filter Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as FilterType)} style={{ marginTop: 6 }}>
                <option value="all">All Products</option>
                <option value="event">By Event</option>
                <option value="category">By Category</option>
              </select>

              {filterType === 'event' && events.length > 0 && (
                <>
                  <label style={{ marginTop: 12, display: 'block' }}>Select Event</label>
                  <select value={selectedEventId || ''} onChange={(e) => setSelectedEventId(Number(e.target.value))}>
                    {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                  </select>
                </>
              )}

              {filterType === 'category' && (
                <>
                  <label style={{ marginTop: 12, display: 'block' }}>Select Category</label>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </>
              )}

              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Search Product</label>
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <label style={{ fontWeight: 500 }}> {filteredAndSearchedProducts.length > 0 && (
                  <label className="flex items-center gap-2 mt-3 mb-2 cursor-pointer" style={{ fontWeight: 500 }}>
                    <input type="checkbox" checked={allFilteredAndSearchedSelected} onChange={handleToggleSelectAll} />
                    Select All ({filteredAndSearchedProducts.length})
                  </label>
                )}</label>
                  <span style={{ color: '#64748b', fontSize: 12 }}>
                    {selectedFilteredCount} of {filteredAndSearchedProducts.length} selected
                  </span>
                </div>

               

                <div className="max-h-72 overflow-auto rounded-xl border bg-slate-50 p-3 mt-2">
                  {filterLoading ? (
                    <p style={{ color: '#64748b' }}>Loading products...</p>
                  ) : filteredAndSearchedProducts.length === 0 ? (
                    <p style={{ color: '#64748b' }}>
                      {searchTerm ? 'No matching products found.' : 'No products found for this filter.'}
                    </p>
                  ) : (
                    filteredAndSearchedProducts.map((product) => (
                      <label key={product.id} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-white">
                        <input
                          type="checkbox"
                          checked={selectedIdSet.has(product.id)}
                          onChange={() => handleProductSelection(product.id)}
                        />
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <strong style={{ fontSize: 14 }}>{product.name}</strong>
                          <small style={{ color: '#64748b' }}>
                            {getCategoryName(product) || 'Uncategorized'} • {product.sku || 'No SKU'}
                          </small>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || filterLoading || selectedProductIds.length === 0}
                className="primary"
                style={{ width: '100%', marginTop: 24 }}
              >
                Generate QR Tags
              </button>
            </section>
          )}

          {/* QR Logo & Tag Content Panels */}
          {tabgenshow && (
            <>
              <section className="panel">
                <h2>QR Logo</h2>
                <div className="logo-tools">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                  {logo && <button type="button" className="primary" onClick={() => setLogo(null)}>Remove Logo</button>}
                </div>
              </section>

              <section className="panel">
                <h2>Tag Content</h2>
                <div className="field-grid">
                  <SwitchRow label="Product Name" checked={config.showName} onChange={() => toggleField('showName')} />
                  <SwitchRow label="Price" checked={config.showPrice} onChange={() => toggleField('showPrice')} />
                  <SwitchRow label="Description" checked={config.showDescription} onChange={() => toggleField('showDescription')} />
                  <SwitchRow label="SKU / Code" checked={config.showSku} onChange={() => toggleField('showSku')} />
                  <SwitchRow label="QR Code" checked={config.showQr} onChange={() => toggleField('showQr')} />
                  <SwitchRow label="Logo in QR" checked={config.showLogo} onChange={() => toggleField('showLogo')} />
                </div>
              </section>
            </>
          )}
        </aside>

        <section className="workspace">
          {tabshow && (
            <div className="preview-panel panel">
              <div className="preview-stage">
                <ProductTag exportRef={exportRef} product={previewProduct} template={selectedTemplate} config={config} logo={logo} />
              </div>

              {/* Preview Tools - Alignment, Style, Continue Button */}
              <div className="preview-tools">
                <section className="panel">
                  <h2>Alignment</h2>
                  <div className="align-row">
                    {(['left', 'center', 'right'] as Align[]).map((align) => (
                      <button key={align} type="button" className={`align-button ${config.align === align ? 'active' : ''}`} 
                        onClick={() => setConfig((c) => ({ ...c, align }))}>
                        {align}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <h2>Style</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(['tagBackground', 'borderColor', 'textColor', 'accentColor', 'qrPanelBackground'] as const).map((key) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                        <input type="color" value={config[key]} onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value }))} />
                      </label>
                    ))}
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Border Radius <strong>{config.borderRadius}px</strong>
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={config.borderRadius}
                        onChange={(e) => setConfig((c) => ({ ...c, borderRadius: Number(e.target.value) }))}
                      />
                    </label>
                  </div>
                </section>

                <button
                  type="button"
                  className="primary amber"
                  onClick={() => { setgenTabshow(true); setTabshow(false); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                  Continue to Generate Tags
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {tabgenshow && (
            <section className="panel">
              <div className="generated-toolbar">
                <h2>Generated Tags ({generated.length})</h2>
                <div className="generated-actions">
                  <div className="print-layout-summary">
                    A4 {selectedTemplate.orientation}: {activePrintLayout.columns} per row, {activePrintLayout.columns * activePrintLayout.rows} per page
                  </div>
                  <div className="button-row">
                    <button type="button" className="tool-button primary-tool" onClick={() => { setTabshow(true); setgenTabshow(false); }}>Back</button>
                    {hasPermission("qrcode", "create") && (
                    <button type="button" className="tool-button primary-tool" onClick={() => setShowPrint(true)} disabled={!generated.length}>Export PDF</button>
                    )}
                  </div>
                </div>
              </div>

              {generated.length === 0 ? (
                 <div className="empty-generated-state">
                 <div className="empty-preview-stack" aria-hidden="true">
                   <div className="empty-tag-card empty-tag-card-main">
                     <div className="empty-tag-copy">
                       <span className="empty-line title" />
                       <span className="empty-line medium" />
                       <span className="empty-line short" />
                       <span className="empty-price-pill" />
                     </div>

                     <div className="empty-qr-preview">
                       <span />
                       <span />
                       <span />
                       <span />
                       <span />
                       <span />
                       <span />
                       <span />
                       <span />
                     </div>
                   </div>

                   <div className="empty-tag-card empty-tag-card-back" />
                   <div className="empty-tag-card empty-tag-card-back second" />
                 </div>

                 <div className="empty-generated-copy">
                   <span className="empty-kicker">Ready for QR tag generation</span>
                   <h3>Your generated product tags will appear here</h3>
                   <p>
                     Choose products from the left panel and click <strong>Generate QR Tags</strong>.
                     You can then review the layout, adjust tags per row, and export a clean PDF.
                   </p>
                 </div>
               </div>
              ) : (
                <div className={`generated-grid ${selectedTemplate.orientation}`} style={generatedGridStyle}>
                  {generated.map((product) => (
                    <div key={product.id} className="generated-tag-cell">
                      <ProductTag product={product} template={selectedTemplate} config={config} logo={logo} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </section>
      </main>
    </div>
  );
}