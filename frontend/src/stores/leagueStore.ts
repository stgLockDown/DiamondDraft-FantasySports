import { create } from 'zustand';

interface LeagueState {
  currentLeague: any | null;
  myLeagues: any[];
  setCurrentLeague: (league: any) => void;
  setMyLeagues: (leagues: any[]) => void;
}

export const useLeagueStore = create<LeagueState>((set) => ({
  currentLeague: null,
  myLeagues: [],
  setCurrentLeague: (league) => set({ currentLeague: league }),
  setMyLeagues: (leagues) => set({ myLeagues: leagues }),
}));