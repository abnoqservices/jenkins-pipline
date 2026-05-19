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

function PortraitPremiumBottleTag({
    product,
    template,
    config,
    logo,
    printMode = false,
    exportRef,
  }: TemplateRenderProps) {
    const productImage = getProductImage(product);
    const qrValue = buildQrValue(product, template.id);
  
    const tagWidth = printMode ? '100%' : 292;
    const qrSize = printMode ? 112 : 124;
    const imageSize = printMode ? 164 : 178;
  
    const bgColor = config.tagBackground;
    const textColor = config.textColor;
    const borderColor = config.borderColor;
    const accentColor = config.accentColor;
    const qrPanelBackground = config.qrPanelBackground;
    const align = config.align;
  
    const centerWhenNeeded = align === 'center';
    const leftWhenNeeded = align === 'left';
    const rightWhenNeeded = align === 'right';
  
    return (
      <div
        ref={exportRef}
        style={{
          width: tagWidth,
          minHeight: printMode ? undefined : 560,
          background: bgColor,
          color: textColor,
          borderLeft: `6px solid ${borderColor}`,
          borderRight: `6px solid ${borderColor}`,
          borderTop: `1px solid ${borderColor}`,
          borderBottom: `1px solid ${borderColor}`,
          boxShadow: printMode ? 'none' : '0 22px 55px rgba(15, 23, 42, 0.25)',
          position: 'relative',
          overflow: 'visible',
          padding: printMode ? '34px 22px 22px' : '42px 24px 24px',
          textAlign: align,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '7px 100%, 100% 9px',
        }}
      >
       
  
        {config.showName && (
          <div
            style={{
              marginTop: 28,
              color: textColor,
              fontSize: printMode ? 22 : 25,
              lineHeight: 1.1,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              textAlign: align,
            }}
          >
            {product.name}
          </div>
        )}
  
        <div
          style={{
            width: imageSize,
            height: imageSize,
            margin:
              centerWhenNeeded
                ? '18px auto 14px'
                : leftWhenNeeded
                  ? '18px auto 14px 0'
                  : '18px 0 14px auto',
            border: `2px solid ${accentColor}`,
            background: qrPanelBackground,
            overflow: 'hidden',
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
  
        {config.showDescription && (
          <div
            style={{
              maxWidth: 220,
              margin:
                centerWhenNeeded
                  ? '0 auto 12px'
                  : leftWhenNeeded
                    ? '0 auto 12px 0'
                    : '0 0 12px auto',
              color: textColor,
              fontSize: printMode ? 15 : 17,
              lineHeight: 1.12,
              fontWeight: 900,
              textTransform: 'uppercase',
              textAlign: align,
            }}
          >
            {product.description}
          </div>
        )}
  
        <div
          style={{
            width: '82%',
            height: 1,
            margin:
              centerWhenNeeded
                ? '12px auto'
                : leftWhenNeeded
                  ? '12px auto 12px 0'
                  : '12px 0 12px auto',
            background: accentColor,
            opacity: 0.65,
          }}
        />
  
        {config.showQr && (
          <div
            style={{
              display: 'grid',
              placeItems:
                centerWhenNeeded
                  ? 'center'
                  : leftWhenNeeded
                    ? 'center start'
                    : 'center end',
              marginBottom: 10,
            }}
          >
            <div style={{ padding: 8, background: qrPanelBackground }}>
              <QRWithLogo value={qrValue} logo={logo} showLogo={config.showLogo} size={qrSize} />
            </div>
          </div>
        )}
  
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr',
            alignItems: 'center',
            gap: 8,
            maxWidth: 210,
            margin:
              centerWhenNeeded
                ? '0 auto 12px'
                : leftWhenNeeded
                  ? '0 auto 12px 0'
                  : '0 0 12px auto',
          }}
        >
          <div
            style={{
              width: 28,
              height: 40,
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
              fontSize: 12,
              lineHeight: 1.12,
              textAlign: 'left',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Scan to explore
            <br />
            product details, reviews
            <br />
            & recycling info
          </div>
        </div>
  
        <div
          style={{
            width: '82%',
            height: 1,
            margin:
              centerWhenNeeded
                ? '12px auto'
                : leftWhenNeeded
                  ? '12px auto 12px 0'
                  : '12px 0 12px auto',
            background: accentColor,
            opacity: 0.65,
          }}
        />
  
        <div
          style={{
            color: textColor,
            fontSize: printMode ? 13 : 15,
            lineHeight: 1.28,
            fontWeight: 500,
            textAlign: align,
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
    );
  }
  

export const portraitPremiumBottleTagTemplate: TemplateDef = {
  id: 'portrait-premium-bottle-tag',
  name: 'Premium Bottle Tag',
  description: 'Black hanging bottle tag with product image, QR code, and premium gold details.',
  orientation: 'portrait',
  structure: 'image-details-qr',
  previewImage: '/2222.png',
  Component: PortraitPremiumBottleTag,
};
