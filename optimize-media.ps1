$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

$ffmpegCommand = Get-Command ffmpeg -ErrorAction SilentlyContinue
$ffprobeCommand = Get-Command ffprobe -ErrorAction SilentlyContinue
if (-not $ffmpegCommand -or -not $ffprobeCommand) {
    $wingetRoot = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
    $ffmpegPackage = Get-ChildItem -LiteralPath $wingetRoot -Directory -Filter 'Gyan.FFmpeg.Shared_*' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($ffmpegPackage) {
        $bin = Get-ChildItem -LiteralPath $ffmpegPackage.FullName -Directory -Filter 'ffmpeg-*-full_build-shared' -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($bin) {
            $ffmpegCommand = Get-Command (Join-Path $bin.FullName 'bin\ffmpeg.exe') -ErrorAction SilentlyContinue
            $ffprobeCommand = Get-Command (Join-Path $bin.FullName 'bin\ffprobe.exe') -ErrorAction SilentlyContinue
        }
    }
}
if (-not $ffmpegCommand -or -not $ffprobeCommand) {
    throw 'FFmpeg/FFprobe not found. Install FFmpeg, then run this script again.'
}
$ffmpeg = $ffmpegCommand.Source
$ffprobe = $ffprobeCommand.Source

$imageSources = Get-ChildItem -LiteralPath (Join-Path $root 'assets') -Recurse -File | Where-Object { $_.Extension -in '.jpg', '.jpeg', '.png' }
foreach ($source in $imageSources) {
    $output = [IO.Path]::ChangeExtension($source.FullName, '.webp')
    if ((Test-Path -LiteralPath $output) -and (Get-Item -LiteralPath $output).LastWriteTimeUtc -ge $source.LastWriteTimeUtc) {
        continue
    }
    if ($source.Name -eq 'arcade-machine.png') {
        & $ffmpeg -hide_banner -loglevel error -y -i $source.FullName -an -c:v libwebp_anim -lossless 0 -q:v 82 -compression_level 6 -loop 0 $output
    } else {
        $probe = (& $ffprobe -v error -show_entries format=format_name -of default=noprint_wrappers=1:nokey=1 $source.FullName | Select-Object -First 1)
        if ($probe -match 'png') {
            & $ffmpeg -hide_banner -loglevel error -y -i $source.FullName -frames:v 1 -c:v libwebp -lossless 1 -compression_level 6 $output
        } else {
            & $ffmpeg -hide_banner -loglevel error -y -i $source.FullName -frames:v 1 -c:v libwebp -quality 84 -compression_level 6 $output
        }
    }
    if ($LASTEXITCODE -ne 0) { throw "Image conversion failed: $($source.FullName)" }
    $saved = 100 - [math]::Round(((Get-Item -LiteralPath $output).Length / $source.Length) * 100)
    Write-Host ("Image: {0} -> {1} ({2}% smaller)" -f $source.Name, (Split-Path $output -Leaf), $saved)
}

$videoSources = Get-ChildItem -LiteralPath (Join-Path $root 'assets') -Recurse -Filter '*.mp4' -File
foreach ($source in $videoSources) {
    $output = [IO.Path]::ChangeExtension($source.FullName, '.webm')
    if ((Test-Path -LiteralPath $output) -and (Get-Item -LiteralPath $output).LastWriteTimeUtc -ge $source.LastWriteTimeUtc) {
        continue
    }
    & $ffmpeg -hide_banner -loglevel error -y -i $source.FullName -map 0:v:0 -map '0:a?' -vf "scale='min(1920,iw)':-2" -c:v libvpx-vp9 -crf 32 -b:v 0 -deadline good -cpu-used 4 -row-mt 1 -c:a libopus -b:a 96k -f webm $output
    if ($LASTEXITCODE -ne 0) { throw "Video conversion failed: $($source.FullName)" }
    $saved = 100 - [math]::Round(((Get-Item -LiteralPath $output).Length / $source.Length) * 100)
    Write-Host ("Video: {0} -> {1} ({2}% smaller)" -f $source.Name, (Split-Path $output -Leaf), $saved)
}

$siteFiles = Get-ChildItem -LiteralPath $root -File | Where-Object { $_.Extension -in '.html', '.js', '.css', '.md' }
foreach ($file in $siteFiles) {
    $content = [IO.File]::ReadAllText($file.FullName, [Text.Encoding]::UTF8)
    $content = $content.Replace('.mp4', '.webm').Replace('.jpeg', '.webp').Replace('.jpg', '.webp').Replace('.png', '.webp')
    [IO.File]::WriteAllText($file.FullName, $content, [Text.UTF8Encoding]::new($false))
}

Write-Host 'Done. The original MP4/JPG/PNG files are kept in place.'
