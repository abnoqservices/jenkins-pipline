import { defaultEngagePuckData } from "@/lib/puck/engage-puck-config";
import { DEFAULT_LAYOUT_PROPS } from "@/lib/puck/layout-fields";
import { migratePuckDocument } from "@/lib/puck/migrate-puck-document";

/** Initial Puck document for a new “blog post layout” site page (nav/footer added in the editor). */
export function createBlogShellStarterDocument(): Record<string, unknown> {
  const base = defaultEngagePuckData() as Record<string, unknown>;
  const id = `blog-slot-${Date.now()}`;
  return migratePuckDocument({
    ...base,
    content: [
      {
        type: "CmsBlogPostSlotBlock",
        props: {
          content: {},
          layout: { ...DEFAULT_LAYOUT_PROPS },
        },
        id,
      },
    ],
  }) as Record<string, unknown>;
}
