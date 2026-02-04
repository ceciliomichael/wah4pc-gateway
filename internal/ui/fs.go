package ui

import "embed"

// StaticFS embeds the static directory containing web assets
//
//go:embed static
var StaticFS embed.FS