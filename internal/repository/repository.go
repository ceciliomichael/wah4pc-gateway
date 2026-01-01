package repository

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

var (
	ErrNotFound      = errors.New("entity not found")
	ErrAlreadyExists = errors.New("entity already exists")
)

// Identifiable is the interface that entities must implement
type Identifiable interface {
	GetID() string
}

// JsonRepository is a generic file-based JSON repository
type JsonRepository[T Identifiable] struct {
	filePath string
	mu       sync.RWMutex
}

// NewJsonRepository creates a new JSON repository for a given entity type
func NewJsonRepository[T Identifiable](filePath string) (*JsonRepository[T], error) {
	repo := &JsonRepository[T]{
		filePath: filePath,
	}

	if err := repo.ensureFile(); err != nil {
		return nil, err
	}

	return repo, nil
}

// ensureFile creates the file and directory if they don't exist
func (r *JsonRepository[T]) ensureFile() error {
	dir := filepath.Dir(r.filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	if _, err := os.Stat(r.filePath); os.IsNotExist(err) {
		if err := os.WriteFile(r.filePath, []byte("[]"), 0644); err != nil {
			return fmt.Errorf("failed to create file: %w", err)
		}
	}

	return nil
}

// readAll reads all entities from the JSON file
func (r *JsonRepository[T]) readAll() ([]T, error) {
	data, err := os.ReadFile(r.filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	var entities []T
	if err := json.Unmarshal(data, &entities); err != nil {
		return nil, fmt.Errorf("failed to unmarshal data: %w", err)
	}

	return entities, nil
}

// writeAll writes all entities to the JSON file
func (r *JsonRepository[T]) writeAll(entities []T) error {
	data, err := json.MarshalIndent(entities, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	if err := os.WriteFile(r.filePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

// GetAll returns all entities
func (r *JsonRepository[T]) GetAll() ([]T, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.readAll()
}

// GetByID returns an entity by its ID
func (r *JsonRepository[T]) GetByID(id string) (T, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var zero T
	entities, err := r.readAll()
	if err != nil {
		return zero, err
	}

	for _, entity := range entities {
		if entity.GetID() == id {
			return entity, nil
		}
	}

	return zero, ErrNotFound
}

// Create adds a new entity
func (r *JsonRepository[T]) Create(entity T) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	entities, err := r.readAll()
	if err != nil {
		return err
	}

	for _, e := range entities {
		if e.GetID() == entity.GetID() {
			return ErrAlreadyExists
		}
	}

	entities = append(entities, entity)
	return r.writeAll(entities)
}

// Update modifies an existing entity
func (r *JsonRepository[T]) Update(entity T) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	entities, err := r.readAll()
	if err != nil {
		return err
	}

	found := false
	for i, e := range entities {
		if e.GetID() == entity.GetID() {
			entities[i] = entity
			found = true
			break
		}
	}

	if !found {
		return ErrNotFound
	}

	return r.writeAll(entities)
}

// Delete removes an entity by ID
func (r *JsonRepository[T]) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	entities, err := r.readAll()
	if err != nil {
		return err
	}

	found := false
	filtered := make([]T, 0, len(entities))
	for _, e := range entities {
		if e.GetID() == id {
			found = true
			continue
		}
		filtered = append(filtered, e)
	}

	if !found {
		return ErrNotFound
	}

	return r.writeAll(filtered)
}

// Exists checks if an entity exists by ID
func (r *JsonRepository[T]) Exists(id string) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	entities, err := r.readAll()
	if err != nil {
		return false, err
	}

	for _, e := range entities {
		if e.GetID() == id {
			return true, nil
		}
	}

	return false, nil
}