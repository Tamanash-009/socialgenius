import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProfileAnalysis, PostIdea } from '../services/geminiService';

interface AppStore {
  profile: ProfileAnalysis | null;
  profileUrl: string;
  ideas: PostIdea[];
  drafts: Record<string, string>; // Maps idea.id to modified content
  history: any[];
  scheduledPosts: any[];
  hideScrollbars: boolean;
  selectedIdea: PostIdea | null;
  analytics: any;
  accounts: { linkedin: boolean; x: boolean };
  setProfileUrl: (url: string) => void;
  setProfile: (profile: ProfileAnalysis | null) => void;
  setIdeas: (ideas: PostIdea[]) => void;
  updateDraft: (id: string, content: string) => void;
  addHistory: (post: any) => void;
  setScheduledPosts: (posts: any[]) => void;
  setHideScrollbars: (hide: boolean) => void;
  setSelectedIdea: (idea: PostIdea | null) => void;
  setAnalytics: (data: any) => void;
  setAccounts: (accs: { linkedin: boolean; x: boolean }) => void;
  clearAll: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      profile: null,
      profileUrl: '',
      ideas: [],
      drafts: {},
      history: [],
      scheduledPosts: [],
      hideScrollbars: true,
      selectedIdea: null,
      analytics: null,
      accounts: { linkedin: false, x: false },
      setProfileUrl: (profileUrl) => set({ profileUrl }),
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
      setSelectedIdea: (selectedIdea) => set({ selectedIdea }),
      setAnalytics: (analytics) => set({ analytics }),
      setAccounts: (accounts) => set({ accounts }),
      clearAll: () => set({ profile: null, profileUrl: '', ideas: [], drafts: {}, history: [], scheduledPosts: [], hideScrollbars: true, selectedIdea: null, analytics: null, accounts: { linkedin: false, x: false } }),
    }),
    {
      name: 'social-genius-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
