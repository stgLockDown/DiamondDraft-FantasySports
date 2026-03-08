# DiamondDraft - League Joining & Roster Slots

## League Joining Fixes
- [x] Rewrite Leagues.tsx with join buttons on public league cards
- [x] Add join modal with team name + invite code for private leagues
- [x] Fix handleJoinByCode to actually find and join leagues
- [x] Verify Leagues.tsx compiles
- [ ] Add backend endpoint to find league by invite code (for private league join-by-code)
- [ ] Add join button to LeagueDetail.tsx for non-members
- [ ] Add isMember detection in LeagueDetail.tsx

## Roster Slot Fixes
- [ ] Update roster tab in LeagueDetail.tsx to show required position slots from rosterConfig
- [ ] Show empty slots that need to be filled (C, 1B, 2B, 3B, SS, OF, UTIL, SP, RP, BN, IL)
- [ ] Display which slots are filled vs empty

## Build & Push
- [ ] Full build test (frontend + backend)
- [ ] Commit and push to GitHub