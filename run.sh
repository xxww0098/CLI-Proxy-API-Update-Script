#!/bin/bash
cd "$(dirname "$0")"
node ./update.js
./cli-proxy-api --config ./config.yaml
