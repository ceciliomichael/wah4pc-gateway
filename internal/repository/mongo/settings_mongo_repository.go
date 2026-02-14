package mongo

import (
	"context"
	"fmt"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type SettingsRepository struct {
	collection *mongo.Collection
}

func NewSettingsRepository(db *mongo.Database, collectionName string) (*SettingsRepository, error) {
	repo := &SettingsRepository{
		collection: db.Collection(collectionName),
	}

	if err := repo.ensureIndexes(); err != nil {
		return nil, err
	}

	return repo, nil
}

func (r *SettingsRepository) ensureIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create settings indexes: %w", err)
	}
	return nil
}

func (r *SettingsRepository) GetByID(id string) (model.SystemSettings, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var settings model.SystemSettings
	err := r.collection.FindOne(ctx, bson.D{{Key: "id", Value: id}}).Decode(&settings)
	if err != nil {
		return model.SystemSettings{}, mapMongoError(err)
	}
	return settings, nil
}

func (r *SettingsRepository) Create(settings model.SystemSettings) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.InsertOne(ctx, settings)
	return mapMongoError(err)
}

func (r *SettingsRepository) Update(settings model.SystemSettings) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := r.collection.ReplaceOne(ctx, bson.D{{Key: "id", Value: settings.ID}}, settings)
	if err != nil {
		return mapMongoError(err)
	}
	if result.MatchedCount == 0 {
		return repository.ErrNotFound
	}
	return nil
}
