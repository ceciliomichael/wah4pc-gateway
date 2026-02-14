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

type TransactionRepository struct {
	collection *mongo.Collection
}

func NewTransactionRepository(db *mongo.Database, collectionName string) (*TransactionRepository, error) {
	repo := &TransactionRepository{
		collection: db.Collection(collectionName),
	}

	if err := repo.ensureIndexes(); err != nil {
		return nil, err
	}

	return repo, nil
}

func (r *TransactionRepository) ensureIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "requesterId", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "targetId", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "createdAt", Value: -1}},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create transaction indexes: %w", err)
	}
	return nil
}

func (r *TransactionRepository) GetAll() ([]model.Transaction, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cur, err := r.collection.Find(ctx, bson.D{})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	transactions := make([]model.Transaction, 0)
	for cur.Next(ctx) {
		var tx model.Transaction
		if err := cur.Decode(&tx); err != nil {
			return nil, err
		}
		transactions = append(transactions, tx)
	}

	if err := cur.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}

func (r *TransactionRepository) GetByID(id string) (model.Transaction, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var tx model.Transaction
	err := r.collection.FindOne(ctx, bson.D{{Key: "id", Value: id}}).Decode(&tx)
	if err != nil {
		return model.Transaction{}, mapMongoError(err)
	}

	return tx, nil
}

func (r *TransactionRepository) Create(tx model.Transaction) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.InsertOne(ctx, tx)
	return mapMongoError(err)
}

func (r *TransactionRepository) Update(tx model.Transaction) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := r.collection.ReplaceOne(ctx, bson.D{{Key: "id", Value: tx.ID}}, tx)
	if err != nil {
		return mapMongoError(err)
	}
	if result.MatchedCount == 0 {
		return repository.ErrNotFound
	}
	return nil
}

func (r *TransactionRepository) FindPotentialDuplicates(requesterID, targetID, resourceType string, cutoff time.Time) ([]model.Transaction, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.D{
		{Key: "requesterId", Value: requesterID},
		{Key: "targetId", Value: targetID},
		{Key: "resourceType", Value: resourceType},
		{Key: "createdAt", Value: bson.D{{Key: "$gte", Value: cutoff}}},
	}

	cur, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	duplicates := make([]model.Transaction, 0)
	for cur.Next(ctx) {
		var tx model.Transaction
		if err := cur.Decode(&tx); err != nil {
			return nil, err
		}
		duplicates = append(duplicates, tx)
	}

	if err := cur.Err(); err != nil {
		return nil, err
	}

	return duplicates, nil
}
