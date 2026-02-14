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

type ProviderRepository struct {
	collection *mongo.Collection
}

func NewProviderRepository(db *mongo.Database, collectionName string) (*ProviderRepository, error) {
	repo := &ProviderRepository{
		collection: db.Collection(collectionName),
	}

	if err := repo.ensureIndexes(); err != nil {
		return nil, err
	}

	return repo, nil
}

func (r *ProviderRepository) ensureIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create provider indexes: %w", err)
	}
	return nil
}

func (r *ProviderRepository) GetAll() ([]model.Provider, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cur, err := r.collection.Find(ctx, bson.D{})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	providers := make([]model.Provider, 0)
	for cur.Next(ctx) {
		var provider model.Provider
		if err := cur.Decode(&provider); err != nil {
			return nil, err
		}
		providers = append(providers, provider)
	}

	if err := cur.Err(); err != nil {
		return nil, err
	}

	return providers, nil
}

func (r *ProviderRepository) GetByID(id string) (model.Provider, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var provider model.Provider
	err := r.collection.FindOne(ctx, bson.D{{Key: "id", Value: id}}).Decode(&provider)
	if err != nil {
		return model.Provider{}, mapMongoError(err)
	}

	return provider, nil
}

func (r *ProviderRepository) Create(provider model.Provider) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.InsertOne(ctx, provider)
	return mapMongoError(err)
}

func (r *ProviderRepository) Update(provider model.Provider) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := r.collection.ReplaceOne(ctx, bson.D{{Key: "id", Value: provider.ID}}, provider)
	if err != nil {
		return mapMongoError(err)
	}
	if result.MatchedCount == 0 {
		return repository.ErrNotFound
	}
	return nil
}

func (r *ProviderRepository) Delete(id string) error {
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

func (r *ProviderRepository) Exists(id string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := r.collection.CountDocuments(ctx, bson.D{{Key: "id", Value: id}})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
