package service

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"time"

	"wah4pc/internal/config"
	"wah4pc/pkg/logger"
)

type validatorServiceImpl struct {
	cfg    *config.Config
	cmd    *exec.Cmd
	ready  bool
	client *http.Client
	logger *logger.Logger
}

func NewValidatorService(cfg *config.Config, log *logger.Logger) ValidatorService {
	return &validatorServiceImpl{
		cfg:    cfg,
		client: &http.Client{Timeout: 2 * time.Second},
		logger: log,
	}
}

func (s *validatorServiceImpl) Start(ctx context.Context) error {
	args := []string{
		"-jar", s.cfg.JavaValidator.JarPath,
		"-server", s.cfg.JavaValidator.Port,
		"-version", s.cfg.Fhir.Version,
	}

	// Add Implementation Guide path if configured (e.g., PH Core profiles)
	if s.cfg.JavaValidator.IgPath != "" {
		args = append(args, "-ig", s.cfg.JavaValidator.IgPath)
	}

	s.cmd = exec.CommandContext(ctx, s.cfg.JavaValidator.JavaPath, args...)

	// Redirect stdout/stderr to OS stdout/stderr for now
	// In a production app, we might want to pipe this to a logger
	s.cmd.Stdout = os.Stdout
	s.cmd.Stderr = os.Stderr

	s.logger.Startf("Executing: %s %v", s.cfg.JavaValidator.JavaPath, args)

	if err := s.cmd.Start(); err != nil {
		return fmt.Errorf("failed to start java process: %w", err)
	}

	// Wait for server to be ready
	go s.waitForReady(ctx)

	return nil
}

func (s *validatorServiceImpl) Stop() error {
	if s.cmd != nil && s.cmd.Process != nil {
		s.logger.Warn("Stopping Java validator process...")
		return s.cmd.Process.Kill()
	}
	return nil
}

func (s *validatorServiceImpl) IsReady() bool {
	return s.ready
}

func (s *validatorServiceImpl) GetTargetURL() string {
	return s.cfg.GetJavaInternalAddr()
}

func (s *validatorServiceImpl) waitForReady(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	targetURL := s.GetTargetURL()
	s.logger.Info("Waiting for validator to be ready...")

	attempts := 0
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			attempts++
			// Try to connect to the server
			resp, err := s.client.Get(targetURL)
			if err == nil {
				resp.Body.Close()
				// If we get a response, even an error code, the server is running
				s.ready = true
				s.logger.Successf("Java validator is ready! (took %d attempts)", attempts)
				return
			}

			// Show progress every 5 attempts
			if attempts%5 == 0 {
				s.logger.Warnf("Still waiting for validator... (%d attempts)", attempts)
			}
		}
	}
}
