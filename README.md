# Banner test, 3D version

Remote study: people open a link, walk a made-up 3D street and choose a building. Separate branch (`3d-street`) from the Google Street View version.

- Run: `python3 server.py`, then http://localhost:8710/ . It prints the hidden admin address (`/admin-<token>`), also in `data/admin-token.txt`.
- Everyone does one practice and two walks: one with every poster the same blue, one with a colour per building. Four routes, same length (25 moves), two turns, three junctions.
- **Two studies share the link and the data folder.** New sessions go to `STUDY` in `server.py` (now 2); each session stores `study` (missing = 1). The admin page has a tab per study.
  - Study 1 (23-27 Nov, `ROUTES` in `web/world.js`): seven posters per route, four of them on the right side street. Kept as it was, so its walks replay correctly.
  - Study 2 (from 27 Nov, `ROUTES2`): four posters per route, each colour once (the right building, the same spot on the other side street, one on the avenue, one down the other cross street). In the coloured walk a line of each poster's colour is painted on the road from the start to its building; lines share a street side by side and never cross. Routes 2 and 4 now say "btetrko awal mafra2 … w btekhdo l tene", because "awal …, w ba3da tene …" was misread. The practice now works like a real walk: Arabizi directions read once, then hidden, and a wrong choice is explained.
  - Returning people: the browser keeps each study's code; a study 2 session started in a browser that finished or started study 1 records it (`before`). People are also asked whether they did the study before.
- Slots count everyone who opened the link in the last 10 minutes, so people who open it together get different slots.
- Routes are used in pairs (1+2, 3+4). Neighbouring testers swap colours on the same pair; testers 5-8 repeat with the routes in the other order. Recruit in multiples of 8 (`CELLS` in `server.py`).
- `data/` (sessions, settings, admin token) is not in git. No names or IP addresses are stored.
- To host it: `STUDY_HOST`, `STUDY_PORT`, `STUDY_DATA`; put HTTPS in front.
- three.js 0.160.0, MIT licence (`web/three-LICENSE.txt`).
