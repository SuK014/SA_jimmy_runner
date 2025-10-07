package handlers

import (
	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/middlewares"
	"github.com/gofiber/fiber/v2"
)

func HandlerUsers(handler HTTPHandler, app *fiber.App) {
	user := app.Group("/users")
	user.Post("/register", handler.CreateUser)
	// user.Get("/get_all", gateway.GetAllUserData)
	// user.Get("/get", gateway.GetByID)
	// user.Put("/update", gateway.UpdateUser)
	// user.Delete("/delete", gateway.DeleteUser)

	// auth := app.Group("/auth")
	// // check to login with token if not pass go to login with password
	// auth.Get("/check_token", middlewares.SetJWtHeaderHandler(), gateway.checkToken)
	// auth.Post("/register", gateway.Register)
	// auth.Post("/login", gateway.Login)
	// auth.Post("/logout", middlewares.SetJWtHeaderHandler(), gateway.Logout)
}
func HandlerPlans(handler HTTPHandler, app *fiber.App) {
	plan := app.Group("/plan")
	plan.Post("/pin", middlewares.SetJWtHeaderHandler(), handler.CreatePin)
	plan.Get("/pin/:id", middlewares.SetJWtHeaderHandler(), handler.GetPinByID)
	plan.Get("/pin/:user_id", middlewares.SetJWtHeaderHandler(), handler.GetPinByParticipant)
}
