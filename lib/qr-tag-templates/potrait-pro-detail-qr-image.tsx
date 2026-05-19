'use client';

import { QRCodeSVG } from 'qrcode.react';
import type { Product, TemplateDef, TemplateRenderProps } from '@/lib/qr-tag-templates/types';

function buildQrValue(product: Product, templateId: string) {
  const orgSlug = product?.organization?.slug || "default-org";
  const urlSlug = product?.url_slug || "item";

  return `https://pexifly.com/${orgSlug}/${urlSlug}`;
}

function getProductImage(product: Product) {
  if (product.image_url) return product.image_url;
  if (product.image) return product.image;
  if (product.thumbnail) return product.thumbnail;

  const firstImage = product.images?.[0];
  if (typeof firstImage === 'string') return firstImage;
  if (firstImage?.url) return firstImage.url;
  if (firstImage?.image) return firstImage.image;

  return null;
}

function QRWithLogo({
  value,
  logo,
  showLogo,
  size,
}: {
  value: string;
  logo: string | null;
  showLogo: boolean;
  size: number;
}) {
  return (
    <div
      className="qr-shell"
      style={{
        position: 'relative',
        width: size,
        height: size,
        background: '#fff',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <QRCodeSVG value={value} size={size} level="H" includeMargin />

      {showLogo && logo && (
        <img
          src={logo}
          alt=""
          style={{
            position: 'absolute',
            inset: '50% auto auto 50%',
            width: Math.round(size * 0.22),
            height: Math.round(size * 0.22),
            transform: 'translate(-50%, -50%)',
            borderRadius: 8,
            objectFit: 'contain',
            background: '#fff',
            padding: 4,
            boxShadow: '0 0 0 4px #fff',
          }}
        />
      )}
    </div>
  );
}

// Naya A4 optimized template (3 in row × 6 per page)
function PortraitProDetailQrImage({
  product,
  template,
  config,
  logo,
  printMode = false,
  exportRef,
}: TemplateRenderProps) {
  const productImage = getProductImage(product);
  const qrValue = buildQrValue(product, template.id);

  // A4 ke liye optimized sizes (3 columns × 2 rows)
  const tagWidth = printMode ? 'calc(33.33% - 8px)' : 312; // ~97-100mm wide
  const qrSize = printMode ? 92 : 142; // chhota QR print ke liye

  const bgColor = config.tagBackground || '#ffffff';
  const textColor = config.textColor || '#111827';
  const borderColor = config.borderColor || '#111827';
  const accentColor = config.accentColor || '#3b82f6';
  const qrPanelBackground = config.qrPanelBackground || '#f6f7f9';

  const hasTopDetails = config.showName || config.showSku;

  return (
    <div
      ref={exportRef}
      style={{
        width: tagWidth,
        minHeight: printMode ? 305 : 430,           // scaled down
        background: bgColor,
        color: textColor,
        border: `2px solid ${borderColor}`,
        borderRadius: 16,
        boxShadow: printMode ? 'none' : '0 18px 45px rgba(15, 23, 42, 0.14)',
        overflow: 'hidden',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        margin: printMode ? '4px' : '0',            // slight gap between tags
        pageBreakInside: 'avoid',
      }}
    >
      {/* Top Details + Right Thumbnail */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: productImage ? '1fr auto' : '1fr',
          gap: 12,
          alignItems: 'center',
          padding: printMode ? '18px 18px 12px' : '28px 24px 18px',
        }}
      >
        <div style={{ minWidth: 0, textAlign: config.align }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3px 10px',
              borderRadius: 999,
              background: `${accentColor}14`,
              color: accentColor,
              fontSize: 10,
              lineHeight: 1,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            Scan Now
          </div>

          {config.showName && (
            <div
              style={{
                color: textColor,
                fontSize: printMode ? 15 : 18,
                lineHeight: 1.15,
                fontWeight: 900,
                marginBottom: config.showSku ? 5 : 0,
              }}
            >
              {product.name}
            </div>
          )}

          {config.showSku && (
            <div
              style={{
                color: textColor,
                opacity: 0.75,
                fontSize: 10,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              SKU: {product.sku}
            </div>
          )}
        </div>

        {productImage && (
          <div
            style={{
              width: hasTopDetails ? 'clamp(52px, 22vw, 72px)' : 'clamp(78px, 28vw, 105px)',
              aspectRatio: '1 / 1',
              borderRadius: 12,
              overflow: 'hidden',
              background: qrPanelBackground,
              border: `1px solid ${borderColor}22`,
              flexShrink: 0,
            }}
          >
            <img
              src={productImage}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        )}
      </div>

      {/* QR Panel */}
      {config.showQr && (
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            padding: printMode ? '18px 16px' : '28px 20px',
            background: qrPanelBackground,
          }}
        >
          <QRWithLogo
            value={qrValue}
            logo={logo}
            showLogo={config.showLogo}
            size={qrSize}
          />
        </div>
      )}

      {/* Bottom Details */}
      <div
        style={{
          padding: printMode ? '16px 18px 20px' : '24px 24px 28px',
          textAlign: config.align,
        }}
      >
        {config.showPrice && (
          <div
            style={{
              color: accentColor,
              fontSize: printMode ? 17 : 20,
              lineHeight: 1,
              fontWeight: 950,
              marginBottom: config.showDescription ? 12 : 0,
            }}
          >
            ₹{product.price.toLocaleString('en-IN')}
          </div>
        )}

        {config.showDescription && (
          <div
            style={{
              color: textColor,
              fontSize: 13,
              lineHeight: 1.45,
              opacity: 0.9,
            }}
          >
            {product.description}
          </div>
        )}
      </div>
    </div>
  );
}

export const potraitProdetailQrImageTemplate: TemplateDef = {
  id: 'portrait-pro-detail-image-qr-tag',
  name: 'A4 Pro Detail Tag (3×2)',
  description: 'A4 sheet optimized - 3 tags in a row, 6 tags per A4 page. Perfect for bottle/hanging tags.',
  orientation: 'portrait',
  structure: 'image-details-qr',
  previewImage: '/25.png', // aap isko update kar sakte ho
  Component: PortraitProDetailQrImage,
};