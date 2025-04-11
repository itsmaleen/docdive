package main

import (
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Server(
	logger *log.Logger,
	pgxConn *pgxpool.Pool,
) http.Handler {
	mux := http.NewServeMux()
	addRoutes(mux, logger, pgxConn)

	var handler http.Handler = mux
	// add middleware if needed
	return handler
}
