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

	"github.com/mendableai/firecrawl-go"
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
	l.Println("POSTGRES_HOST: ", getenv("POSTGRES_HOST"))
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
	l.Println("postgresPort: ", postgresPort)

	pgsqlConnection, err := ConnectSQL(ctx, getenv("POSTGRES_HOST"), getenv("POSTGRES_USER"), getenv("POSTGRES_PASSWORD"), getenv("POSTGRES_DB"), postgresPort)
	if err != nil {
		l.Printf("error connecting to postgres: %v\n", err)
		return err
	}

	// check if postgres is ready
	// err = pgsqlConnection.Ping(ctx)
	// if err != nil {
	// 	l.Printf("error pinging postgres: %v\n", err)
	// 	return err
	// }

	if getenv("FIRECRAWL_API_KEY") == "" {
		return fmt.Errorf("FIRECRAWL_API_KEY must be set")
	}
	l.Println("FIRECRAWL_API_KEY: ", getenv("FIRECRAWL_API_KEY"))

	firecrawlClient, err := firecrawl.NewFirecrawlApp(getenv("FIRECRAWL_API_KEY"), "https://api.firecrawl.dev")
	if err != nil {
		l.Printf("error creating firecrawl client: %v\n", err)
		return err
	}

	if getenv("TFIDF_HOST") == "" {
		return fmt.Errorf("TFIDF_HOST must be set")
	}

	tfidfService, err := NewTFIDFService(getenv("TFIDF_HOST"))
	if err != nil {
		log.Fatalf("Failed to create TFIDF service: %v", err)
	}
	defer tfidfService.Close()

	srv := Server(l, pgsqlConnection, firecrawlClient, tfidfService.client)

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
