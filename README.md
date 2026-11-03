# Pradeep & Janhavi — Royal Mysore Heritage Wedding Invitation

A static, single-page wedding invitation website (Kannada + English) built with plain HTML, CSS and JavaScript. It has no backend and no build step, so it can be hosted directly on GitHub Pages.

```
royal-wedding-invitation/
├── index.html            # All content (Kannada + English)
├── css/style.css         # Theme, layout, animations, responsive rules
├── js/script.js          # Intro, envelope, music, countdown, gallery, reveals
├── assets/
│   ├── video/opening.mp4         ← ADD (optional)
│   ├── audio/opening-music.mp3   ← ADD (optional)
│   ├── audio/wedding-music.mp3   ← ADD (optional)
│   ├── images/couple-hero.jpg    ← ADD (real photo)
│   ├── images/couple-1.jpg       ← ADD (real photo)
│   ├── images/couple-2.jpg       ← ADD (real photo)
│   ├── images/palace.jpg         ← ADD (optional hero background)
│   ├── images/ganesha.png        ✓ reused from the original invitation (resized)
│   └── icons/                    ✓ favicon.svg, kalash.png (from original)
└── README.md
```

---

## 1. Wedding details — please verify

These details come from the original `wedding-responsive.html`:

| Item | Value used |
|---|---|
| Groom | Pradeep G.V. |
| Bride | Janhavi S. |
| Invited by | Gutluru Smt. Bhagyalakshmi & Sri G.K. Venkataramiah Setty, Gownipalli Village, Srinivaspura Taluk, Kolar District |
| Reception | Wednesday, 2 December 2026 (with dining) |
| Wedding Muhurtham | Thursday, 3 December 2026, 8:00 – 9:05 (Subha Lagna) |
| Venue | Advaith Convention Hall, G65H+7M3, Koratagere Bypass, Koratagere, Mudlapanne, Karnataka 572129 |
| Maps link | https://share.google/XG61pJBBd95V9QMBj |

### Conflicts and assumptions found in the original file

1. **Countdown time.** The original countdown targeted **09:30 IST**, which is after the stated muhurtham window (8:00–9:05). The new countdown targets the **muhurtham start, 08:00 IST**. To change it, edit `CONFIG.muhurtham` at the top of `js/script.js`.
2. **AM/PM.** The original says "8.00 to 9.05" with no AM/PM. The site shows **AM**, because the original 09:30 countdown suggests a morning ceremony. Please confirm this.
3. **Route note removed.** The original said the venue is "accessible via the Kolar – Srinivaspura Highway", but the venue address is in Koratagere, not on that highway. The note was left out. If it is correct, add it back in the venue card in `index.html`.
4. **Reception time and venue** were not in the original file. Both show as **"To be confirmed"**. To add them, search `index.html` for `class="tbc"`.
5. **Kannada spelling of the bride's name.** The site uses **ಜಾಹ್ನವಿ**, the usual Kannada spelling of "Janhavi/Jahnavi". The Kannada invitation text and labels are new. Please ask a native reader to proofread them.
6. Dates and weekdays were checked against the calendar: 2 Dec 2026 is a Wednesday and 3 Dec 2026 is a Thursday.

---

## 2. Adding your media

The site works without any of these files. If a file is missing, the site uses a fallback or shows a labelled placeholder.

| File | Recommended spec | If missing |
|---|---|---|
| `assets/images/couple-hero.jpg` | Landscape, 1600×900, JPEG quality ~75, < 350 KB | Gold "Photograph placeholder" card |
| `assets/images/couple-1.jpg`, `couple-2.jpg` | Portrait 3:4, 900×1200, < 250 KB each | Placeholder in arch frame |
| `assets/images/palace.jpg` | 1920×1080, dark/warm, < 300 KB | Illustrated SVG palace only |
| `assets/video/opening.mp4` | H.264, 1280×720 (or 720×1280), 10–12 s, **no audio track needed**, < 4 MB | Illustrated animated intro (palace, bells, particles) |
| `assets/audio/opening-music.mp3` | 128 kbps, loopable, < 2 MB | Built-in synthesized tanpura drone + temple bell |
| `assets/audio/wedding-music.mp3` | 128 kbps, loopable, < 5 MB | Built-in synthesized tanpura drone + temple bell |

The file names must match exactly. GitHub Pages is **case-sensitive**, so `Couple-1.JPG` will not work.

