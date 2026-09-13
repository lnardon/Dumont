package auth

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type SetupRequest struct {
	Username        string `json:"username"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirm_password"`
}

type Credentials struct {
	Username     string `json:"username"`
	PasswordHash string `json:"password_hash"`
	SigningKey   string `json:"signing_key"`
}
