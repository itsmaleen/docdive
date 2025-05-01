package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"time"
)

func main() {
	ctx := context.Background()

	getenv := func(key string) string {
		return os.Getenv(key)
	}

	if err := run(ctx, os.Args, getenv); err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, args []string, getenv func(string) string) error {
	ctx, cancel := signal.NotifyContext(ctx, os.Interrupt)
	defer cancel()

	l := log.New(os.Stdout, "Server ", log.LstdFlags)

	if getenv("POSTGRES_HOST") == "" {
		return fmt.Errorf("POSTGRES_HOST must be set")
	}
	if getenv("POSTGRES_USER") == "" {
		return fmt.Errorf("POSTGRES_USER must be set")
	}
	if getenv("POSTGRES_PASSWORD") == "" {
		return fmt.Errorf("POSTGRES_PASSWORD must be set")
	}
	if getenv("POSTGRES_DB") == "" {
		return fmt.Errorf("POSTGRES_DB must be set")
	}
	if getenv("POSTGRES_PORT") == "" {
		return fmt.Errorf("POSTGRES_PORT must be set")
	}
	// convert POSTGRES_PORT to int
	postgresPort, err := strconv.Atoi(getenv("POSTGRES_PORT"))
	if err != nil {
		return fmt.Errorf("POSTGRES_PORT must be a number")
	}

	pgsqlConnection, err := ConnectSQL(ctx, getenv("POSTGRES_HOST"), getenv("POSTGRES_USER"), getenv("POSTGRES_PASSWORD"), getenv("POSTGRES_DB"), postgresPort)
	if err != nil {
		l.Printf("error connecting to postgres: %v\n", err)
		return err
	}

	if getenv("RAG_TOOLS_HOST") == "" {
		return fmt.Errorf("RAG_TOOLS_HOST must be set")
	}

	ragToolsService, err := NewRAGToolsService(getenv("RAG_TOOLS_HOST"))
	if err != nil {
		l.Printf("error creating RAGToolsService: %v\n", err)
		return err
	}

	geminiApiKey := getenv("GEMINI_API_KEY")
	if geminiApiKey == "" {
		return fmt.Errorf("GEMINI_API_KEY must be set")
	}

	supabaseURL := getenv("SUPABASE_URL")
	if supabaseURL == "" {
		return fmt.Errorf("SUPABASE_URL must be set")
	}
	supabaseAnonKey := getenv("SUPABASE_ANON_KEY")
	if supabaseAnonKey == "" {
		return fmt.Errorf("SUPABASE_ANON_KEY must be set")
	}
	supabaseStorageBucket := getenv("SUPABSE_STORAGE_BUCKET")
	if supabaseStorageBucket == "" {
		supabaseStorageBucket = "pages"
	}

	srv := Server(l, pgsqlConnection, ragToolsService.Client, geminiApiKey, supabaseURL, supabaseAnonKey, supabaseStorageBucket)

	httpServer := &http.Server{
		Addr:    net.JoinHostPort("0.0.0.0", "8080"),
		Handler: srv,
	}
	go func() {
		log.Printf("Started fabric server on %s\n", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Fprintf(os.Stderr, "error listening and serving: %s\n", err)
		}
	}()
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		<-ctx.Done()
		// make a new context for the Shutdown (thanks Alessandro Rosetti)
		shutdownCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
		defer cancel()
		defer pgsqlConnection.Close()
		if err := httpServer.Shutdown(shutdownCtx); err != nil {
			fmt.Fprintf(os.Stderr, "error shutting down http server: %s\n", err)
		}
	}()
	wg.Wait()
	return nil
}
