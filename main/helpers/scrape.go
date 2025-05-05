package helpers

import (
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/itsmaleen/tech-doc-processor/types"
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

func CleanMarkdownByStartingFromTitle(markdown string, title string) string {
	lines := strings.Split(markdown, "\n")
	for i, line := range lines {
		if strings.Contains(line, title) {
			return strings.Join(lines[i:], "\n")
		}
	}
	return markdown
}

func GetHTMLFromMarkdown(markdown string) string {
	// Split the markdown into lines
	lines := strings.Split(markdown, "\n")
	var html strings.Builder

	// Process each line
	for i := 0; i < len(lines); i++ {
		line := lines[i]

		// Skip empty lines
		if strings.TrimSpace(line) == "" {
			continue
		}

		// Handle headers
		if strings.HasPrefix(line, "#") {
			level := 0
			for i := 0; i < len(line) && line[i] == '#'; i++ {
				level++
			}
			if level <= 6 {
				content := strings.TrimSpace(line[level:])
				html.WriteString(fmt.Sprintf("<h%d>%s</h%d>", level, content, level))
				continue
			}
		}

		// Handle links [text](url)
		linkRegex := regexp.MustCompile(`\[([^\]]+)\]\(([^)]+)\)`)
		line = linkRegex.ReplaceAllString(line, `<a href="$2">$1</a>`)

		// Handle bold **text**
		boldRegex := regexp.MustCompile(`\*\*([^*]+)\*\*`)
		line = boldRegex.ReplaceAllString(line, `<strong>$1</strong>`)

		// Handle italic *text*
		italicRegex := regexp.MustCompile(`\*([^*]+)\*`)
		line = italicRegex.ReplaceAllString(line, `<em>$1</em>`)

		// Handle code blocks ```
		if strings.HasPrefix(line, "```") {
			// Start of code block
			html.WriteString("<pre><code>")
			i++
			// Collect code block content
			for i < len(lines) && !strings.HasPrefix(lines[i], "```") {
				html.WriteString(lines[i] + "")
				i++
			}
			html.WriteString("</code></pre>")
			continue
		}

		// Handle inline code `code`
		codeRegex := regexp.MustCompile("`([^`]+)`")
		line = codeRegex.ReplaceAllString(line, `<code>$1</code>`)

		// Handle lists
		if strings.HasPrefix(line, "- ") || strings.HasPrefix(line, "* ") {
			html.WriteString("<ul>")
			for i < len(lines) && (strings.HasPrefix(lines[i], "- ") || strings.HasPrefix(lines[i], "* ")) {
				content := strings.TrimSpace(lines[i][2:])
				html.WriteString(fmt.Sprintf("<li>%s</li>", content))
				i++
			}
			html.WriteString("</ul>")
			continue
		}

		// Handle numbered lists
		if regexp.MustCompile(`^\d+\.`).MatchString(line) {
			html.WriteString("<ol>")
			for i < len(lines) && regexp.MustCompile(`^\d+\.`).MatchString(lines[i]) {
				content := strings.TrimSpace(regexp.MustCompile(`^\d+\.`).ReplaceAllString(lines[i], ""))
				html.WriteString(fmt.Sprintf("<li>%s</li>", content))
				i++
			}
			html.WriteString("</ol>")
			continue
		}

		// Handle blockquotes
		if strings.HasPrefix(line, ">") {
			html.WriteString("<blockquote>")
			for i < len(lines) && strings.HasPrefix(lines[i], ">") {
				content := strings.TrimSpace(lines[i][1:])
				html.WriteString(fmt.Sprintf("<p>%s</p>", content))
				i++
			}
			html.WriteString("</blockquote>")
			continue
		}

		// Handle horizontal rules
		if strings.TrimSpace(line) == "---" || strings.TrimSpace(line) == "***" {
			html.WriteString("<hr>")
			continue
		}

		// Default to paragraph
		html.WriteString(fmt.Sprintf("<p>%s</p>", line))
	}

	return html.String()
}

func GetURLsFromHTML(logger *log.Logger, htmlContent string, baseURL string) []string {
	doc, err := html.Parse(strings.NewReader(htmlContent))
	if err != nil {
		logger.Printf("Failed to parse HTML: %v", err)
		return []string{}
	}
	// Double check that the baseURL doesn't already have a trailing slash
	if !strings.HasSuffix(baseURL, "/") {
		baseURL = baseURL + "/"
	}

	var urls []string
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "a" {
			for _, attr := range n.Attr {
				if attr.Key == "href" {
					url := attr.Val
					// Remove fragment (everything after #)
					if idx := strings.Index(url, "#"); idx != -1 {
						url = url[:idx]
					}
					// Remove query parameters (everything after ?)
					if idx := strings.Index(url, "?"); idx != -1 {
						url = url[:idx]
					}

					// Skip if URL already has a protocol or is empty
					if strings.HasPrefix(url, "http") || url == "" {
						logger.Printf("Skipping URL - has protocol or is empty")
						continue
					}

					// Add baseURL for relative paths
					if strings.HasPrefix(url, "/") {
						url = baseURL + url
					} else if !strings.Contains(url, "://") {
						url = baseURL + url
					}
					urls = append(urls, url)
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)
	return urls
}

func GetUrlsFromSitemap(logger *log.Logger, parsedURL *url.URL) ([]string, error) {
	// Construct the sitemap URL
	sitemapURL := fmt.Sprintf("%s://%s/sitemap.xml", parsedURL.Scheme, parsedURL.Host)
	logger.Printf("Fetching sitemap from: %s", sitemapURL)

	// Fetch the sitemap
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	resp, err := client.Get(sitemapURL)
	if err != nil {
		logger.Printf("Failed to fetch sitemap: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	// Read the sitemap content
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Printf("Failed to read sitemap: %v", err)
		return nil, err
	}

	var urls []string
	if strings.Contains(string(body), "<sitemapindex") {
		// This is a sitemap index
		var sitemapIndex types.SitemapIndex
		err = xml.Unmarshal(body, &sitemapIndex)
		if err != nil {
			logger.Printf("Failed to parse sitemap index: %v", err)
			return nil, err
		}

		// Process each sitemap in the index
		for _, sitemap := range sitemapIndex.Sitemaps {
			// Fetch the individual sitemap
			sitemapResp, err := client.Get(sitemap.Loc)
			if err != nil {
				logger.Printf("Failed to fetch sitemap %s: %v", sitemap.Loc, err)
				continue
			}

			sitemapBody, err := io.ReadAll(sitemapResp.Body)
			sitemapResp.Body.Close()
			if err != nil {
				logger.Printf("Failed to read sitemap %s: %v", sitemap.Loc, err)
				continue
			}

			// Parse the individual sitemap
			var urlSet types.URLSet
			err = xml.Unmarshal(sitemapBody, &urlSet)
			if err != nil {
				logger.Printf("Failed to parse sitemap %s: %v", sitemap.Loc, err)
				continue
			}

			// Extract URLs from the sitemap
			for _, u := range urlSet.URLs {
				urls = append(urls, u.Loc)
			}
		}
	} else {
		// This is a regular sitemap
		var urlSet types.URLSet
		err = xml.Unmarshal(body, &urlSet)
		if err != nil {
			logger.Printf("Failed to parse sitemap: %v", err)
			logger.Printf("Sitemap content: %s", string(body))
			return nil, err
		}

		// Extract URLs from the sitemap
		for _, u := range urlSet.URLs {
			urls = append(urls, u.Loc)
		}
	}
	return urls, nil
}
