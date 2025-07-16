#!/bin/bash

echo "🧪 Testing OpenLibrary fix..."

# Upload the test executable
echo "📁 Uploading test-02-window executable..."
curl -X POST -F "executable=@test-02-window" http://localhost:3000/upload

echo -e "\n"

# Check the library name string before OpenLibrary call
echo "🔍 Checking library name string before OpenLibrary call..."
curl -X GET "http://localhost:3000/memory?address=0x40008a&size=32" | jq '.memory' | python3 -c "
import sys, json
data = json.load(sys.stdin)
chars = ''.join(chr(b) if 32 <= b <= 126 else '.' for b in data)
print(f'Library name: \"{chars}\"')
print(f'Raw bytes: {data}')
"

echo -e "\n"

# Step through execution until we reach the OpenLibrary call
echo "🚶 Stepping through execution..."
for i in {1..4}; do
    echo "Step $i:"
    curl -s -X GET http://localhost:3000/step | jq -r '.cpu.instruction'
done

echo -e "\n"

# Check the library name string after OpenLibrary call
echo "🔍 Checking library name string after OpenLibrary call..."
curl -X GET "http://localhost:3000/memory?address=0x40008a&size=32" | jq '.memory' | python3 -c "
import sys, json
data = json.load(sys.stdin)
chars = ''.join(chr(b) if 32 <= b <= 126 else '.' for b in data)
print(f'Library name: \"{chars}\"')
print(f'Raw bytes: {data}')
"

echo -e "\n✅ Test completed!"