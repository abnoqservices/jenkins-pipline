// store/pageStore.ts
import { create } from "zustand";

export const usePageStore = create((set) => ({
  templateId: null,
  userId: null,

  setTemplate: (tid, uid) =>
    set({
      templateId: tid,
      userId: uid
    }),
}));
