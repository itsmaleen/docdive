package main

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

func ConnectSQL(
	ctx context.Context,
	host, user, password, dbname string,
	port int) (*pgxpool.Pool, error) {
	pgsqlConn := fmt.Sprintf("postgresql://%s:%s@%s:%d/%s?sslmode=disable", user, password, host, port, dbname)

	dbpool, err := pgxpool.New(ctx, pgsqlConn)
	if err != nil {
		return nil, err
	}

	return dbpool, err
}
