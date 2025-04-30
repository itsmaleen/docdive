package types

type Page struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	URL      string `json:"url"`
	Markdown string `json:"markdown"`
	Path     string `json:"path"`
}
