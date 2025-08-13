#!/bin/bash

echo "=== DOWNLOADING MISSING PDFs FROM PRODUCTION ==="
echo ""

# Array of PDFs that need to be downloaded from production
PDFS=(
  "1755046975664-5f754.pdf"
  "1755046923661-ax7lv4.pdf"
  "1755046789675-5wud7b.pdf"
  "1755046732009-7quspa.pdf"
  "1755046666618-vrep9e.pdf"
  "1755046610147-6pz4jf.pdf"
  "1755046563085-qbmlwk.pdf"
  "1755046509009-97xxy.pdf"
  "1755046447785-9tqr09.pdf"
  "1755045926264-l7m6ww.pdf"
  "1755045034475-gygd9s.pdf"
  "1755044856456-t3w2mqb.pdf"
  "1755044803724-1se82.pdf"
  "1755044758541-7inoes.pdf"
  "1755044707196-lebl3m.pdf"
  "1755044648073-92ne7f.pdf"
  "1755044594897-6d3a6.pdf"
  "1755044549739-9uedot.pdf"
  "1755044489327-sfrl4c.pdf"
)

# Create directory if it doesn't exist
mkdir -p uploads/pdfs

# Download each PDF from production
for pdf in "${PDFS[@]}"; do
  url="https://mywonderfulbooks.com/uploads/pdfs/$pdf"
  dest="uploads/pdfs/$pdf"
  
  if [ ! -f "$dest" ]; then
    echo "Downloading: $pdf"
    curl -s -o "$dest" "$url"
    if [ -f "$dest" ]; then
      size=$(stat -f%z "$dest" 2>/dev/null || stat -c%s "$dest" 2>/dev/null)
      if [ "$size" -gt 1000 ]; then
        echo "  ✓ Downloaded successfully (${size} bytes)"
      else
        echo "  ✗ Download failed or file too small"
        rm -f "$dest"
      fi
    fi
  else
    echo "  Already exists: $pdf"
  fi
done

echo ""
echo "Download complete. Checking results..."
ls -la uploads/pdfs/175504* 2>/dev/null | head -20
