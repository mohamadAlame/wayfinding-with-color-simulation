# Banner test

Double-click `start.command`, or run `python3 server.py`, then open http://localhost:8700 (needs internet for Street View).

- **/settings**: Street View starts and the directions for modes A (directions only) and B (with the banner).
- **/**: run a participant. **/results**: summary, CSV, withdraw by code.
- `data/` holds one file per participant code, no names, and is not committed to git.
- **/banner**: draws a banner on Street View (needs a Google Maps JavaScript API key in Settings). Corners are placed once per spot on the route, saved in `banner.json`.
