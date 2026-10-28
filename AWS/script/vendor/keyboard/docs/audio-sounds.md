# Sound theme selection (pre-established per-key mappings)

Savanski includes **seven themes** and **719 short WAV sounds**, with each of the
126 standard key codes assigned a specific clip by the supplied
`json/audio-manifest.json`. Those mappings are fixed, not user-editable.

| Sound theme | Folder | Clips |
|---|---|---:|
| iPhone Taps | `assets/audio/iphone/` | 55 |
| Classic Keyboard | `assets/audio/classic/` | 122 |
| ASMR Clicks | `assets/audio/asmr/` | 54 |
| Typing Rhythm | `assets/audio/typing/` | 177 |
| Laptop Keys | `assets/audio/laptop/` | 121 |
| Computer Keys | `assets/audio/computer/` | 65 |
| Studio Typing | `assets/audio/studio/` | 125 |

Open **Design → Keyboard typing sound** to select the **theme**, preview it,
adjust volume, mute/unmute, or choose **No typing sound**. Space, Enter,
Backspace, Print Screen, letters, F keys and numeric-pad keys already have their
own per-key assigned sounds within the selected theme. There is **no interface
to assign clips to individual keys**.

The theme and volume are saved locally in `savanski.keyboard.sound.v1` and
`savanski.keyboard.volume.v1`; mute uses `savanski.keyboard.muted.v2`.
No audio preference change transmits typed content.

For offline PWA use, click **Cache selected theme for offline use** while online.
The PWA service worker saves the successful sound requests; the host build
bundles the WAVs locally, so it does not need a download to play them.

Before publishing the recordings publicly, verify redistribution rights of
each originally supplied MP3. A file's presence in an attachment does not
establish its copyright license.
