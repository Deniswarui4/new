package database

import (
	"fmt"
	"log"

	"github.com/warui/event-ticketing-api/internal/config"
	"github.com/warui/event-ticketing-api/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func InitDB(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connection established successfully")
	return db, nil
}

func RunMigrations(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// Enable UUID extension
	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
		return fmt.Errorf("failed to create uuid extension: %w", err)
	}

	// Auto migrate all models
	err := db.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Event{},
		&models.TicketType{},
		&models.Ticket{},
		&models.Transaction{},
		&models.PlatformSettings{},
		&models.WithdrawalRequest{},
		&models.OrganizerBalance{},
	)
	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Create default platform settings if not exists
	var count int64
	db.Model(&models.PlatformSettings{}).Count(&count)
	if count == 0 {
		defaultSettings := &models.PlatformSettings{
			PlatformFeePercentage:   5.0,
			WithdrawalFeePercentage: 2.5,
			MinWithdrawalAmount:     1000.0,
			Currency:                "NGN",
		}
		if err := db.Create(defaultSettings).Error; err != nil {
			return fmt.Errorf("failed to create default platform settings: %w", err)
		}
		log.Println("Default platform settings created")
	}

	// Create default categories if not exists
	var categoryCount int64
	db.Model(&models.Category{}).Count(&categoryCount)
	if categoryCount == 0 {
		defaultCategories := []models.Category{
			{Name: "Music", Description: "Concerts, festivals, and live music performances", Color: "#EF4444", Icon: "🎵", IsActive: true},
			{Name: "Sports", Description: "Sporting events, matches, and competitions", Color: "#3B82F6", Icon: "⚽", IsActive: true},
			{Name: "Technology", Description: "Tech conferences, hackathons, and workshops", Color: "#8B5CF6", Icon: "💻", IsActive: true},
			{Name: "Business", Description: "Business conferences, seminars, and networking", Color: "#10B981", Icon: "💼", IsActive: true},
			{Name: "Arts & Culture", Description: "Art exhibitions, theater, and cultural events", Color: "#F59E0B", Icon: "🎨", IsActive: true},
			{Name: "Food & Drink", Description: "Food festivals, wine tasting, and culinary events", Color: "#EC4899", Icon: "🍽️", IsActive: true},
			{Name: "Education", Description: "Workshops, training, and educational seminars", Color: "#06B6D4", Icon: "📚", IsActive: true},
			{Name: "Health & Wellness", Description: "Fitness events, yoga, and wellness workshops", Color: "#84CC16", Icon: "🧘", IsActive: true},
			{Name: "Entertainment", Description: "Comedy shows, movie screenings, and entertainment", Color: "#F97316", Icon: "🎭", IsActive: true},
			{Name: "Other", Description: "Other events and gatherings", Color: "#6B7280", Icon: "📌", IsActive: true},
		}
		
		for _, category := range defaultCategories {
			if err := db.Create(&category).Error; err != nil {
				log.Printf("Warning: Failed to create category %s: %v", category.Name, err)
			}
		}
		log.Println("Default categories created")
	}

	// Run data migrations
	if err := runDataMigrations(db); err != nil {
		return fmt.Errorf("failed to run data migrations: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// runDataMigrations handles data cleanup and transformations
func runDataMigrations(db *gorm.DB) error {
	log.Println("Running data migrations...")

	// Migration 1: Fix payment_metadata empty strings
	// This is needed because JSONB columns cannot store empty strings
	// We temporarily change the column type to text, fix the data, then change back to jsonb
	
	// Step 1: Change column to text (allows us to query empty strings)
	if err := db.Exec(`ALTER TABLE transactions ALTER COLUMN payment_metadata TYPE text`).Error; err != nil {
		log.Printf("Warning: Could not change payment_metadata to text: %v", err)
		// Continue anyway, might already be fixed
	} else {
		// Step 2: Update empty strings to NULL
		result := db.Exec(`UPDATE transactions SET payment_metadata = NULL WHERE payment_metadata = ''`)
		if result.Error != nil {
			log.Printf("Warning: Failed to update payment_metadata: %v", result.Error)
		} else if result.RowsAffected > 0 {
			log.Printf("Fixed %d transaction records with invalid payment_metadata", result.RowsAffected)
		}
		
		// Step 3: Change column back to jsonb
		if err := db.Exec(`ALTER TABLE transactions ALTER COLUMN payment_metadata TYPE jsonb USING payment_metadata::jsonb`).Error; err != nil {
			log.Printf("Warning: Could not change payment_metadata back to jsonb: %v", err)
		}
	}

	// Migration 2: Ensure payment_metadata column allows NULL and has no invalid default
	db.Exec(`ALTER TABLE transactions ALTER COLUMN payment_metadata DROP DEFAULT`)
	// Ignore errors as the column might not have a default

	log.Println("Data migrations completed")
	return nil
}
