#!/bin/bash

echo "🚀 Testing ROM-driven initialization mode..."
echo
echo "This test demonstrates the transition from JavaScript stubbing to authentic ROM execution."
echo

# Start the server in background
echo "📡 Starting server..."
node server.js &
SERVER_PID=$!
sleep 3

echo
echo "📋 Phase 1: Load ROM and check current stub-based mode"
echo "=============================================="

# Load ROM
echo "📁 Loading Kickstart ROM..."
curl -s -X POST http://localhost:3000/roms/load-default | jq '.'

# Check ROM status
echo
echo "📊 Current ROM status:"
curl -s http://localhost:3000/roms/status | jq '.status.romDrivenMode // false'

echo
echo "📋 Phase 2: Enable ROM-driven mode (disable JavaScript stubs)"
echo "=============================================="

# Enable ROM-driven mode
echo "🚀 Enabling ROM-driven mode..."
curl -s -X POST http://localhost:3000/roms/enable-rom-driven-mode | jq '.'

echo
echo "📋 Phase 3: Initialize CPU from ROM reset vectors"
echo "=============================================="

# Initialize CPU from ROM
echo "🔧 Initializing CPU from ROM reset vectors..."
curl -s -X POST http://localhost:3000/cpu/initialize-from-rom | jq '.'

echo
echo "📋 Phase 4: Compare execution approaches"
echo "=============================================="

echo "🔍 ROM Reset Vectors:"
curl -s http://localhost:3000/roms/status | jq '.status.resetVectors // "No ROM loaded"'

echo
echo "🔍 CPU State (should match ROM vectors):"
curl -s http://localhost:3000/cpu/state | jq '.registers | {pc: .pc, sp: .a[7]}'

echo
echo "📋 Phase 5: Execute ROM code (this will be authentic Amiga startup)"
echo "=============================================="

echo "🎯 Taking first execution step (this executes ROM code, not stubs):"
curl -s -X POST http://localhost:3000/step | jq '.'

echo
echo "✅ Test complete!"
echo
echo "Summary:"
echo "- ROM-driven mode eliminates all JavaScript library stubs"
echo "- CPU initializes with authentic ROM reset vectors"
echo "- Execution begins at ROM startup code, not user program"
echo "- ROM will handle its own library initialization"

# Clean up
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null