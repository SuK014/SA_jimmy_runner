package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
)

func CheckUserFolder(userID string) ([]string, error) {
	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_KEY")
	bucketName := "user-profile"

	listUrl := fmt.Sprintf("%s/storage/v1/object/list/%s", supabaseUrl, bucketName)
	body, _ := json.Marshal(map[string]string{"prefix": userID + "/"})

	req, _ := http.NewRequest("POST", listUrl, bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+supabaseKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("failed to list files: %s", resp.Status)
	}

	var files []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&files); err != nil {
		return nil, err
	}

	var fileNames []string
	for _, f := range files {
		if name, ok := f["name"].(string); ok {
			fileNames = append(fileNames, name)
		}
	}

	return fileNames, nil
}

func DeleteUserPictures(userID string) error {
	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_KEY")
	bucketName := "user-profile"

	fileNames, err := CheckUserFolder(userID)
	if err != nil {
		return err
	}

	for _, name := range fileNames {
		deleteUrl := fmt.Sprintf("%s/storage/v1/object/%s/%s/%s", supabaseUrl, bucketName, userID, name)
		req, _ := http.NewRequest("DELETE", deleteUrl, nil)
		req.Header.Set("Authorization", "Bearer "+supabaseKey)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return err
		}
		resp.Body.Close()
	}

	return nil
}

func UploadToSupabase(fileData []byte, filename, contentType, userID string) (string, error) {
	// Optional: delete previous picture
	if err := DeleteUserPictures(userID); err != nil {
		fmt.Println("⚠️ Warning: could not delete old pictures:", err)
	}

	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_KEY")
	bucketName := "user-profile"

	cleanName := sanitizeFileName(filename)
	filePath := fmt.Sprintf("%s/%s", userID, cleanName)

	// Upload URL
	uploadUrl := fmt.Sprintf("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, filePath)

	// Build request
	req, err := http.NewRequest("PUT", uploadUrl, bytes.NewReader(fileData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+supabaseKey)
	req.Header.Set("Content-Type", contentType)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("upload failed: %s: %s", resp.Status, string(body))
	}

	publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", supabaseUrl, bucketName, filePath)

	return publicURL, nil
}

func sanitizeFileName(filename string) string {
	// Trim spaces at start/end
	filename = strings.TrimSpace(filename)

	// Replace spaces with underscores
	filename = strings.ReplaceAll(filename, " ", "_")

	// Remove special characters (keep letters, numbers, dots, underscores, hyphens)
	reg := regexp.MustCompile(`[^a-zA-Z0-9._-]`)
	filename = reg.ReplaceAllString(filename, "")

	return filename
}
