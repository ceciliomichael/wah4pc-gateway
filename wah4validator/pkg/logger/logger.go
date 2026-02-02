package logger

import (
	"fmt"
	"time"
)

// ANSI color codes
const (
	colorReset  = "\033[0m"
	colorRed    = "\033[31m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorBlue   = "\033[34m"
	colorPurple = "\033[35m"
	colorCyan   = "\033[36m"
	colorWhite  = "\033[37m"
	colorBold   = "\033[1m"
	colorDim    = "\033[2m"
)

// Log levels
const (
	LevelInfo  = "INFO"
	LevelWarn  = "WARN"
	LevelError = "ERROR"
	LevelDebug = "DEBUG"
	LevelStart = "START"
	LevelReady = "READY"
)

type Logger struct {
	serviceName string
}

func New(serviceName string) *Logger {
	return &Logger{
		serviceName: serviceName,
	}
}

func (l *Logger) log(level, color, emoji, message string) {
	timestamp := time.Now().Format("15:04:05")
	
	fmt.Printf("%s%s%s %s %s%s%s %s│%s %s%s\n",
		colorDim, timestamp, colorReset,
		emoji,
		color, colorBold, level, colorReset,
		colorDim, colorReset,
		message,
	)
}

func (l *Logger) Info(message string) {
	l.log(LevelInfo, colorCyan, "ℹ", message)
}

func (l *Logger) Warn(message string) {
	l.log(LevelWarn, colorYellow, "⚠", message)
}

func (l *Logger) Error(message string) {
	l.log(LevelError, colorRed, "✗", message)
}

func (l *Logger) Debug(message string) {
	l.log(LevelDebug, colorPurple, "◆", message)
}

func (l *Logger) Success(message string) {
	l.log(LevelReady, colorGreen, "✓", message)
}

func (l *Logger) Start(message string) {
	l.log(LevelStart, colorBlue, "▶", message)
}

func (l *Logger) Infof(format string, args ...interface{}) {
	l.Info(fmt.Sprintf(format, args...))
}

func (l *Logger) Warnf(format string, args ...interface{}) {
	l.Warn(fmt.Sprintf(format, args...))
}

func (l *Logger) Errorf(format string, args ...interface{}) {
	l.Error(fmt.Sprintf(format, args...))
}

func (l *Logger) Debugf(format string, args ...interface{}) {
	l.Debug(fmt.Sprintf(format, args...))
}

func (l *Logger) Successf(format string, args ...interface{}) {
	l.Success(fmt.Sprintf(format, args...))
}

func (l *Logger) Startf(format string, args ...interface{}) {
	l.Start(fmt.Sprintf(format, args...))
}

// Banner prints a styled banner
func (l *Logger) Banner(title, subtitle string) {
	fmt.Printf("\n%s%s╔═══════════════════════════════════════════════════════════╗%s\n", colorBold, colorCyan, colorReset)
	fmt.Printf("%s%s║%s  %s%-55s%s  %s║%s\n", colorBold, colorCyan, colorReset, colorBold, title, colorReset, colorCyan, colorReset)
	if subtitle != "" {
		fmt.Printf("%s%s║%s  %s%-55s%s  %s║%s\n", colorBold, colorCyan, colorReset, colorDim, subtitle, colorReset, colorCyan, colorReset)
	}
	fmt.Printf("%s%s╚═══════════════════════════════════════════════════════════╝%s\n\n", colorBold, colorCyan, colorReset)
}

// Separator prints a visual separator
func (l *Logger) Separator() {
	fmt.Printf("%s%s─────────────────────────────────────────────────────────────%s\n", colorDim, colorWhite, colorReset)
}