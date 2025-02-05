#!/bin/bash
# Start the Python MyFitnessPal service
python3 server/mfp_service/main.py &

# Start the main Node.js application
npm run dev
