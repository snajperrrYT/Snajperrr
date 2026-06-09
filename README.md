Spis funkcji i komend bota — SnajperBot
Poniżej znajduje się spis funkcji i komend bota znalezionych w repozytorium. Lista może być niekompletna — jeśli chcesz pełny, dokładny spis (plik po pliku) mogę przeskanować katalog i wygenerować kompletną listę.temp_discordbot/commands

Repozytorium: snajperrrYT/Snajperrr Link do przeglądu repo (więcej wyników): https://github.com/snajperrrYT/Snajperrr/tree/cb96016d60b8d92bb945550bf24a2a73c2f00e21

Krótkie podsumowanie
Typ projektu: Discord bot (Node.js) + front-end React/TypeScript
Liczba komend (wg README): ~155 (uwaga: Discord global limit = 100 komend)
Główne katalogi: (bot, komendy), (frontend UI)temp_discordbot/src/
Wymagane zmienne środowiskowe
DISCORD_BOT_TOKEN
CLIENT_ID
OPENAI_API_KEY (opcjonalnie)
YOUTUBE_API_KEY / YOUTUBE_COOKIES (opcjonalnie)
GUILD_ID (opcjonalnie, do rejestracji wszystkich komend lokalnie)
Jak uruchomić (skrót)
Git Clone https://github.com/snajperrrYT/Snajperrr.git
CD temp_discordbot
Instalacja npm
Utwórz na podstawie .env.env.example
Zarejestruj slash-komendy: (lub z GUILD_ID)node registerCommands.js
Uruchom: node index.js
Kategorie komend (znalezione w kodzie / README)
Poniżej podaję zebrane z repo przykłady komend pogrupowane według kategorii. Nie wszystkie pliki mogły zostać odnalezione — lista może być uzupełniona na życzenie.

Gry / Rozrywka
/automaty, /poker, /blackjack, /mem, /żart, /kot
Zastosowanie
/ping, /help, /calc, /userstats
Muzyka
/play, /download, historia odtwarzanych utworów (UI: HistoryTab)
AI / Integracje
/chat, /ask, /code (wymaga OPENAI_API_KEY)
Ekonomia (znalezione pliki)
/równowaga, /codziennie, /praca
/rob (temp_discordbot/polecenia/ekonomia/rob.js) — komenda do "kradzieży" gotówki (odnowienie 1h)
/hack (temp_discordbot/polecenia/ekonomia/hack.js) — komenda do "zhakowania" banku (czas odnowienia 90 min)
Moderacja / Admin (fragmenty w src/adminCommands.ts)
/ban, /kop, /wycisz się, /ostrzeżenie, /tempban
/lockdown, /odblokowuj, /purge, /nuk
/announce, /userinfo, /serverinfo
/createvoucher (tworzenie voucherów/premii)
Vouchery / Premia
createvoucher, ustawienia premium w UI (SettingsTab.tsx)
Pliki i miejsca warte sprawdzenia
temp_discordbot/README.md — instrukcja instalacji, konfiguracji i uwagi o rejestracji komend
temp_discordbot/.env.example — przykładowe zmienne środowiskowe
temp_discordbot/.replit — konfiguracja uruchomienia / wdrażanie
temp_discordbot/commands/ — katalog z komendami (ekonomia, muzyka, rozrywka itp.)
src/ — frontend (Sidebar, HistoryTab, SettingsTab, adminCommands)
Bezpieczeństwo / uwagi
Nie dodawaj tokenów/kluczy do repo (używaj i )..env.gitignore
Privileged Gateway Intents (Server Members, Message Content) wymagają zgody i mają implikacje prywatności.
Komendy typu "rob" i "hack" są rozrywkowe — upewnij się, że użytkownicy rozumieją ich charakter.
Jeśli chcesz, mogę przeskanować kod pod kątem potencjalnych wycieków sekretów lub niebezpiecznych operacji.
Jeśli chcesz kompletny spis (każdy plik w z nazwą komendy i krótkim opisem) wybierz jedną z opcji:temp_discordbot/commands

A) Wygeneruj pełny spis komend i dodaj go do repo jako (zrób to teraz)COMMANDS.md
B) Tylko wygeneruj plik lokalnie do podglądu (nie commitować)
C) Najpierw przeskanuj repo pod kątem potencjalnych problemów bezpieczeństwa
Napisz, którą opcję wybierasz.
