#!/bin/bash

# Set the dynamic library path for WeasyPrint
export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"

# Navigate to the InvenTree directory
cd "/Users/rivansh/Documents local/InvenTree"

# Activate the virtual environment
source env/bin/activate

# Start the Django development server
python src/backend/InvenTree/manage.py runserver
