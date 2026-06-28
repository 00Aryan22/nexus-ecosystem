$src = 'd:/Projects/Nexus-AI Ecosystem'
$containerPath = '/src'
docker run --rm -v "$src:$containerPath" -w $containerPath crytic/slither:latest slither packages/contracts --print-results --json | Out-File -FilePath slither.json -Encoding utf8
