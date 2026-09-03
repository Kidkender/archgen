package oauth

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/endpoints"
)

func googleOAuthConfig(cfg *Config) *oauth2.Config {
	return &oauth2.Config{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		Endpoint:     endpoints.Google,
		RedirectURL:  cfg.AppURL + "/api/v1/oauth/google/callback",
		Scopes:       []string{"profile", "email"},
	}
}

func githubOAuthConfig(cfg *Config) *oauth2.Config {
	return &oauth2.Config{
		ClientID:     cfg.GithubClientID,
		ClientSecret: cfg.GithubClientSecret,
		Endpoint:     endpoints.GitHub,
		RedirectURL:  cfg.AppURL + "/api/v1/oauth/github/callback",
		Scopes:       []string{"user:email"},
	}
}

func randomState() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func fetchProfile(client *http.Client, url string) (map[string]interface{}, error) {
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var profile map[string]interface{}
	if err := json.Unmarshal(body, &profile); err != nil {
		return nil, err
	}
	return profile, nil
}

// Routes wires the Google + GitHub OAuth2 authorization-code flow.
// Exchanges the callback code for a token, fetches the provider profile, and
// returns it as JSON — extend this to create/log in a local user as needed.
func Routes(cfg *Config) chi.Router {
	r := chi.NewRouter()
	google := googleOAuthConfig(cfg)
	github := githubOAuthConfig(cfg)

	r.Get("/google", func(w http.ResponseWriter, req *http.Request) {
		http.Redirect(w, req, google.AuthCodeURL(randomState()), http.StatusFound)
	})
	r.Get("/google/callback", func(w http.ResponseWriter, req *http.Request) {
		token, err := google.Exchange(req.Context(), req.URL.Query().Get("code"))
		if err != nil {
			http.Error(w, fmt.Sprintf("oauth exchange failed: %v", err), http.StatusBadGateway)
			return
		}
		profile, err := fetchProfile(google.Client(req.Context(), token), "https://www.googleapis.com/oauth2/v2/userinfo")
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to fetch profile: %v", err), http.StatusBadGateway)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(profile)
	})

	r.Get("/github", func(w http.ResponseWriter, req *http.Request) {
		http.Redirect(w, req, github.AuthCodeURL(randomState()), http.StatusFound)
	})
	r.Get("/github/callback", func(w http.ResponseWriter, req *http.Request) {
		token, err := github.Exchange(req.Context(), req.URL.Query().Get("code"))
		if err != nil {
			http.Error(w, fmt.Sprintf("oauth exchange failed: %v", err), http.StatusBadGateway)
			return
		}
		profile, err := fetchProfile(github.Client(req.Context(), token), "https://api.github.com/user")
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to fetch profile: %v", err), http.StatusBadGateway)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(profile)
	})

	return r
}
