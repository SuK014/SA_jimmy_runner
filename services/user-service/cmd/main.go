package main

import (
	"log"
	"net"

	"github.com/SuK014/SA_jimmy_runner/services/user-service/internal/handlers"
	repo "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/repository"
	sv "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/service"
	ds "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/store/datasource"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"
	"google.golang.org/grpc"
)

// Server implements the Greeter service
type userServer struct {
	pb.UnimplementedUserServiceServer
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	// err = godotenv.Load()
	// if err != nil {
	// 	log.Fatal("Error loading .env file")
	// }

	s := grpc.NewServer()
	// pb.RegisterUserServiceServer(s, &userServer{})

	prismadb := ds.ConnectPrisma()
	defer prismadb.PrismaDB.Prisma.Disconnect()

	userRepo := repo.NewUsersRepository(prismadb)
	sv := sv.NewUsersService(userRepo)

	handlers.NewGRPCHandler(s, sv)

	log.Println("Server listening on :50051")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
