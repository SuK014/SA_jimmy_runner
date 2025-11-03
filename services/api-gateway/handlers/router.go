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

	userTrip := app.Group("/userTrip")
	userTrip.Post("/", middlewares.SetJWtHeaderHandler(), handler.AddUsersToTrip)
	userTrip.Get("/trips", middlewares.SetJWtHeaderHandler(), handler.GetTripsByUserID)
	userTrip.Put("/name", middlewares.SetJWtHeaderHandler(), handler.UpdateUsername)
	userTrip.Get("/avatars", middlewares.SetJWtHeaderHandler(), handler.GetTripUsersAvatar)
}
func HandlerPlans(handler HTTPHandler, app *fiber.App) {
	plan := app.Group("/plan")

	pin := plan.Group("/pin")
	pin.Post("/", middlewares.SetJWtHeaderHandler(), handler.CreatePin) // auto add to whiteboard
	pin.Get("/", middlewares.SetJWtHeaderHandler(), handler.GetPinByID)
	pin.Get("/participants", middlewares.SetJWtHeaderHandler(), handler.GetPinByParticipant)
	pin.Put("/", middlewares.SetJWtHeaderHandler(), handler.UpdatePinByID)
	pin.Put("/image", middlewares.SetJWtHeaderHandler(), handler.UpdatePinImageByID)
	pin.Delete("/", middlewares.SetJWtHeaderHandler(), handler.DeletePinByID) // auto remove from whiteboard

	whiteboard := plan.Group("/whiteboard")
	whiteboard.Post("/", middlewares.SetJWtHeaderHandler(), handler.CreateWhiteboard) // create one default pin and auto add to trip
	whiteboard.Get("/", middlewares.SetJWtHeaderHandler(), handler.GetWhiteboardByID)
	whiteboard.Put("/", middlewares.SetJWtHeaderHandler(), handler.UpdateWhiteboardByID)
	whiteboard.Delete("/", middlewares.SetJWtHeaderHandler(), handler.DeleteWhiteboardByID) // auto delete pin and auto remove from trip

	trip := plan.Group("/trip")
	trip.Post("/", middlewares.SetJWtHeaderHandler(), handler.CreateTrip) // create one default whiteboard
	trip.Get("/", middlewares.SetJWtHeaderHandler(), handler.GetTripByID)
	trip.Put("/", middlewares.SetJWtHeaderHandler(), handler.UpdateTripByID)
	trip.Put("/image", middlewares.SetJWtHeaderHandler(), handler.UpdateTripImageByID)
	trip.Delete("/", middlewares.SetJWtHeaderHandler(), handler.DeleteTripByID) // auto delete whiteboard and pin
}
