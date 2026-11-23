#!/bin/zsh
cd "$(dirname "$0")"
(sleep 1; open http://localhost:8700) &
exec python3 server.py
