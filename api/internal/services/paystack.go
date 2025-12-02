package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"time"

	"github.com/warui/event-ticketing-api/internal/config"
)

type PaystackService struct {
	cfg        *config.Config
	httpClient *http.Client
	baseURL    string
}

type PaystackInitializeRequest struct {
	Email       string                 `json:"email"`
	Amount      int                    `json:"amount"` // Amount in kobo (smallest currency unit)
	Reference   string                 `json:"reference"`
	CallbackURL string                 `json:"callback_url,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

type PaystackInitializeResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		AuthorizationURL string `json:"authorization_url"`
		AccessCode       string `json:"access_code"`
		Reference        string `json:"reference"`
	} `json:"data"`
}

type PaystackVerifyResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		ID            int64                  `json:"id"`
		Domain        string                 `json:"domain"`
		Status        string                 `json:"status"`
		Reference     string                 `json:"reference"`
		Amount        int                    `json:"amount"`
		PaidAt        time.Time              `json:"paid_at"`
		CreatedAt     time.Time              `json:"created_at"`
		Channel       string                 `json:"channel"`
		Currency      string                 `json:"currency"`
		IPAddress     string                 `json:"ip_address"`
		Metadata      map[string]interface{} `json:"metadata"`
		Customer      map[string]interface{} `json:"customer"`
		Authorization map[string]interface{} `json:"authorization"`
	} `json:"data"`
}

func NewPaystackService(cfg *config.Config) *PaystackService {
	// Create HTTP client with better timeout configuration
	return &PaystackService{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 15 * time.Second, // Reduced from 30s to fail faster
			Transport: &http.Transport{
				DialContext: (&net.Dialer{
					Timeout:   5 * time.Second,  // Connection timeout
					KeepAlive: 30 * time.Second, // Keep-alive duration
				}).DialContext,
				TLSHandshakeTimeout:   5 * time.Second, // TLS handshake timeout
				ResponseHeaderTimeout: 5 * time.Second, // Response header timeout
				ExpectContinueTimeout: 1 * time.Second,
				MaxIdleConns:          10, // Connection pooling
				MaxIdleConnsPerHost:   5,
				IdleConnTimeout:       30 * time.Second,
			},
		},
		baseURL: "https://api.paystack.co",
	}
}

// InitializeTransaction initializes a payment transaction
func (p *PaystackService) InitializeTransaction(email string, amount float64, reference string, metadata map[string]interface{}) (*PaystackInitializeResponse, error) {
	if p.cfg.PaystackSecretKey == "" {
		return nil, fmt.Errorf("paystack not configured")
	}

	// Convert amount to kobo (smallest unit)
	amountInKobo := int(amount * 100)

	reqBody := PaystackInitializeRequest{
		Email:       email,
		Amount:      amountInKobo,
		Reference:   reference,
		CallbackURL: p.cfg.PaystackCallbackURL,
		Metadata:    metadata,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", p.baseURL+"/transaction/initialize", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+p.cfg.PaystackSecretKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result PaystackInitializeResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if !result.Status {
		return nil, fmt.Errorf("paystack error: %s", result.Message)
	}

	return &result, nil
}

// VerifyTransaction verifies a payment transaction
func (p *PaystackService) VerifyTransaction(reference string) (*PaystackVerifyResponse, error) {
	if p.cfg.PaystackSecretKey == "" {
		return nil, fmt.Errorf("paystack not configured")
	}

	req, err := http.NewRequest("GET", p.baseURL+"/transaction/verify/"+reference, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+p.cfg.PaystackSecretKey)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result PaystackVerifyResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if !result.Status {
		return nil, fmt.Errorf("paystack error: %s", result.Message)
	}

	return &result, nil
}

// IsTransactionSuccessful checks if a transaction was successful
func (p *PaystackService) IsTransactionSuccessful(verification *PaystackVerifyResponse) bool {
	return verification.Status && verification.Data.Status == "success"
}

// GetTransactionAmount returns the transaction amount in main currency unit
func (p *PaystackService) GetTransactionAmount(verification *PaystackVerifyResponse) float64 {
	return float64(verification.Data.Amount) / 100.0
}
