import type { ComponentType, Ref } from 'react';

export type Orientation = 'landscape' | 'portrait';
export type ExportFormat = 'png' | 'jpg';
export type FieldKey = 'showName' | 'showPrice' | 'showDescription' | 'showSku' | 'showQr' | 'showLogo';
export type Align = 'left' | 'center' | 'right';

export type Product = {
  id: number;
  name: string;
  price: number;
  category?: { name: string } | string;
  sku: string;
  stock: number;
  description: string;
  image?: string;
  image_url?: string;
  thumbnail?: string;
  images?: Array<{ url?: string; image?: string } | string>;
};

export type TagConfig = {
  showName: boolean;
  showPrice: boolean;
  showDescription: boolean;
  showSku: boolean;
  showQr: boolean;
  showLogo: boolean;
  align: Align;
  tagBackground: string;
  textColor: string;
  borderColor: string;
  qrPanelBackground: string;
  accentColor: string;
  borderRadius: number;
};

export type TemplateStructure =
  | 'details-qr'
  | 'qr-details'
  | 'details-qr-details'
  | 'image-details-qr';

export type TemplateRenderProps = {
  product: Product;
  template: TemplateDef;
  config: TagConfig;
  logo: string | null;
  printMode?: boolean;
  exportRef?: Ref<HTMLDivElement>;
};

export type TemplateDef = {
  id: string;
  name: string;
  description: string;
  orientation: Orientation;
  structure: TemplateStructure;
  previewImage?: string;
  Component: ComponentType<TemplateRenderProps>;
};
