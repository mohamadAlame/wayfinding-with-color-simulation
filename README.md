# Banner test, 3D version

Remote study: people open a link, walk a made-up 3D street and choose a building. Separate branch (`3d-street`) from the Google Street View version.

- Run: `python3 server.py`, then http://localhost:8710/ . It prints the hidden admin address (`/admin-<token>`), also in `data/admin-token.txt`.
- Mode A: every banner is the same blue. Mode B: each building's banner has its own colour. Everything else is identical.
- `data/` (sessions, settings, admin token) is not in git. No names or IP addresses are stored.
- To host it: `STUDY_HOST`, `STUDY_PORT`, `STUDY_DATA`; put HTTPS in front.
- three.js 0.160.0, MIT licence (`web/three-LICENSE.txt`).
