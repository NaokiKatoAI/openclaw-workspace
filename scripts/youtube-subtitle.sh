#!/bin/bash
# YouTube字幕取得スクリプト

if [ -z "$1" ]; then
  echo "使い方: $0 <YouTube URL>"
  exit 1
fi

URL="$1"
OUTPUT_DIR="downloads/youtube-subtitles"
mkdir -p "$OUTPUT_DIR"

# 字幕を取得（日本語優先、なければ自動生成、なければ英語）
yt-dlp --write-auto-sub --write-sub --sub-lang ja,en --skip-download --convert-subs srt -o "$OUTPUT_DIR/%(title)s.%(ext)s" "$URL"

# 取得したファイルを表示
echo ""
echo "取得した字幕:"
ls -lh "$OUTPUT_DIR"/*.srt 2>/dev/null || echo "字幕が見つかりませんでした"
