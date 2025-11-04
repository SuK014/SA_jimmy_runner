package datasource

import (
	"context"
	"log"
	"os"

	"go.elastic.co/apm/module/apmmongo"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDB struct {
	Context context.Context
	MongoDB *mongo.Client
}

func NewMongoDB(maxPoolSize uint64) *MongoDB {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		log.Fatal("❌ MONGODB_URI environment variable is not set")
	}

	option := options.Client().ApplyURI(mongoURI).SetMonitor(apmmongo.CommandMonitor()).SetMaxPoolSize(maxPoolSize)
	client, err0 := mongo.Connect(context.Background(), option)

	if err0 != nil {
		log.Fatalf("❌ Failed to connect to MongoDB: %v\nMake sure MONGODB_URI is correct: %s", err0, mongoURI)
	}

	log.Println("✅ Connected to MongoDB successfully")

	return &MongoDB{
		Context: context.Background(),
		MongoDB: client,
	}
}
