# Fix: Load All MLB Players for Drafts

## 1. Backend - New endpoint for all draftable players
- [ ] Add `/api/stats/players/all` endpoint that fetches all MLB players with stats
- [ ] Combine /sports/1/players (1470 players) with season hitting/pitching stats
- [ ] Return full player list with projected points, position, team, stats
- [ ] Cache results in memory to avoid hammering MLB API

## 2. Mock Draft - Use new endpoint
- [ ] Update MockDraft.tsx loadPlayers() to use new endpoint
- [ ] Remove old leaders-based approach
- [ ] Show all players (not just 150)

## 3. Real Draft - Use new endpoint  
- [ ] Update DraftRoom.tsx to load all players from new endpoint
- [ ] Remove 200-player limit
- [ ] Fallback to DB if stats endpoint fails

## 4. Verify & Push
- [ ] TypeScript compiles (frontend + backend)
- [ ] Full build passes
- [ ] Commit and push to GitHub