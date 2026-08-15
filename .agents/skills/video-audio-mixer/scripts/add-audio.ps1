#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$VideoPath,

    [Parameter(Mandatory = $true)]
    [string]$AudioPath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [ValidateSet('mix', 'replace')]
    [string]$Mode = 'mix',

    [ValidateRange(0.0, 4.0)]
    [double]$VideoVolume = 1.0,

    [ValidateRange(0.0, 4.0)]
    [double]$AudioVolume = 0.22,

    [ValidateRange(0.0, 30.0)]
    [double]$FadeInSeconds = 0.5,

    [ValidateRange(0.0, 30.0)]
    [double]$FadeOutSeconds = 0.8,

    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$culture = [System.Globalization.CultureInfo]::InvariantCulture

$ffmpegCommand = Get-Command ffmpeg -ErrorAction SilentlyContinue
$ffprobeCommand = Get-Command ffprobe -ErrorAction SilentlyContinue
if (-not $ffmpegCommand -or -not $ffprobeCommand) {
    throw 'ffmpeg and ffprobe must be installed and available in PATH.'
}

$video = (Resolve-Path -LiteralPath $VideoPath).Path
$audio = (Resolve-Path -LiteralPath $AudioPath).Path
$output = [System.IO.Path]::GetFullPath($OutputPath)

if ($output -eq $video -or $output -eq $audio) {
    throw 'OutputPath must be different from both input paths.'
}
if ([System.IO.Path]::GetExtension($output) -ne '.mp4') {
    throw 'OutputPath must use the .mp4 extension.'
}
if ((Test-Path -LiteralPath $output) -and -not $Force) {
    throw 'OutputPath already exists. Choose a new path or pass -Force explicitly.'
}

$outputDirectory = Split-Path -Parent $output
if ($outputDirectory -and -not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

$durationRaw = & $ffprobeCommand.Source -v error -show_entries format=duration -of 'default=noprint_wrappers=1:nokey=1' $video
if ($LASTEXITCODE -ne 0) {
    throw 'Could not read the video duration.'
}

[double]$duration = 0
if (-not [double]::TryParse(($durationRaw | Select-Object -First 1), [System.Globalization.NumberStyles]::Float, $culture, [ref]$duration) -or $duration -le 0) {
    throw 'The video duration is invalid.'
}

$durationText = $duration.ToString('0.###', $culture)
$fadeIn = [Math]::Min($FadeInSeconds, $duration / 2)
$fadeOut = [Math]::Min($FadeOutSeconds, $duration / 2)
$fadeOutStart = [Math]::Max(0, $duration - $fadeOut)
$fadeInText = $fadeIn.ToString('0.###', $culture)
$fadeOutText = $fadeOut.ToString('0.###', $culture)
$fadeOutStartText = $fadeOutStart.ToString('0.###', $culture)
$videoVolumeText = $VideoVolume.ToString('0.###', $culture)
$audioVolumeText = $AudioVolume.ToString('0.###', $culture)

$audioStream = & $ffprobeCommand.Source -v error -select_streams 'a:0' -show_entries stream=index -of 'csv=p=0' $video
$hasOriginalAudio = $LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($audioStream | Out-String))
if ($Mode -eq 'mix' -and -not $hasOriginalAudio) {
    Write-Warning 'The video has no original audio stream; switching to replace mode.'
    $Mode = 'replace'
}

$newAudioChain = "[1:a]volume=$audioVolumeText,atrim=0:$durationText,asetpts=N/SR/TB"
if ($fadeIn -gt 0) {
    $newAudioChain += ",afade=t=in:st=0:d=$fadeInText"
}
if ($fadeOut -gt 0) {
    $newAudioChain += ",afade=t=out:st=$fadeOutStartText:d=$fadeOutText"
}

if ($Mode -eq 'mix') {
    $filter = "$newAudioChain[music];[0:a]volume=$videoVolumeText[original];[original][music]amix=inputs=2:duration=first:dropout_transition=2,alimiter=limit=0.95[outa]"
}
else {
    $filter = "$newAudioChain,alimiter=limit=0.95[outa]"
}

$arguments = @(
    '-hide_banner', '-y',
    '-i', $video,
    '-stream_loop', '-1', '-i', $audio,
    '-filter_complex', $filter,
    '-map', '0:v:0', '-map', '[outa]',
    '-map_metadata', '0',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-t', $durationText,
    '-movflags', '+faststart',
    $output
)

& $ffmpegCommand.Source @arguments
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $output)) {
    throw 'FFmpeg failed to create the output video.'
}

$result = & $ffprobeCommand.Source -v error -show_entries 'format=duration:stream=codec_type,codec_name' -of json $output
if ($LASTEXITCODE -ne 0) {
    throw 'The output file was created but validation failed.'
}

Write-Output "Created: $output"
Write-Output $result
