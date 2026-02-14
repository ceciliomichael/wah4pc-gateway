package mongo

import (
	"errors"

	"github.com/wah4pc/wah4pc-gateway/internal/repository"
	mongoDriver "go.mongodb.org/mongo-driver/mongo"
)

func mapMongoError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, mongoDriver.ErrNoDocuments) {
		return repository.ErrNotFound
	}
	if mongoDriver.IsDuplicateKeyError(err) {
		return repository.ErrAlreadyExists
	}
	return err
}
