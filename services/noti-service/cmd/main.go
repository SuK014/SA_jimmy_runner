package main

import (
	"fmt"
	"log"

	ds "github.com/SuK014/SA_jimmy_runner/services/noti-service/internal/store/datasources"
	"github.com/joho/godotenv"
)

func main() {
	// // // remove this before deploy ###################
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	// /// ############################################

	mongodb := ds.NewMongoDB(10)
	fmt.Println(mongodb)
}