**Audio licensing:** only use music you own or that is clearly royalty-free (for example, tracks marked free for commercial use on Pixabay Music or the YouTube Audio Library). The original page hot-linked a Pixabay CDN URL. That link was removed because hot-linked URLs often break.

**Compressing photos on macOS:**
```bash
sips -Z 1600 -s formatOptions 75 original.jpg --out assets/images/couple-hero.jpg
sips -Z 1200 -s formatOptions 75 portrait1.jpg --out assets/images/couple-1.jpg
```
**Compressing a video** (requires ffmpeg):
```bash
ffmpeg -i input.mov -t 12 -vf "scale=1280:-2" -c:v libx264 -crf 28 -preset slow -an -movflags +faststart assets/video/opening.mp4
```

---

## 3. How it behaves

- **Intro (about 10 s):** palace gateway with a camera move, bells and golden particles (0–3 s). Then the Ganesha blessing "ಶ್ರೀ ಗಣೇಶಾಯ ನಮಃ" (3–6 s). Then the couple's names in a royal frame (6–10 s). After that, the **Open Wedding Invitation** button appears.
- **Skip Intro** (or the Esc key) jumps straight to the button.
- The **envelope** opens: the seal breaks, the flap opens, the card rises, and the site is revealed.
- **Audio never autoplays.** Music starts only after the visitor taps *Sound* or *Open Wedding Invitation*. A floating control offers Play/Pause and Mute/Unmute. Music pauses when the tab is hidden and resumes when the visitor returns.
- **The video** autoplays muted and inline. It is skipped when the visitor has turned on *reduced motion* or *data saver*.
- **Reduced motion:** the intro goes straight to the button, and petals, particles and parallax are turned off.
- **The countdown** uses an absolute IST time, so it is correct in every visitor's time zone.

---

## 4. Run locally

```bash
cd royal-wedding-invitation
python3 -m http.server 8000
# open http://localhost:8000
```
(Opening `index.html` directly with `file://` also works, but a local server matches GitHub Pages behaviour more closely.)

---

## 5. Deploy to GitHub Pages

### a) Create the repository and push
```bash
cd royal-wedding-invitation
git init
git add .
git commit -m "Royal Mysore heritage wedding invitation"
git branch -M main
# Create an empty public repo on github.com first (e.g. "pradeep-janhavi-wedding"), then:
git remote add origin https://github.com/<your-username>/pradeep-janhavi-wedding.git
git push -u origin main
```
Or, with the GitHub CLI:
```bash
gh repo create pradeep-janhavi-wedding --public --source=. --remote=origin --push
```

### b) Enable Pages
1. Open the repository on GitHub and go to **Settings → Pages**.
2. **Source:** *Deploy from a branch*.
3. **Branch:** `main`, folder `/ (root)`, then **Save**.
4. Wait 1–2 minutes. The site will be at
   `https://<your-username>.github.io/pradeep-janhavi-wedding/`

The `.nojekyll` file stops GitHub from running Jekyll, so the files are served exactly as they are. All asset paths are relative, so the site works under the `/repo-name/` sub-path.

### c) Verify the deployment
- [ ] The URL loads, the intro plays, and **Skip Intro** and **Open Wedding Invitation** both work.
- [ ] Music starts after the open tap, and pause/mute work.
- [ ] Photos load (or show placeholders). Check DevTools → Network for 404s, which usually mean a file-name case mismatch.
- [ ] The countdown shows the correct days to 3 Dec 2026, 8:00 AM IST.
- [ ] **Get Directions** and **Open in Google Maps** open the correct place.
- [ ] Test on an iPhone (Safari) and an Android phone (Chrome), in both portrait and landscape.
- [ ] Optional: set `og:image` in `index.html` to an absolute URL, for example `https://<user>.github.io/<repo>/assets/images/couple-hero.jpg`, so WhatsApp link previews show a photo.

### d) Updating later
```bash
git add .
git commit -m "Add couple photos and music"
git push
```
GitHub Pages redeploys automatically.

---

## 6. Credits

- Fonts: Cinzel, Cinzel Decorative, Cormorant Garamond, Noto Sans Kannada (Google Fonts, SIL Open Font License).
- The Ganesha image, kalash icon and banquet icon come from the original invitation file.
- The palace, arch, bells, diyas, toran and ornaments are hand-written inline SVG.
# pradeepwedsJanhavi
