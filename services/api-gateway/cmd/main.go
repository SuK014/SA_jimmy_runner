package main

import (
	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/configuration"
	httpHandler "github.com/SuK014/SA_jimmy_runner/services/api-gateway/handlers"
	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/middlewares"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	// Connect to server
	// conn, err := grpc.Dial("localhost:50051", grpc.WithInsecure())
	// if err != nil {
	// 	log.Fatalf("did not connect: %v", err)
	// }
	// defer conn.Close()

	// c := pb.NewUserServiceClient(conn)

	// Call RPC
	// ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	// defer cancel()

	// // r, err := c.SayHello(ctx, &pb.HelloRequest{Name: "Wutthichod"})

	// r ,err := c.CreateUser(ctx,)
	// if err != nil {
	// 	log.Fatalf("could not greet: %v", err)
	// }
	// log.Printf("Greeting: %s", r.GetMessage())

	// // // remove this before deploy ###################
	// err = godotenv.Load()
	// if err != nil {
	// 	log.Fatal("Error loading .env file")
	// }
	// /// ############################################

	app := fiber.New(configuration.NewFiberConfiguration())
	middlewares.Logger(app)
	app.Use(recover.New())
	app.Use(cors.New())

	// userClient, err := userclient.NewUserServiceClient()
	httpHandler.NewHTTPHandler(app, "localhost:50051")

	// PORT := os.Getenv("PORT")
	PORT := "8080"

	if PORT == "" {
		PORT = "8080"
	}

	app.Listen(":" + PORT)
}
