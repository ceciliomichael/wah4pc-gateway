package mongo

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ApiKeyRepository struct {
	collection *mongo.Collection
}

func NewApiKeyRepository(db *mongo.Database, collectionName string) (*ApiKeyRepository, error) {
	repo := &ApiKeyRepository{
		collection: db.Collection(collectionName),
	}

	if err := repo.ensureIndexes(); err != nil {
		return nil, err
	}

	return repo, nil
}

func (r *ApiKeyRepository) ensureIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return fmt.Errorf("failed to create api key indexes: %w", err)
	}

	_, err = r.collection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "keyHash", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		// Backward-compatibility: older deployments may already have a non-unique
		// keyHash index with the same generated name (keyHash_1). In that case we
		// keep running and allow a manual migration to a unique index.
		if !isLegacyKeyHashIndexConflict(err) {
			return fmt.Errorf("failed to create api key indexes: %w", err)
		}
	}

	return nil
}

func isLegacyKeyHashIndexConflict(err error) bool {
	if err == nil {
		return false
	}

	msg := err.Error()
	return strings.Contains(msg, "IndexKeySpecsConflict") ||
		strings.Contains(msg, "IndexOptionsConflict")
}

func (r *ApiKeyRepository) GetAll() ([]model.ApiKey, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cur, err := r.collection.Find(ctx, bson.D{})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	keys := make([]model.ApiKey, 0)
	for cur.Next(ctx) {
		var key model.ApiKey
		if err := cur.Decode(&key); err != nil {
			return nil, err
		}
		keys = append(keys, key)
	}

	if err := cur.Err(); err != nil {
		return nil, err
	}

	return keys, nil
}

func (r *ApiKeyRepository) GetByID(id string) (model.ApiKey, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var key model.ApiKey
	err := r.collection.FindOne(ctx, bson.D{{Key: "id", Value: id}}).Decode(&key)
	if err != nil {
		return model.ApiKey{}, mapMongoError(err)
	}
	return key, nil
}

func (r *ApiKeyRepository) GetByHash(keyHash string) (model.ApiKey, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var key model.ApiKey
	err := r.collection.FindOne(ctx, bson.D{{Key: "keyHash", Value: keyHash}}).Decode(&key)
	if err != nil {
		return model.ApiKey{}, mapMongoError(err)
	}
	return key, nil
}

func (r *ApiKeyRepository) Create(key model.ApiKey) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.InsertOne(ctx, key)
	return mapMongoError(err)
}

func (r *ApiKeyRepository) Update(key model.ApiKey) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := r.collection.ReplaceOne(ctx, bson.D{{Key: "id", Value: key.ID}}, key)
	if err != nil {
		return mapMongoError(err)
	}
	if result.MatchedCount == 0 {
		return repository.ErrNotFound
	}
	return nil
}

func (r *ApiKeyRepository) Delete(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := r.collection.DeleteOne(ctx, bson.D{{Key: "id", Value: id}})
	if err != nil {
		return err
	}
	if result.DeletedCount == 0 {
		return repository.ErrNotFound
	}
	return nil
}
