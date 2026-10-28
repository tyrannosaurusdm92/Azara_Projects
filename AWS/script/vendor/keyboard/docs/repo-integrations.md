# Uploaded source references / reuse boundaries

This release preserves the expanded Savanski `keyboard_unified` web code and
the supplied seven audio collections. The older source packages were consulted
as references, not wholesale copied into this PWA:

| Attached project | Relevant design lesson | Included source? |
|---|---|---|
| `splitkeys-main` | Split geometry and MIT-licensed local word/bigram suggestion data | Suggestion data already included in base; MIT notice retained |
| `react-native-screen-keyboard-master` | Data-driven rows, visual responsiveness | No native React Native code |
| `ahk_on_screen_keyboard-main` | OS virtual key command categories | No AutoHotkey binaries |
| `CTkPopupKeyboard-main` | Numeric entry and popup controls | No Python GUI dependencies |
| `ClickPlay-main` | Movable keyboard and task-specific controls | No gaming binaries or unnecessary assets |
| `niri-tablet-main` | Linux tablet gesture and orientation considerations | No GPL-3 source copied |
| `osk-on-screen-keyboard-windows-master` | Function-key and focus strategy | No restrictive-license code copied |

The new Windows host uses original C# code with official Microsoft APIs. No
registered TSF input method, Android IME, iOS extension, macOS InputMethodKit
service or Linux IBus engine is bundled. The strict web ZIP contains no native
source, extra HTML file, compiled binary, batch file or Google Apps Script code.

Audio ownership/licensing is not established merely because files were supplied;
review the recording authors' redistribution terms before a public release.
