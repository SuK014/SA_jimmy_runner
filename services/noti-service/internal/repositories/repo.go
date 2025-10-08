package repositories

import (
	"context"

	// "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/store/datasource"
	"github.com/SuK014/SA_jimmy_runner/services/user-service/internal/store/prisma/db"
)

type notificationRepository struct {
	Context    context.Context
	Collection *db.PrismaClient
}

type INotificationRepository interface {
}
