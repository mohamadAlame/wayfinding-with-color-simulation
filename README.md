# Banner test, 3D version

Remote study: people open a link, walk a made-up 3D street and choose a building. Separate branch (`3d-street`) from the Google Street View version.

- Run: `python3 server.py`, then http://localhost:8710/ . It prints the hidden admin address (`/admin-<token>`), also in `data/admin-token.txt`.
- Everyone does one practice and two walks: one with every banner the same blue, one with a colour per building. Four routes, same length (25 moves), two turns, three junctions.
- Routes are used in pairs (1+2, 3+4). Neighbouring testers swap colours on the same pair; testers 5-8 repeat with the routes in the other order. Recruit in multiples of 8 (`CELLS` in `server.py`).
- `data/` (sessions, settings, admin token) is not in git. No names or IP addresses are stored.
- To host it: `STUDY_HOST`, `STUDY_PORT`, `STUDY_DATA`; put HTTPS in front.
- three.js 0.160.0, MIT licence (`web/three-LICENSE.txt`).
