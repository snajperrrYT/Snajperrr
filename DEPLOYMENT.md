PL: Instrukcja wdrożenia na Google Cloud Run

1) Ustawienia początkowe
- Projekt GCP: ustaw w konsoli GCP lub przekaż PROJECT_ID.
- Nazwa usługi: wybierz _SERVICE_NAME (np. snajperrr-service)
- Region: np. europe-west1

2) Sekrety (bardzo ważne)
- Nie commituj plików .env ani kluczy do repo.
- Dla klucza VITE_GEMINI_API_KEY utwórz Secret w Secret Manager i nadaj dostęp kontu Cloud Build/Cloud Run.

3) Wdrażanie przez Cloud Build
- Z poziomu konsoli GCP -> Cloud Build -> "Trigger build" użyj tego repo i podaj substytucje:
  - _SERVICE_NAME: nazwa usługi
  - _REGION: region
- Cloud Build zbuduje i wypchnie obraz, a następnie wdroży na Cloud Run.

4) Wdrażanie lokalne (docker)
- docker build -t myapp:latest .
- docker run -e PORT=8080 -p 8080:8080 myapp:latest

5) Co sprawdzić po wdrożeniu
- Upewnij się, że zmienne środowiskowe (VITE_GEMINI_API_KEY i klucze serwerowe) są ustawione w Cloud Run (preferuj Secret Manager).
- Endpoint /api/health powinien zwrócić "OK".

6) Dodatkowe uwagi
- Repo zawiera folder node_modules w historii — zalecam usunięcie go z repo (git rm -r --cached node_modules) i wypchnięcie commita.
- Jeśli używasz pnpm, upewnij się że Cloud Build ma dostęp do pnpm (corepack jest aktywowany w Dockerfile).
