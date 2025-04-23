package helpers

import (
	"strings"

	"golang.org/x/net/html"
)

func GetTitleFromHTML(htmlContent string) string {
	doc, err := html.Parse(strings.NewReader(htmlContent))
	if err != nil {
		return ""
	}

	var title string
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode {
			if n.Data == "head" {
				// Only search for title within head tag
				for c := n.FirstChild; c != nil; c = c.NextSibling {
					if c.Type == html.ElementNode && c.Data == "title" && c.FirstChild != nil {
						title = c.FirstChild.Data
						return
					}
				}
			}
		}
		// Continue searching for head tag
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)
	return title
}
