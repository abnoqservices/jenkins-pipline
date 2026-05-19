import { QRCodeSVG } from 'qrcode.react';
import type { Orientation, Product, TagConfig, TemplateDef, TemplateRenderProps } from '@/lib/qr-tag-templates/types';
import { portraitPremiumBottleTagTemplate } from './portrait-premium-bottle-tag';
import { potraitProdetailQrImageTemplate } from './potrait-pro-detail-qr-image';

function buildQrValue(product: Product, templateId: string) {
 
  const orgSlug = product?.organization?.slug || "default-org";
  const urlSlug = product?.url_slug || "item";

  return `https://pexifly.com/${orgSlug}/${urlSlug}`;
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
      style={{ position: 'relative', width: size, height: size, borderRadius: 16, background: '#fff' }}
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
            borderRadius: 10,
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

function DetailBlock({
  product,
  config,
  compact = false,
  printMode = false,
}: {
  product: Product;
  config: TagConfig;
  compact?: boolean;
  printMode?: boolean;
}) {
  const titleSize = printMode ? (compact ? 13 : 15) : compact ? 16 : 20;
  const skuSize = printMode ? 9 : 11;
  const priceSize = printMode ? (compact ? 16 : 20) : compact ? 18 : 22;
  const descriptionSize = printMode ? 10 : 12;

  return (
    <div style={{ textAlign: config.align, minWidth: 0 }}>
      <span
        style={{
          fontSize: printMode ? 8 : 9,
          padding: printMode ? '3px 8px' : '4px 9px',
          borderRadius: 999,
          background: `${config.accentColor}22`,
          color: config.accentColor,
          fontWeight: 800,
        }}
      >
        Scan Now
      </span>

      {config.showName && (
        <div
          style={{
            marginTop: printMode ? 8 : 10,
            fontSize: titleSize,
            fontWeight: 850,
            color: config.textColor,
            lineHeight: 1.2,
            overflow: 'hidden',
            maxHeight: printMode ? (compact ? 32 : 36) : undefined,
          }}
        >
          {product.name}
        </div>
      )}
      {config.showSku && (
        <div
          style={{
            fontSize: skuSize,
            fontFamily: 'ui-monospace, monospace',
            color: config.textColor,
            opacity: 0.75,
          }}
        >
          SKU: {product.sku}
        </div>
      )}
      {config.showPrice && (
        <div
          style={{
            marginTop: printMode ? 6 : 8,
            fontSize: priceSize,
            fontWeight: 900,
            color: config.accentColor,
          }}
        >
          ₹{product.price.toLocaleString('en-IN')}
        </div>
      )}
      {config.showDescription && (
        <div
          style={{
            marginTop: printMode ? 6 : 8,
            fontSize: descriptionSize,
            color: config.textColor,
            lineHeight: 1.4,
            opacity: 0.85,
            overflow: 'hidden',
            maxHeight: printMode ? 42 : undefined,
            wordBreak: 'break-word',
          }}
        >
          {product.description}
        </div>
      )}
    </div>
  );
}

function StandardTemplate({ product, template, config, logo, printMode, exportRef }: TemplateRenderProps) {
  const isLandscape = template.orientation === 'landscape';
  const qrSize = printMode ? (isLandscape ? 92 : 110) : isLandscape ? 136 : 152;
  const detailsPadding = printMode ? (isLandscape ? 12 : 16) : 24;
  const qrPanelPadding = printMode ? (isLandscape ? 10 : 14) : 18;

  const tagStyle = {
    width: printMode ? '100%' : isLandscape ? 440 : 312,
    height: printMode ? '100%' : undefined,
    minHeight: printMode ? undefined : isLandscape ? 220 : 430,
    background: config.tagBackground,
    border: `2px solid ${config.borderColor}`,
    borderRadius: config.borderRadius,
    boxShadow: printMode ? 'none' : '0 18px 50px rgba(15, 23, 42, 0.12)',
    overflow: 'hidden',
    boxSizing: 'border-box' as const,
  };

  const qrPanel = (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minWidth: isLandscape ? (printMode ? 112 : 168) : undefined,
        minHeight: isLandscape ? (printMode ? 112 : 168) : printMode ? 138 : 188,
        padding: qrPanelPadding,
        background: config.qrPanelBackground,
      }}
    >
      {config.showQr ? (
        <QRWithLogo value={buildQrValue(product, template.id)} logo={logo} showLogo={config.showLogo} size={qrSize} />
      ) : (
        <div className="hidden-qr">QR hidden</div>
      )}
    </div>
  );

  const details = (
    <div
      style={{
        flex: 1,
        padding: detailsPadding,
        minWidth: 0,
      }}
    >
      <DetailBlock product={product} config={config} compact={!isLandscape} printMode={printMode} />
    </div>
  );

  if (template.structure === 'details-qr-details') {
    return (
      <div ref={exportRef} data-tag-root="true" style={{ ...tagStyle, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: printMode ? '14px 14px 6px' : '24px 24px 8px' }}>
          <DetailBlock
            product={product}
            config={{ ...config, showPrice: false, showDescription: false }}
            compact
            printMode={printMode}
          />
        </div>
        {qrPanel}
        <div style={{ padding: printMode ? '8px 14px 14px' : '16px 24px 24px', textAlign: config.align }}>
          {config.showPrice && (
            <div
              style={{
                fontSize: printMode ? 22 : 32,
                fontWeight: 900,
                color: config.accentColor,
              }}
            >
              ₹{product.price.toLocaleString('en-IN')}
            </div>
          )}
          {config.showDescription && (
            <div
              style={{
                marginTop: 8,
                color: config.textColor,
                lineHeight: 1.4,
                fontSize: printMode ? 10 : 12,
                overflow: 'hidden',
                maxHeight: printMode ? 42 : undefined,
                wordBreak: 'break-word',
              }}
            >
              {product.description}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={exportRef}
      data-tag-root="true"
      style={{
        ...tagStyle,
        display: 'flex',
        flexDirection: isLandscape ? 'row' : 'column',
        gap: isLandscape ? (printMode ? 6 : 10) : 0,
      }}
    >
      {template.structure === 'qr-details' ? qrPanel : details}
      {template.structure === 'qr-details' ? details : qrPanel}
    </div>
  );
}

export const TEMPLATE_LIBRARY: Record<Orientation, TemplateDef[]> = {
  landscape: [
    {
      id: 'landscape-details-qr',
      name: 'Details | QR Code',
      description: 'Product information on the left and QR code on the right.',
      orientation: 'landscape',
      structure: 'details-qr',
      previewImage: '/11.png',
      Component: StandardTemplate,
    },
    {
      id: 'landscape-qr-details',
      name: 'QR Code | Details',
      description: 'QR code on the left and product information on the right.',
      orientation: 'landscape',
      structure: 'qr-details',
      previewImage: '/1.png',
      Component: StandardTemplate,
    },
  ],
  portrait: [
    {
      id: 'portrait-details-qr',
      name: 'Details / QR Code',
      description: 'Product details at the top and QR code at the bottom.',
      orientation: 'portrait',
      structure: 'details-qr',
      previewImage: '/2.png',
      Component: StandardTemplate,
    },
    {
      id: 'portrait-qr-details',
      name: 'QR Code / Details',
      description: 'QR code at the top and product details at the bottom.',
      orientation: 'portrait',
      structure: 'qr-details',
      previewImage: '/22.png',
      Component: StandardTemplate,
    },
    {
      id: 'portrait-split',
      name: 'Details / QR / Details',
      description: 'Primary details, QR code, then secondary details.',
      orientation: 'portrait',
      structure: 'details-qr-details',
      previewImage: '/222.png',
      Component: StandardTemplate,
    },
    potraitProdetailQrImageTemplate,
    portraitPremiumBottleTagTemplate,
  ],
};
