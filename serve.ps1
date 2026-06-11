try {
  $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
  $LogPath = Join-Path $Root "server.log"
  $UrlPath = Join-Path $Root "server-url.txt"
  "Starting server at $(Get-Date -Format o)" | Set-Content -LiteralPath $LogPath -Encoding UTF8
  $Port = 3000
  $Listener = $null
  while ($null -eq $Listener) {
    try {
      $Listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
      $Listener.Start()
    } catch {
      if ($Port -ge 3010) {
        throw
      }
      $Port += 1
      $Listener = $null
    }
  }
  "Listening on 0.0.0.0:$Port from $Root" | Add-Content -LiteralPath $LogPath -Encoding UTF8
  "http://localhost:${Port}/" | Set-Content -LiteralPath $UrlPath -Encoding ASCII
  Write-Host "Game Map Stitcher server is running."
  Write-Host "PC URL: http://localhost:${Port}/"
  Write-Host "Phone URL: http://192.168.2.12:${Port}/"
  Write-Host "Keep this window open. Press Ctrl+C or close it to stop."

$MimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".webp" = "image/webp"
}

function Send-Response($Stream, [int]$Status, [string]$StatusText, [byte[]]$Body, [string]$ContentType) {
  $Header = "HTTP/1.1 $Status $StatusText`r`nContent-Length: $($Body.Length)`r`nContent-Type: $ContentType`r`nConnection: close`r`n`r`n"
  $HeaderBytes = [System.Text.Encoding]::ASCII.GetBytes($Header)
  $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
  $Stream.Write($Body, 0, $Body.Length)
}

  while ($true) {
    $Client = $Listener.AcceptTcpClient()
    $Client.ReceiveTimeout = 3000
    $Client.SendTimeout = 3000
    try {
      $Stream = $Client.GetStream()
      $Reader = [System.IO.StreamReader]::new($Stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $RequestLine = $Reader.ReadLine()

      if ([string]::IsNullOrWhiteSpace($RequestLine)) {
        continue
      }

      $PathPart = $RequestLine.Split(" ")[1]
      $PathPart = [System.Uri]::UnescapeDataString($PathPart.Split("?")[0])
      if ($PathPart -eq "/") {
        $PathPart = "/index.html"
      }

      $Relative = $PathPart.TrimStart("/") -replace "/", [System.IO.Path]::DirectorySeparatorChar
      $FullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $Relative))
      $RootPath = [System.IO.Path]::GetFullPath($Root)

      if (-not $FullPath.StartsWith($RootPath)) {
        $Body = [System.Text.Encoding]::UTF8.GetBytes("Forbidden")
        Send-Response $Stream 403 "Forbidden" $Body "text/plain; charset=utf-8"
        continue
      }

      if (-not (Test-Path -LiteralPath $FullPath -PathType Leaf)) {
        $Body = [System.Text.Encoding]::UTF8.GetBytes("Not found")
        Send-Response $Stream 404 "Not Found" $Body "text/plain; charset=utf-8"
        continue
      }

      $Ext = [System.IO.Path]::GetExtension($FullPath).ToLowerInvariant()
      $ContentType = if ($MimeTypes.ContainsKey($Ext)) { $MimeTypes[$Ext] } else { "application/octet-stream" }
      $Body = [System.IO.File]::ReadAllBytes($FullPath)
      Send-Response $Stream 200 "OK" $Body $ContentType
    } catch {
      "Request error: $($_.Exception.ToString())" | Add-Content -LiteralPath $LogPath -Encoding UTF8
    } finally {
      $Client.Close()
    }
  }
} catch {
  "Fatal error: $($_.Exception.ToString())" | Add-Content -LiteralPath $LogPath -Encoding UTF8
  throw
}
