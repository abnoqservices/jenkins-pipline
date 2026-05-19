import { SAAS_LANDING_PICKABLE_TYPES, isSaasLandingPickableType } from "@/lib/puck/saas-landing-blocks";
import { PRODUCT_DETAIL_PICKABLE_TYPES, isProductDetailPickableType } from "@/lib/puck/product-detail-blocks";
import { getVariantsForBlock as getLandingVariants } from "@/lib/puck/saas-block-variants";
import { getVariantsForProductBlock } from "@/lib/puck/product-detail-variants";

/** All block types that open the design picker when inserted from the Puck sidebar. */
export const PUCK_VARIANT_PICKABLE_TYPES = [
  ...SAAS_LANDING_PICKABLE_TYPES,
  ...PRODUCT_DETAIL_PICKABLE_TYPES,
] as const;

export type PuckVariantPickableType = (typeof PUCK_VARIANT_PICKABLE_TYPES)[number];

export function isPuckVariantPickableType(t: string): t is PuckVariantPickableType {
  return isSaasLandingPickableType(t) || isProductDetailPickableType(t);
}

export function getPuckBlockVariants(type: string) {
  if (isSaasLandingPickableType(type)) {
    return getLandingVariants(type);
  }
  if (isProductDetailPickableType(type)) {
    return getVariantsForProductBlock(type);
  }
  return [];
}
