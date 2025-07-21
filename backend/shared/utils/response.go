package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIResponse represents a standard API response structure
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
}

// APIError represents error details
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// Meta represents metadata for pagination, etc.
type Meta struct {
	Page       int `json:"page,omitempty"`
	PerPage    int `json:"per_page,omitempty"`
	Total      int `json:"total,omitempty"`
	TotalPages int `json:"total_pages,omitempty"`
}

// Success sends a successful response
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
	})
}

// SuccessWithMeta sends a successful response with metadata
func SuccessWithMeta(c *gin.Context, data interface{}, meta *Meta) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
		Meta:    meta,
	})
}

// Created sends a 201 Created response
func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, APIResponse{
		Success: true,
		Data:    data,
	})
}

// BadRequest sends a 400 Bad Request response
func BadRequest(c *gin.Context, message string, details ...string) {
	errorDetails := ""
	if len(details) > 0 {
		errorDetails = details[0]
	}
	
	c.JSON(http.StatusBadRequest, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    "BAD_REQUEST",
			Message: message,
			Details: errorDetails,
		},
	})
}

// Unauthorized sends a 401 Unauthorized response
func Unauthorized(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    "UNAUTHORIZED",
			Message: message,
		},
	})
}

// Forbidden sends a 403 Forbidden response
func Forbidden(c *gin.Context, message string) {
	c.JSON(http.StatusForbidden, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    "FORBIDDEN",
			Message: message,
		},
	})
}

// NotFound sends a 404 Not Found response
func NotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    "NOT_FOUND",
			Message: message,
		},
	})
}

// Conflict sends a 409 Conflict response
func Conflict(c *gin.Context, message string) {
	c.JSON(http.StatusConflict, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    "CONFLICT",
			Message: message,
		},
	})
}

// InternalError sends a 500 Internal Server Error response
func InternalError(c *gin.Context, message string, details ...string) {
	errorDetails := ""
	if len(details) > 0 {
		errorDetails = details[0]
	}
	
	c.JSON(http.StatusInternalServerError, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    "INTERNAL_ERROR",
			Message: message,
			Details: errorDetails,
		},
	})
}

// ValidationError sends a 422 Unprocessable Entity response
func ValidationError(c *gin.Context, message string, details string) {
	c.JSON(http.StatusUnprocessableEntity, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    "VALIDATION_ERROR",
			Message: message,
			Details: details,
		},
	})
}