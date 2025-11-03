package handlers

import (
	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/middlewares"
	"github.com/gofiber/fiber/v2"
)

func HandlerUsers(handler HTTPHandler, app *fiber.App) {
	user := app.Group("/users")
	user.Post("/register", handler.CreateUser)
	// user.Get("/get_all", handler.GetAllUserData)
	// user.Get("/get", handler.GetByID)
	user.Put("/update", middlewares.SetJWtHeaderHandler(), handler.UpdateUser)
	user.Get("/", middlewares.SetJWtHeaderHandler(), handler.GetUser)
	user.Delete("/", middlewares.SetJWtHeaderHandler(), handler.DeleteUser)

	// auth := app.Group("/auth")
	// // check to login with token if not pass go to login with password
	// auth.Get("/check_token", middlewares.SetJWtHeaderHandler(), handler.checkToken)
	// auth.Post("/register", handler.Register)
	user.Post("/login", handler.Login)
	// auth.Post("/logout", middlewares.SetJWtHeaderHandler(), handler.Logout)
}
func HandlerPlans(handler HTTPHandler, app *fiber.App) {
	plan := app.Group("/plan")
	plan.Post("/pin", middlewares.SetJWtHeaderHandler(), handler.CreatePin)
	plan.Get("/pin", middlewares.SetJWtHeaderHandler(), handler.GetPinByID)
	plan.Get("/pin/participants", middlewares.SetJWtHeaderHandler(), handler.GetPinByParticipant)
	plan.Get("/participants", middlewares.SetJWtHeaderHandler(), handler.GetParticipantsByPinID)
	plan.Put("/pin", middlewares.SetJWtHeaderHandler(), handler.UpdatePinByID)
	plan.Put("/pin/image", middlewares.SetJWtHeaderHandler(), handler.UpdatePinImageByID)
}
