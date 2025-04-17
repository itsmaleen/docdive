# Main Standalone Go Server

## Run locally (docker)
```
docker build -t server .
docker run --env-file .env -p 8080:8080 server
```
Using docker watch
```
docker compose watch
```

## Run ngrok (Static Domain)
```
ngrok http --url=blindly-enormous-liger.ngrok-free.app 8080
```

## View Gemini Billing
https://aistudio.google.com/app/plan_information