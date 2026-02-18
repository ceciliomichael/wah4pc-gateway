package mongo

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/wah4pc/wah4pc-gateway/pkg/logger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type LogRepository struct {
	collection *mongo.Collection
}

func NewLogRepository(db *mongo.Database, collectionName string) (*LogRepository, error) {
	repo := &LogRepository{
		collection: db.Collection(collectionName),
	}

	if err := repo.ensureIndexes(); err != nil {
		return nil, err
	}

	return repo, nil
}

func (r *LogRepository) ensureIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "date", Value: 1}, {Key: "timestamp", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "providerId", Value: 1}},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create log indexes: %w", err)
	}
	return nil
}

func (r *LogRepository) Upsert(entry logger.StoredLogEntry) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.ReplaceOne(
		ctx,
		bson.D{{Key: "id", Value: entry.ID}},
		entry,
		options.Replace().SetUpsert(true),
	)
	return mapMongoError(err)
}

func (r *LogRepository) ListDates() ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	dates, err := r.collection.Distinct(ctx, "date", bson.D{})
	if err != nil {
		return nil, err
	}

	out := make([]string, 0, len(dates))
	for _, value := range dates {
		if date, ok := value.(string); ok && date != "" {
			out = append(out, date)
		}
	}
	sort.Strings(out)
	return out, nil
}

func (r *LogRepository) ListByDate(date string) ([]logger.StoredLogEntry, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cur, err := r.collection.Find(
		ctx,
		bson.D{{Key: "date", Value: date}},
		options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	entries := make([]logger.StoredLogEntry, 0)
	for cur.Next(ctx) {
		var entry logger.StoredLogEntry
		if err := cur.Decode(&entry); err != nil {
			return nil, err
		}
		entries = append(entries, entry)
	}
	if err := cur.Err(); err != nil {
		return nil, err
	}
	return entries, nil
}

func (r *LogRepository) GetByID(id string) (logger.StoredLogEntry, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var entry logger.StoredLogEntry
	err := r.collection.FindOne(ctx, bson.D{{Key: "id", Value: id}}).Decode(&entry)
	if err != nil {
		return logger.StoredLogEntry{}, mapMongoError(err)
	}
	return entry, nil
}
