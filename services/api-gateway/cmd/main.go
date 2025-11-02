package main

import (
	"os"

	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/configuration"
	httpHandler "github.com/SuK014/SA_jimmy_runner/services/api-gateway/handlers"
	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/middlewares"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	app := fiber.New(configuration.NewFiberConfiguration())
	middlewares.Logger(app)
	app.Use(recover.New())
	app.Use(cors.New())

	// Get service URLs from environment variables or use defaults for local development
	userServiceURL := os.Getenv("USER_SERVICE_URL")
	if userServiceURL == "" {
		userServiceURL = "localhost:50051"
	}

	planServiceURL := os.Getenv("PLAN_SERVICE_URL")
	if planServiceURL == "" {
		planServiceURL = "localhost:50052"
	}

	// Initialize HTTP handler with service URLs
	httpHandler.NewHTTPHandler(app, userServiceURL, planServiceURL)

	// Get port from environment variable or use default
	PORT := os.Getenv("PORT")
	if PORT == "" {
		PORT = "8080"
	}

	app.Listen(":" + PORT)
}
