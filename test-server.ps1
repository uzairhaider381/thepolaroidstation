# ==============================================================================
# The Polaroid Station – Lightweight Zero-Dependency Local Dev Server
# Serves static assets on http://localhost:8080 and handles /api/book requests
# ==============================================================================

param(
    [int]$Port = 8080,
    [string]$Root = "d:\maham"
)

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "📸 The Polaroid Station local server running at http://localhost:$Port/" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)

        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            $client.Close()
            continue
        }

        $parts = $requestLine -split ' '
        $method = $parts[0]
        $url = $parts[1]

        # Read headers
        $contentLength = 0
        while ($line = $reader.ReadLine()) {
            if ($line -eq "") { break }
            if ($line -match "^Content-Length:\s*(\d+)") {
                $contentLength = [int]$matches[1]
            }
        }

        # Handle API route /api/book
        if ($url -like "/api/book*") {
            $body = ""
            if ($contentLength -gt 0) {
                $buffer = New-Object char[] $contentLength
                $read = $reader.ReadBlock($buffer, 0, $contentLength)
                $body = New-Object string($buffer, 0, $read)
            }

            if ($method -eq "OPTIONS") {
                $resp = "HTTP/1.1 200 OK`r`nAccess-Control-Allow-Origin: *`r`nAccess-Control-Allow-Methods: POST,OPTIONS`r`nAccess-Control-Allow-Headers: Content-Type`r`nContent-Length: 0`r`n`r`n"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                $stream.Write($bytes, 0, $bytes.Length)
            }
            elseif ($method -eq "POST") {
                $jsonResp = ""
                $status = "200 OK"
                try {
                    $data = $body | ConvertFrom-Json
                    if ($data.website_hp) {
                        $jsonResp = '{"success":true,"message":"Thank you! We have received your request."}'
                    }
                    elseif (-not $data.termsAccepted -or $data.termsAccepted -eq $false) {
                        $status = "400 Bad Request"
                        $jsonResp = '{"success":false,"error":"You must read and agree to the Terms & Conditions before submitting your booking request."}'
                    }
                    elseif (-not $data.name -or -not $data.email -or -not $data.phone) {
                        $status = "400 Bad Request"
                        $jsonResp = '{"success":false,"error":"Please provide your name, email, and phone number."}'
                    }
                    else {
                        $jsonResp = '{"success":true,"preview":true,"message":"Thank you! We have received your booking request and will contact you soon 💌"}'
                        Write-Host "💌 Booking received from $($data.name) for $($data.package) ($($data.polaroidsCount) Polaroids) on $($data.eventDate)!" -ForegroundColor Cyan
                    }
                }
                catch {
                    $status = "400 Bad Request"
                    $jsonResp = '{"success":false,"error":"Invalid JSON payload."}'
                }

                $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonResp)
                $header = "HTTP/1.1 $status`r`nContent-Type: application/json; charset=utf-8`r`nAccess-Control-Allow-Origin: *`r`nContent-Length: $($jsonBytes.Length)`r`n`r`n"
                $hBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
                $stream.Write($hBytes, 0, $hBytes.Length)
                $stream.Write($jsonBytes, 0, $jsonBytes.Length)
            }
            else {
                $resp = "HTTP/1.1 405 Method Not Allowed`r`nContent-Length: 0`r`n`r`n"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
                $stream.Write($bytes, 0, $bytes.Length)
            }
        }
        else {
            # Static files
            $cleanUrl = $url.Split('?')[0]
            if ($cleanUrl -eq "/" -or $cleanUrl -eq "") {
                $cleanUrl = "/index.html"
            }

            # Map to file path
            $filePath = Join-Path $Root ($cleanUrl.TrimStart('/'))

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $ctype = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                $fileBytes = [System.IO.File]::ReadAllBytes($filePath)

                $header = "HTTP/1.1 200 OK`r`nContent-Type: $ctype`r`nContent-Length: $($fileBytes.Length)`r`n`r`n"
                $hBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
                $stream.Write($hBytes, 0, $hBytes.Length)
                $stream.Write($fileBytes, 0, $fileBytes.Length)
            }
            else {
                $notFound = "HTTP/1.1 404 Not Found`r`nContent-Length: 9`r`n`r`nNot Found"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($notFound)
                $stream.Write($bytes, 0, $bytes.Length)
            }
        }

        $stream.Flush()
        $client.Close()
    }
}
finally {
    $listener.Stop()
}
