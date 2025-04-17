package helpers

import "fmt"

func ConvertToVector(embedding []float32) string {
	vectorStr := "["
	for i, v := range embedding {
		if i > 0 {
			vectorStr += ","
		}
		vectorStr += fmt.Sprintf("%f", v)
	}
	vectorStr += "]"
	return vectorStr
}
