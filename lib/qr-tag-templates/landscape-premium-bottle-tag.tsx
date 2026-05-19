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

function LandscapePremiumBottleTag({
  product,
  template,
  config,
  logo,
  printMode = false,
  exportRef,
}: TemplateRenderProps) {
  const productImage = getProductImage(product);
  const qrValue = buildQrValue(product, template.id);

  const tagWidth = printMode ? '100%' : 520;
  const tagHeight = printMode ? 190 : 230;
  const qrSize = printMode ? 104 : 118;
  const imageSize = printMode ? 122 : 150;

  const bgColor = config.tagBackground;
  const textColor = config.textColor;
  const borderColor = config.borderColor;
  const accentColor = config.accentColor;
  const qrPanelBackground = config.qrPanelBackground;
  const align = config.align;

  const centerWhenNeeded = align === 'center';
  const leftWhenNeeded = align === 'left';

  return (
    <div
      ref={exportRef}
      style={{
        width: tagWidth,
        minHeight: tagHeight,
        background: bgColor,
        color: textColor,
        border: `3px solid ${borderColor}`,
        boxShadow: printMode ? 'none' : '0 20px 50px rgba(15, 23, 42, 0.22)',
        position: 'relative',
        overflow: 'hidden',
        padding: printMode ? '16px 18px' : '20px 22px',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        backgroundImage:
          'linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '7px 100%, 100% 9px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: printMode ? '132px 1fr 128px' : '160px 1fr 142px',
          gap: printMode ? 14 : 18,
          alignItems: 'center',
          minHeight: printMode ? 158 : 188,
        }}
      >
        <div
          style={{
            width: imageSize,
            height: imageSize,
            border: `2px solid ${accentColor}`,
            background: qrPanelBackground,
            overflow: 'hidden',
            justifySelf:
              centerWhenNeeded
                ? 'center'
                : leftWhenNeeded
                  ? 'start'
                  : 'end',
          }}
        >
          {productImage ? (
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
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                color: textColor,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              No image
            </div>
          )}
        </div>

        <div
          style={{
            minWidth: 0,
            textAlign: align,
            borderLeft: `1px solid ${accentColor}`,
            borderRight: `1px solid ${accentColor}`,
            padding: printMode ? '0 12px' : '0 16px',
          }}
        >
          {config.showName && (
            <div
              style={{
                color: textColor,
                fontSize: printMode ? 20 : 24,
                lineHeight: 1.08,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {product.name}
            </div>
          )}

          {config.showDescription && (
            <div
              style={{
                marginTop: config.showName ? 10 : 0,
                color: textColor,
                fontSize: printMode ? 13 : 15,
                lineHeight: 1.15,
                fontWeight: 800,
                textTransform: 'uppercase',
                opacity: 0.92,
              }}
            >
              {product.description}
            </div>
          )}

          <div
            style={{
              width: '100%',
              height: 1,
              margin: '12px 0',
              background: accentColor,
              opacity: 0.65,
            }}
          />

          <div
            style={{
              color: textColor,
              fontSize: printMode ? 12 : 14,
              lineHeight: 1.28,
              fontWeight: 500,
            }}
          >
            {config.showSku && <div>Model: {product.sku}</div>}
            {config.showPrice && <div>Price: ₹{product.price.toLocaleString('en-IN')}</div>}
            <div>Stock: {product.stock}</div>
            <div>Keeps Cold 24 hrs</div>
            <div>Hot 12 hrs</div>
            <div>100% BPA Free & Eco-Friendly</div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            justifyItems:
              centerWhenNeeded
                ? 'center'
                : leftWhenNeeded
                  ? 'start'
                  : 'end',
            alignContent: 'center',
            gap: 10,
          }}
        >
          {config.showQr && (
            <div style={{ padding: 7, background: qrPanelBackground }}>
              <QRWithLogo value={qrValue} logo={logo} showLogo={config.showLogo} size={qrSize} />
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr',
              alignItems: 'center',
              gap: 7,
              width: 132,
            }}
          >
            <div
              style={{
                width: 24,
                height: 34,
                border: `1px solid ${accentColor}`,
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                color: accentColor,
                fontSize: 7,
                lineHeight: 1,
              }}
            >
              QR
            </div>

            <div
              style={{
                color: textColor,
                fontSize: printMode ? 9 : 10,
                lineHeight: 1.1,
                textAlign: 'left',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              Scan to explore
              <br />
              product details
              <br />
              & reviews
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const landscapePremiumBottleTagTemplate: TemplateDef = {
  id: 'landscape-premium-bottle-tag',
  name: 'Premium Bottle Tag',
  description: 'Landscape premium bottle tag with product image, details, and QR code.',
  orientation: 'landscape',
  structure: 'image-details-qr',
  previewImage: '/landscape-premium-bottle-tag.png',
  Component: LandscapePremiumBottleTag,
};
