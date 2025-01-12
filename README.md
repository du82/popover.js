# popover.js
This single JavaScript file implements draggable, performant, themeable, vanilla JS popup previews as seen on [Gwern.net](https://gwern.net) for any website, and formats the containing content in the style of the parent site to prevent loss of immersion.

> [!NOTE]  
> Works only within one site due to CORS, as well as on external sites that don't block it. I don't like iframes, they bother me.

## Features
- [x] Internal link references
- [x] Section references (only show a specific section
- [x] Pin and unpin popups
- [x] Sites in the popover inherit the CSS of the parent site
- [x] Pinning a preview lets you quickly hover over a list of links to view their contents within the pinned preview
- [x] No nested previews (better performance)
- [x] Minimizing windows to the bottom left (and stacked windows)

## Planned features
- [ ] Performant nested previews?

## Screenshots
![image](https://github.com/user-attachments/assets/b6c51bd7-695a-4dce-bde2-592ca953bca2)
![image](https://github.com/user-attachments/assets/4271f43f-4287-4fe4-b588-d90a9b8eb027)
![image](https://github.com/user-attachments/assets/305c6786-03f4-44f8-9e84-350a6a495447)
