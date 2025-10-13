package main

import (
	"log"
	"net"
	"path/filepath"

	"github.com/SuK014/SA_jimmy_runner/services/user-service/internal/handlers"
	repo "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/repository"
	sv "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/service"
	ds "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/store/datasource"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"
	"github.com/joho/godotenv"
	"google.golang.org/grpc"
)

// Server implements the Greeter service
type userServer struct {
	pb.UnimplementedUserServiceServer
}

func main() {
	lis, err := net.Listen("tcp", ":50052")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	envPath := filepath.Join("../../../shared/env", ".env") // relative to cmd/main.go
	if err := godotenv.Load(envPath); err != nil {
		log.Fatal("Error loading .env file")
	}

	s := grpc.NewServer()
	// pb.RegisterUserServiceServer(s, &userServer{})

	prismadb := ds.ConnectPrisma()
	defer prismadb.PrismaDB.Prisma.Disconnect()

	userRepo := repo.NewUsersRepository(prismadb)
	sv := sv.NewUsersService(userRepo)

	handlers.NewGRPCHandler(s, sv)

	log.Println("Server listening on :50052")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
