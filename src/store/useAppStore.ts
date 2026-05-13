import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CreatorProfile, PostIdea } from '../services/geminiService';

interface AppStore {
  profile: CreatorProfile | null;
  ideas: PostIdea[];
  drafts: Record<string, string>; // Maps idea.id to modified content
  history: any[];
  scheduledPosts: any[];
  hideScrollbars: boolean;
  setProfile: (profile: CreatorProfile | null) => void;
  setIdeas: (ideas: PostIdea[]) => void;
  updateDraft: (id: string, content: string) => void;
  addHistory: (post: any) => void;
  setScheduledPosts: (posts: any[]) => void;
  setHideScrollbars: (hide: boolean) => void;
  clearAll: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      profile: null,
      ideas: [],
      drafts: {},
      history: [],
      scheduledPosts: [],
      hideScrollbars: true,
      setProfile: (profile) => set({ profile }),
      setIdeas: (ideas) => set({ ideas }),
      updateDraft: (id, content) => set((state) => ({
        drafts: { ...state.drafts, [id]: content }
      })),
      addHistory: (post) => set((state) => ({ 
        history: [post, ...state.history].slice(0, 50) 
      })),
      setScheduledPosts: (scheduledPosts) => set({ scheduledPosts }),
      setHideScrollbars: (hideScrollbars) => set({ hideScrollbars }),
      clearAll: () => set({ profile: null, ideas: [], drafts: {}, history: [], scheduledPosts: [], hideScrollbars: true }),
    }),
    {
      name: 'social-genius-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
