package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/configuration"
	httpHandler "github.com/SuK014/SA_jimmy_runner/services/api-gateway/handlers"
	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/middlewares"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file for local development (optional in Kubernetes)
	envPath := filepath.Join("../../../shared/env", ".env")
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("⚠️  No .env file found at %s, using system environment variables", envPath)
	} else {
		log.Printf("✅ Loaded .env from %s", envPath)
	}

	app := fiber.New(configuration.NewFiberConfiguration())
	middlewares.Logger(app)
	app.Use(recover.New())
	// app.Use(cors.New())
	// TEST
	// tmp: change back later
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000", // Specific origin, not wildcard
		AllowCredentials: true,                    // Required when withCredentials is true
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
	}))

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

	log.Printf("🚀 Starting API Gateway on port %s...", PORT)
	app.Listen(":" + PORT)
}
