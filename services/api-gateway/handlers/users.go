package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/middlewares"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"

	"github.com/gofiber/fiber/v2"
)

// CreateUser handles REST requests and forwards them to gRPC
func (h *HTTPHandler) CreateUser(ctx *fiber.Ctx) error {
	fmt.Println("access gateway func")
	bodyData := entities.CreatedUserModel{}
	if err := ctx.BodyParser(&bodyData); err != nil {
		return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
			entities.ResponseMessage{Message: "invalid json body"},
		)
	}

	if bodyData.Email == "" || bodyData.Password == "" {
		return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
			entities.ResponseMessage{Message: "email and password are required"},
		)
	}

	req := &pb.CreateUserRequest{
		Email:       bodyData.Email,
		DisplayName: bodyData.Name,
		Password:    bodyData.Password,
	}

	res, err := h.userClient.CreateUser(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot insert new user account: " + err.Error()},
		)
	}

	tokenDetail, err := middlewares.GenerateJWTToken(res.UserId)
	if err != nil {
		return fmt.Errorf("failed to generate token: %w", err)
	}

	//tmp: change config later
	ctx.Cookie(&fiber.Cookie{
		Name:     "cookies",
		Value:    *tokenDetail.Token,
		Expires:  time.Now().Add(24 * time.Hour), // expires in 1 day
		HTTPOnly: true,                           // not accessible via JavaScript
		Secure:   true,                           // only sent over HTTPS
		Path:     "/",
	})

	fmt.Println("set cookies success")

	return ctx.Status(fiber.StatusOK).JSON(
		entities.ResponseModel{Message: "success"},
	)
}
