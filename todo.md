# DiamondDraft - Draft Position Slots & League Roster Settings

## 1. League Creation - Roster Config Settings
- [ ] Add roster slot configuration UI to LeagueCreate.tsx
- [ ] Allow setting count for each position (C, 1B, 2B, 3B, SS, OF, UTIL, SP, RP, BN, IL)
- [ ] Send rosterConfig to backend when creating league

## 2. League Settings - Edit Roster Config
- [ ] Add roster configuration editor in LeagueDetail.tsx settings tab
- [ ] Allow commissioner to adjust position counts

## 3. Mock Draft - Position-Based Roster
- [ ] Rewrite "Your Roster" panel to show position slots instead of flat list
- [ ] Show required slots: C, 1B, 2B, 3B, SS, OF(x3), UTIL, SP(x5), RP(x3), BN(x5)
- [ ] When user drafts a player, auto-assign to correct slot
- [ ] Show empty slots that still need to be filled
- [ ] Update AI drafting to be slot-aware (fill required positions)
- [ ] Update draft complete screen to show slot-based rosters
- [ ] Calculate numRounds from total roster slots

## 4. Real Draft (DraftRoom) - Position-Based Roster
- [ ] Update DraftRoom roster panel to show position slots
- [ ] Auto-assign drafted players to correct slots

## 5. Build & Push
- [ ] Verify TypeScript compiles
- [ ] Full build test
- [ ] Commit and push to GitHub