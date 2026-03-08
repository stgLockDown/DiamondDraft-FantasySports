# DiamondDraft - Draft Position Slots & League Roster Settings

## 1. League Creation - Roster Config Settings
- [x] Add roster slot configuration UI to LeagueCreate.tsx
- [x] Allow setting count for each position (C, 1B, 2B, 3B, SS, OF, UTIL, SP, RP, BN, IL)
- [x] Send rosterConfig to backend when creating league

## 2. League Settings - Edit Roster Config
- [x] Add roster configuration editor in LeagueDetail.tsx settings tab
- [x] Allow commissioner to adjust position counts

## 3. Mock Draft - Position-Based Roster
- [x] Rewrite "Your Roster" panel to show position slots instead of flat list
- [x] Show required slots: C, 1B, 2B, 3B, SS, OF(x3), UTIL, SP(x5), RP(x3), BN(x5)
- [x] When user drafts a player, auto-assign to correct slot
- [x] Show empty slots that still need to be filled
- [x] Update AI drafting to be slot-aware (fill required positions)
- [x] Update draft complete screen to show slot-based rosters
- [x] Calculate numRounds from total roster slots

## 4. Real Draft (DraftRoom) - Position-Based Roster
- [x] Update DraftRoom roster panel to show position slots
- [x] Auto-assign drafted players to correct slots

## 5. Build & Push
- [x] Verify TypeScript compiles
- [x] Full build test
- [x] Commit and push to GitHub