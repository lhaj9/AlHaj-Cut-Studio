@echo off
setlocal EnableExtensions
title AlHaj Cut Studio - Local Static Server
cd /d "%~dp0"

echo.
echo ============================================================
echo   AlHaj Cut Studio - Local Static Server (No Node.js)
echo   Listening strictly on 127.0.0.1 (localhost only)
echo   Press Ctrl+C or close this window to stop the server.
echo ============================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root = (Get-Location).Path; " ^
  "$rootPrefix = $root.TrimEnd('\') + '\'; " ^
  "$port = 8123; " ^
  "$listener = $null; " ^
  "for ($p = 8123; $p -lt 8200; $p++) { " ^
  "  try { " ^
  "    $tl = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $p); " ^
  "    $tl.Start(); " ^
  "    $listener = $tl; " ^
  "    $port = $p; " ^
  "    break; " ^
  "  } catch { } " ^
  "} " ^
  "if (-not $listener) { Write-Error 'Could not bind any port on 127.0.0.1 (8123-8199).'; exit 1 } " ^
  "$url = 'http://127.0.0.1:' + $port + '/'; " ^
  "Write-Host ('Serving: ' + $root); " ^
  "Write-Host ('URL:     ' + $url); " ^
  "Write-Host 'Close this window or press Ctrl+C to stop.'; " ^
  "Start-Process $url; " ^
  "$mimeMap = @{ " ^
  "  '.html' = 'text/html; charset=utf-8'; " ^
  "  '.js'   = 'application/javascript; charset=utf-8'; " ^
  "  '.mjs'  = 'application/javascript; charset=utf-8'; " ^
  "  '.css'  = 'text/css; charset=utf-8'; " ^
  "  '.json' = 'application/json; charset=utf-8'; " ^
  "  '.webmanifest' = 'application/manifest+json; charset=utf-8'; " ^
  "  '.svg'  = 'image/svg+xml'; " ^
  "  '.png'  = 'image/png'; " ^
  "  '.jpg'  = 'image/jpeg'; " ^
  "  '.jpeg' = 'image/jpeg'; " ^
  "  '.webp' = 'image/webp'; " ^
  "  '.woff2'= 'font/woff2'; " ^
  "  '.woff' = 'font/woff'; " ^
  "  '.wasm' = 'application/wasm' " ^
  "}; " ^
  "try { " ^
  "  while ($true) { " ^
  "    $client = $listener.AcceptTcpClient(); " ^
  "    try { " ^
  "      $stream = $client.GetStream(); " ^
  "      $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true); " ^
  "      $reqLine = $reader.ReadLine(); " ^
  "      if ([string]::IsNullOrWhiteSpace($reqLine)) { $client.Close(); continue } " ^
  "      while ($true) { $h = $reader.ReadLine(); if ([string]::IsNullOrEmpty($h)) { break } } " ^
  "      $parts = $reqLine.Split(' '); " ^
  "      $method = $parts[0]; " ^
  "      $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { '/' }; " ^
  "      $cleanPath = ($rawPath.Split('?')[0]); " ^
  "      $cleanPath = [System.Uri]::UnescapeDataString($cleanPath); " ^
  "      if ($cleanPath -eq '/' -or [string]::IsNullOrEmpty($cleanPath)) { $cleanPath = '/index.html' } " ^
  "      $relPath = $cleanPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar); " ^
  "      $fullPath = [System.IO.Path]::GetFullPath((Join-Path $root $relPath)); " ^
  "      if (-not ($fullPath.Equals($root, [System.StringComparison]::OrdinalIgnoreCase) -or $fullPath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) -or -not (Test-Path -LiteralPath $fullPath -PathType Leaf)) { " ^
  "        $nf = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found'); " ^
  "        $hdr = \"HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($nf.Length)`r`nConnection: close`r`n`r`n\"; " ^
  "        $hb = [System.Text.Encoding]::ASCII.GetBytes($hdr); " ^
  "        $stream.Write($hb, 0, $hb.Length); " ^
  "        $stream.Write($nf, 0, $nf.Length); " ^
  "      } else { " ^
  "        $ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant(); " ^
  "        $ctype = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { 'application/octet-stream' }; " ^
  "        $bytes = [System.IO.File]::ReadAllBytes($fullPath); " ^
  "        $hdr = \"HTTP/1.1 200 OK`r`nContent-Type: $ctype`r`nContent-Length: $($bytes.Length)`r`nCross-Origin-Opener-Policy: same-origin`r`nCross-Origin-Embedder-Policy: credentialless`r`nCross-Origin-Resource-Policy: same-origin`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n\"; " ^
  "        $hb = [System.Text.Encoding]::ASCII.GetBytes($hdr); " ^
  "        $stream.Write($hb, 0, $hb.Length); " ^
  "        if ($method -ne 'HEAD') { $stream.Write($bytes, 0, $bytes.Length) } " ^
  "      } " ^
  "    } catch { } finally { $client.Close() } " ^
  "  } " ^
  "} finally { $listener.Stop() }"
