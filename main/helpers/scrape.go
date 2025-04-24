package helpers

import (
	"fmt"
	"regexp"
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
