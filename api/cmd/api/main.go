package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/warui/event-ticketing-api/internal/config"
	"github.com/warui/event-ticketing-api/internal/database"
	"github.com/warui/event-ticketing-api/internal/middleware"
	"github.com/warui/event-ticketing-api/internal/routes"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Load configuration...
	cfg := config.LoadConfig()

	// Initialize database
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Run migrations
	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Set Gin mode
	gin.SetMode(cfg.GinMode)

	// Initialize router
	router := gin.New()

	// Global middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORS())
	router.Use(middleware.ErrorHandler())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Event Ticketing API is running",
		})
	})

	// Initialize routes
	routes.SetupRoutes(router, db, cfg)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
