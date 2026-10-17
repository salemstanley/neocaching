# Neocaching

Turn a park into a game board. Tap your phone on hidden NFC tags, catch the star that appears through your camera, beat a quick mini-game, and race the clock to the final boss.

## Install it on your Pixel

1. On your phone, sign in to github.com and open the **Releases** page of this project (`github.com/salemstanley/neocaching/releases`).
2. Under **Latest Neocaching build**, tap `neocaching.apk`.
3. Open the download. If Android asks, allow your browser to install apps.
4. A new version is built every time the code changes. Install it the same way to update.

## Set up a loop

You need 6 NTAG215 tags: 5 checkpoints and 1 final boss.

1. Open the app and tap **Set up tags and spots**.
2. For each checkpoint, tap **Write tag** and hold a blank tag to the back of your phone, near the camera.
3. Stick the tag in its spot. Stand right next to it and tap **Save spot**.
4. Testing at home? Turn on **Skip the GPS check** so tags work anywhere.

## How a game works

- Tap **Start game**. The clock starts.
- Find the tags in order: Start, then 1 to 4. After each challenge you get a clue to the next tag. If you're stuck, **Use the compass** shows how far away it is and which way to go.
- Tap **Tap a checkpoint tag** and hold your phone to the tag.
- If you're close enough (about 30 meters), a star appears through your camera. Tap it to catch it.
- Read the next part of the story and beat the mini-game. Losing adds 30 seconds to your time.
- Tag 5 is the final boss. Beat it to finish and save your time.

## Games

- **Red Rock Pioneers**: survive your first year in 1860s St. George.

More themes reuse the same 6 tags. Each one is a single file in `src/game/`.

## Not built yet

- High scores are saved on the phone only. A shared online leaderboard comes next.
- The star floats in front of the camera rather than being anchored to the spot.
- iPhone version.
