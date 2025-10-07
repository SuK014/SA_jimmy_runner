package middlewares

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/SuK014/SA_jimmy_runner/shared/entities"

	jwtware "github.com/gofiber/contrib/jwt"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func SetJWtHeaderHandler() fiber.Handler {
	return jwtware.New(jwtware.Config{
		SigningKey: jwtware.SigningKey{
			//ตัว secret key ดึงมาจาก .env
			Key: []byte(os.Getenv("JWT_SECRET_KEY")),
			//algorithm ที่เลือกใช้
			JWTAlg: jwtware.HS256,
		},
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusUnauthorized).JSON(entities.ResponseMessage{Message: "Unauthorization Token."})
		},
	})
}

type TokenDetails struct {
	Token     *string `json:"token"`
	UserID    string  `json:"user_id"`
	UID       string  `json:"uid"`
	ExpiresIn *int64  `json:"exp"`
	Username  string  `json:"username"` // added for JWT tutorial
}

func DecodeJWTToken(ctx *fiber.Ctx) (*TokenDetails, error) {
	//สร้างตัวแปรไว้เก็บข้อมูลที่ decode มาจาก token
	td := &TokenDetails{
		Token: new(string),
	}

	//ดึง token มาเก็บในตัวแปรtoken
	token, status := ctx.Locals("user").(*jwt.Token)
	if !status {
		return nil, ctx.Status(http.StatusUnauthorized).SendString("Unauthorization Token.")
	}

	//ดึง payload มาจาก token เก็บไว้ที่ claims(ประเภท map)
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, ctx.Status(http.StatusUnauthorized).SendString("Unauthorization Token.")
	}

	//นำ payload(claims) ที่ปัจจุบันเป็น map มาเก็บไว้ใน td ที่เราสร้างไว้ในตอนแรก
	for key, value := range claims {
		if key == "user_id" || key == "sub" {
			td.UserID = value.(string)
		}
		if key == "uid" {
			td.UID = value.(string)
		}
		if key == "username" { // added for JWT tutorial
			td.Username = value.(string)
		}
	}
	*td.Token = token.Raw
	return td, nil
}

func GenerateJWTToken(userID string, uuID string, username string) (*TokenDetails, error) {
	now := time.Now().UTC()

	// สร้าง td มาเก็บ token ที่กำลังจะสร้าง
	td := &TokenDetails{
		ExpiresIn: new(int64),
		Token:     new(string),
	}

	//ระบุอายุใช้งาน token (ใน template นี้คือ 6 ชั่วโมง)
	*td.ExpiresIn = now.Add(time.Hour * 6).Unix()

	//กำหนดค่าของส่วน payload ใน token
	td.UserID = userID
	td.UID = uuID
	td.Username = username // add

	//ส่วนของ signature
	SigningKey := []byte(os.Getenv("JWT_SECRET_KEY"))

	//สร้าง payload
	atClaims := make(jwt.MapClaims)
	atClaims["user_id"] = userID
	atClaims["username"] = username // added for JWT tutorial
	atClaims["uid"] = uuID
	atClaims["exp"] = time.Now().Add(time.Hour * 6).Unix()
	atClaims["iat"] = time.Now().Unix()
	atClaims["nbf"] = time.Now().Unix()

	log.Println("New claims: ", atClaims)

	//สร้าง token
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, atClaims).SignedString(SigningKey)
	if err != nil {
		return nil, fmt.Errorf("create: sign token: %w", err)
	}

	*td.Token = token
	return td, nil
}
