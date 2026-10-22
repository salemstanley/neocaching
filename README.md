# Neocaching

Turn a park into a game board. Tap your phone on hidden NFC tags, catch the star that appears through your camera, beat a quick mini-game, and race the clock to the final boss.

## Install or update it on your Pixel

1. On your phone, open Chrome and go to `github.com/salemstanley/neocaching/releases/tag/latest`. Sign in to GitHub if it asks.
2. Tap `neocaching.apk` to download it.
3. When the download finishes, tap **Open**. If Android warns you, allow Chrome to install apps.
4. Tap **Update** (or **Install** the first time). Your saved tag spots and scores are kept.
5. A new version is built every time the code changes. Repeat these steps to update.

## Write your tags (once)

You need 6 NTAG215 tags: Start, 1, 2, 3, 4 and 5 (the final boss).

1. Tap **Write tags and settings**.
2. Tap each button and hold the matching blank tag to the back of your phone, near the camera.
3. The same 6 tags work with every course, so you can move them anywhere.

## Let Claude write a course

1. Get a Claude API key at console.anthropic.com (add a few dollars of credit). Paste it under **Write tags and settings**. It stays on your phone.
2. Tap **Course wizard**. Say who's playing, the occasion and a story idea.
3. For each tag, describe where it's hidden, tap **I'm here** (or **Pick on map**), add an optional activity, and choose a challenge or **Surprise me**.
4. Tap **Write my adventure**. Claude writes the story, clues and challenges, and the course opens in the editor so you can change anything.

Your answers are saved as you go, so you can fill it in while walking around hiding tags.

## Make a course yourself

1. Tap **Make a new course**. It starts with sample stops you can change.
2. Fill in the story, then tap each tag to open it. Pick a challenge: trivia, speed tap, memory match, or a **real-world activity** like "eat dinner here".
3. Write the clue that leads to the next tag.
4. Set where each tag is hidden: **Use where I'm standing**, or **Pick on map** to plan from home.
5. Turn off **Timed** for relaxed adventures like a date night.
6. Changes save automatically.

To play a built-in course in a new place, tap **Set up** on it and set new spots.

## Share a course

Open a course and tap **Share this course** to send it by text or email. On the other phone, tap **Import a course** and paste the whole message. The tag spots come along too.

## How a game works

- Tap **Start game**. The clock starts.
- Find the tags in order: Start, then 1 to 5. After each challenge you get a clue to the next tag.
- Tap **Tap a checkpoint tag** and hold your phone to the tag.
- If you're close enough (about 30 meters), a star appears through your camera. Tap it to catch it.
- Read the next part of the story and beat the mini-game. Losing adds 30 seconds to your time.
- Tag 5 is the final boss. Beat it to finish and save your score.

## Points

- **Coins** sit every 25 feet on the straight line between one tag and the next: +10 each, with a coin sound. Keep the app open while you walk.
- **Wrong-way coins** sit behind the tag you just left, pointing away from the next one: -10 each, with a warning buzz.
- **Each cache (tag) found:** +100.
- **Direction arrow:** points to the next cache. Turning it on halves the coins and cache points for that stretch. Mini-games are not affected.
- **Time bonus:** 1 point for every second you finish under the course's time limit (15 minutes for Red Rock Pioneers). Untimed courses have no bonus.
- **Map:** shows every cache and your blue dot, but never the coins.

Coins, the map and the arrow need each tag's spot set in the course.

## Games

- **Red Rock Pioneers**: survive your first year in 1860s St. George.

Courses made in the app live on the phone. Built-in courses are files in `src/game/`.

## Not built yet

- High scores are saved on the phone only. A shared online leaderboard comes next.
- Coins appear as a pop-up when you collect them, not floating in the camera view.
- Player avatars (the map uses a blue dot for now).
- The star floats in front of the camera rather than being anchored to the spot.
- iPhone version.
